import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface PracticeHistory {
  id: string;
  user_id: string;
  lesson_id: string;
  category: string;
  item_index: number;
  score: number;
  coins_earned: number;
  audio_url: string | null;
  metrics: Record<string, number> | null;
  practiced_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  category: string;
  item_index: number;
  attempts: number;
  best_score: number;
  mastery_level: number;
  last_practiced_at: string | null;
}

export interface SpeechAnalysisResult {
  score: number;
  metrics: {
    volume: number;
    speechRate: number;
    pauses: number;
    latency: number;
    endIntensity: number;
  };
  rawMetrics: {
    volume: number;
    speechRate: number;
    pauseCount: number;
    longestPause: number;
    latency: number;
    endIntensity: number;
  };
  transcription: string;
  feedback: string[];
}

// Fetch user's practice history
export const usePracticeHistory = (lessonId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['practice-history', user?.id, lessonId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('practice_history')
        .select('*')
        .eq('user_id', user.id)
        .order('practiced_at', { ascending: false });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as PracticeHistory[];
    },
    enabled: !!user?.id
  });
};

// Fetch user's progress for a lesson
export const useUserProgress = (lessonId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-progress', user?.id, lessonId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserProgress[];
    },
    enabled: !!user?.id
  });
};

// Fetch user's overall stats
export const useUserStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get practice history for stats
      const { data: history, error: historyError } = await supabase
        .from('practice_history')
        .select('score, practiced_at, coins_earned')
        .eq('user_id', user.id)
        .order('practiced_at', { ascending: false });

      if (historyError) throw historyError;

      // Calculate stats
      const totalPractice = history?.length || 0;
      const avgScore = totalPractice > 0
        ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / totalPractice)
        : 0;

      // Calculate streak (consecutive days)
      let streak = 0;
      if (history && history.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const practiceDays = new Set(
          history.map(h => {
            const date = new Date(h.practiced_at);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
          })
        );

        let checkDate = today.getTime();
        while (practiceDays.has(checkDate)) {
          streak++;
          checkDate -= 24 * 60 * 60 * 1000;
        }
      }

      // Calculate practice time this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeekPractice = history?.filter(
        h => new Date(h.practiced_at) >= weekAgo
      ).length || 0;
      const practiceHours = Math.round((thisWeekPractice * 2) / 60); // Estimate 2 min per practice

      return {
        totalPractice,
        avgScore,
        streak,
        practiceHours,
        recentHistory: history?.slice(0, 10) || []
      };
    },
    enabled: !!user?.id
  });
};

// Transcribe audio using Deepgram
export const useTranscribe = () => {
  return useMutation({
    mutationFn: async (audioBase64: string) => {
      const { data, error } = await supabase.functions.invoke('deepgram-transcribe', {
        body: { audio: audioBase64 }
      });

      if (error) throw error;
      return data as {
        wordCount: number;
        duration: number;
        transcript: string;
        wordsPerMinute: number;
      };
    }
  });
};

// Analyze speech and get score
export const useAnalyzeSpeech = () => {
  return useMutation({
    mutationFn: async (params: {
      transcription: string;
      metrics: {
        volume: number;
        speechRate: number;
        pauseCount: number;
        longestPause: number;
        latency: number;
        endIntensity: number;
      };
    }) => {
      const { data, error } = await supabase.functions.invoke('analyze-speech', {
        body: params
      });

      if (error) throw error;
      return data as SpeechAnalysisResult;
    }
  });
};

// Save practice result
export const useSavePractice = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      lessonId: string;
      category: string;
      itemIndex: number;
      score: number;
      coinsEarned: number;
      metrics?: Record<string, number>;
      audioUrl?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // 1. Save practice history
      const { error: historyError } = await supabase
        .from('practice_history')
        .insert({
          user_id: user.id,
          lesson_id: params.lessonId,
          category: params.category,
          item_index: params.itemIndex,
          score: params.score,
          coins_earned: params.coinsEarned,
          metrics: params.metrics as unknown as Json,
          audio_url: params.audioUrl
        });

      if (historyError) throw historyError;

      // 2. Update or create user progress
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', params.lessonId)
        .eq('category', params.category)
        .eq('item_index', params.itemIndex)
        .maybeSingle();

      if (existingProgress) {
        const newBestScore = Math.max(existingProgress.best_score, params.score);
        const newMastery = calculateMastery(existingProgress.attempts + 1, newBestScore);

        await supabase
          .from('user_progress')
          .update({
            attempts: existingProgress.attempts + 1,
            best_score: newBestScore,
            mastery_level: newMastery,
            last_practiced_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            lesson_id: params.lessonId,
            category: params.category,
            item_index: params.itemIndex,
            attempts: 1,
            best_score: params.score,
            mastery_level: calculateMastery(1, params.score),
            last_practiced_at: new Date().toISOString()
          });
      }

      // 3. Update wallet if coins earned
      if (params.coinsEarned !== 0) {
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (wallet) {
          const newBalance = wallet.balance + params.coinsEarned;
          const newTotalEarned = params.coinsEarned > 0 
            ? wallet.total_earned + params.coinsEarned 
            : wallet.total_earned;
          const newTotalSpent = params.coinsEarned < 0 
            ? wallet.total_spent + Math.abs(params.coinsEarned) 
            : wallet.total_spent;

          await supabase
            .from('user_wallets')
            .update({
              balance: Math.max(0, newBalance),
              total_earned: newTotalEarned,
              total_spent: newTotalSpent
            })
            .eq('user_id', user.id);

          // Create transaction record
          await supabase
            .from('coin_transactions')
            .insert({
              user_id: user.id,
              amount: params.coinsEarned,
              transaction_type: params.coinsEarned > 0 ? 'practice_reward' : 'practice_penalty',
              description: `Practice: ${params.category} - Score ${params.score}`,
              reference_id: params.lessonId
            });
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['coin-transactions'] });
    },
    onError: (error) => {
      toast.error(`Failed to save practice: ${error.message}`);
    }
  });
};

// Helper to calculate mastery level (0-5)
function calculateMastery(attempts: number, bestScore: number): number {
  if (bestScore >= 90 && attempts >= 3) return 5;
  if (bestScore >= 80 && attempts >= 2) return 4;
  if (bestScore >= 70) return 3;
  if (bestScore >= 50) return 2;
  if (attempts >= 1) return 1;
  return 0;
}
