import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalScore: number;
  practiceCount: number;
  avgScore: number;
  coins: number;
  rank: number;
}

export const useLeaderboard = (limit = 50) => {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url');

      if (profilesError) throw profilesError;

      // Get practice history aggregated by user
      const { data: practiceData, error: practiceError } = await supabase
        .from('practice_history')
        .select('user_id, score');

      if (practiceError) throw practiceError;

      // Get wallets for coin balance
      const { data: wallets, error: walletsError } = await supabase
        .from('user_wallets')
        .select('user_id, balance');

      if (walletsError) throw walletsError;

      // Aggregate practice data by user
      const userStats: Record<string, { totalScore: number; practiceCount: number }> = {};
      practiceData?.forEach(practice => {
        if (!userStats[practice.user_id]) {
          userStats[practice.user_id] = { totalScore: 0, practiceCount: 0 };
        }
        userStats[practice.user_id].totalScore += practice.score;
        userStats[practice.user_id].practiceCount += 1;
      });

      // Create wallet lookup
      const walletLookup: Record<string, number> = {};
      wallets?.forEach(wallet => {
        walletLookup[wallet.user_id] = wallet.balance;
      });

      // Build leaderboard entries
      const entries: LeaderboardEntry[] = profiles
        .map(profile => {
          const stats = userStats[profile.id] || { totalScore: 0, practiceCount: 0 };
          return {
            userId: profile.id,
            displayName: profile.display_name || 'Anonymous',
            avatarUrl: profile.avatar_url,
            totalScore: stats.totalScore,
            practiceCount: stats.practiceCount,
            avgScore: stats.practiceCount > 0 
              ? Math.round(stats.totalScore / stats.practiceCount) 
              : 0,
            coins: walletLookup[profile.id] || 0,
            rank: 0
          };
        })
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      return entries;
    }
  });
};

export const useUserRank = (userId?: string) => {
  return useQuery({
    queryKey: ['user-rank', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get all users' total scores
      const { data: practiceData, error } = await supabase
        .from('practice_history')
        .select('user_id, score');

      if (error) throw error;

      // Aggregate by user
      const userTotals: Record<string, number> = {};
      practiceData?.forEach(practice => {
        userTotals[practice.user_id] = (userTotals[practice.user_id] || 0) + practice.score;
      });

      // Sort and find rank
      const sortedUsers = Object.entries(userTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([id], index) => ({ userId: id, rank: index + 1 }));

      const userRank = sortedUsers.find(u => u.userId === userId);
      return userRank?.rank || null;
    },
    enabled: !!userId
  });
};
