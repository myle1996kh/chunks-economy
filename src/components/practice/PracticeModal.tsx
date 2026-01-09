import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Volume2, 
  Mic, 
  Square, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CoinBadge } from "@/components/ui/CoinBadge";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useTranscribe, useAnalyzeSpeech, useSavePractice, SpeechAnalysisResult } from "@/hooks/usePractice";
import { useCoinConfig } from "@/hooks/useCoinWallet";
import { useWallet } from "@/hooks/useUserData";
import { toast } from "sonner";

interface PracticeItem {
  english: string;
  vietnamese: string;
  mastered?: boolean;
}

interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonName: string;
  category: string;
  items: PracticeItem[];
}

export const PracticeModal = ({
  isOpen,
  onClose,
  lessonId,
  lessonName,
  category,
  items,
}: PracticeModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEnglish, setShowEnglish] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SpeechAnalysisResult | null>(null);
  const [coinChange, setCoinChange] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);

  const recorder = useAudioRecorder();
  const tts = useTextToSpeech();
  const transcribe = useTranscribe();
  const analyze = useAnalyzeSpeech();
  const savePractice = useSavePractice();
  const { data: coinConfig } = useCoinConfig();
  const { data: wallet } = useWallet();

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setShowEnglish(false);
      setAnalysisResult(null);
      setCoinChange(null);
      recorder.resetRecording();
    }
  }, [isOpen]);

  const handleListen = () => {
    if (tts.isSpeaking) {
      tts.stop();
    } else {
      tts.speak(currentItem.english);
    }
  };

  const handleStartRecording = async () => {
    try {
      setAnalysisResult(null);
      setCoinChange(null);
      setRecordingStartTime(Date.now());
      await recorder.startRecording();
    } catch (error) {
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const handleStopRecording = async () => {
    setIsAnalyzing(true);
    const latency = Date.now() - recordingStartTime;
    
    try {
      await recorder.stopRecording();
      const audioBase64 = await recorder.getAudioBase64();
      
      if (!audioBase64) {
        throw new Error("No audio recorded");
      }

      // Transcribe the audio
      const transcriptionResult = await transcribe.mutateAsync(audioBase64);
      
      // Calculate metrics based on recording
      const metrics = {
        volume: -25 + Math.random() * 10, // Simulated, would come from audio analysis
        speechRate: transcriptionResult.wordsPerMinute,
        pauseCount: Math.floor(Math.random() * 3),
        longestPause: Math.floor(Math.random() * 1000),
        latency: Math.min(latency, 3000),
        endIntensity: 70 + Math.random() * 30
      };

      // Analyze speech
      const result = await analyze.mutateAsync({
        transcription: transcriptionResult.transcript,
        metrics
      });

      setAnalysisResult(result);

      // Calculate coin reward/penalty
      const score = result.score;
      let coins = 0;
      
      if (coinConfig) {
        if (score >= (coinConfig.reward_score_threshold || 70)) {
          coins = Math.round(
            coinConfig.reward_min + 
            ((score - 70) / 30) * (coinConfig.reward_max - coinConfig.reward_min)
          );
        } else if (score < (coinConfig.penalty_score_threshold || 50)) {
          coins = -Math.round(
            coinConfig.penalty_min + 
            ((50 - score) / 50) * (coinConfig.penalty_max - coinConfig.penalty_min)
          );
        }
      } else {
        // Default calculation
        coins = score >= 70 ? Math.floor(score / 10) : -5;
      }

      setCoinChange(coins);

      // Save practice result
      await savePractice.mutateAsync({
        lessonId,
        category,
        itemIndex: currentIndex,
        score,
        coinsEarned: coins,
        metrics: result.metrics
      });

    } catch (error: any) {
      console.error("Error analyzing speech:", error);
      toast.error(error.message || "Failed to analyze speech");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnalysisResult(null);
      setCoinChange(null);
      setShowEnglish(false);
      recorder.resetRecording();
    } else {
      // Completed all items
      toast.success("Practice session complete! 🎉");
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAnalysisResult(null);
      setCoinChange(null);
      setShowEnglish(false);
      recorder.resetRecording();
    }
  };

  const handleRetry = () => {
    setAnalysisResult(null);
    setCoinChange(null);
    recorder.resetRecording();
  };

  if (!isOpen) return null;

  const isLastItem = currentIndex === items.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl bg-card rounded-3xl border border-border/50 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-lg">{lessonName}</h2>
              <p className="text-sm text-muted-foreground">{category}</p>
            </div>
            <div className="flex items-center gap-3">
              <CoinBadge amount={wallet?.balance || 0} showChange={coinChange || undefined} />
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 py-3 bg-secondary/30">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Item {currentIndex + 1} of {items.length}
              </span>
              <span className="font-medium text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Vietnamese Text */}
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-2">Say this in English:</p>
              <motion.p 
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-display font-semibold text-foreground"
              >
                {currentItem.vietnamese}
              </motion.p>
            </div>

            {/* English Reference */}
            <div className="mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEnglish(!showEnglish)}
                className="mx-auto flex items-center gap-2 text-muted-foreground"
              >
                {showEnglish ? <EyeOff size={16} /> : <Eye size={16} />}
                {showEnglish ? "Hide Answer" : "Show Answer"}
              </Button>
              <AnimatePresence>
                {showEnglish && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center mt-4 p-4 rounded-xl bg-secondary/30 border border-border/50"
                  >
                    <p className="text-lg text-primary">{currentItem.english}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Volume Indicator while recording */}
            {recorder.isRecording && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                  <span className="text-sm text-muted-foreground">
                    Recording... {Math.round(recorder.recordingTime / 1000)}s
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    style={{ width: `${recorder.volume}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Analysis Result */}
            {analysisResult && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-8"
              >
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl ${
                    analysisResult.score >= 70 
                      ? "bg-success/10 border border-success/30" 
                      : "bg-destructive/10 border border-destructive/30"
                  }`}>
                    {analysisResult.score >= 70 ? (
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    ) : (
                      <XCircle className="w-8 h-8 text-destructive" />
                    )}
                    <span className={`text-4xl font-display font-bold ${
                      analysisResult.score >= 70 ? "text-success" : "text-destructive"
                    }`}>
                      {analysisResult.score}
                    </span>
                    <span className="text-muted-foreground">points</span>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Object.entries(analysisResult.metrics).map(([key, value]) => (
                    <div key={key} className="text-center p-2 rounded-lg bg-secondary/30">
                      <div className="text-xs text-muted-foreground capitalize">{key}</div>
                      <div className={`text-sm font-semibold ${
                        value >= 70 ? "text-success" : value >= 50 ? "text-warning" : "text-destructive"
                      }`}>
                        {value}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback */}
                {analysisResult.feedback.length > 0 && (
                  <div className="p-3 rounded-xl bg-secondary/20 text-sm">
                    {analysisResult.feedback.map((fb, i) => (
                      <p key={i} className="text-muted-foreground">{fb}</p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleListen}
                disabled={isAnalyzing}
                className="gap-2"
              >
                <Volume2 size={20} className={tts.isSpeaking ? "animate-pulse" : ""} />
                {tts.isSpeaking ? "Speaking..." : "Listen"}
              </Button>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  onClick={recorder.isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isAnalyzing}
                  className={`gap-2 w-40 ${
                    recorder.isRecording 
                      ? "bg-destructive hover:bg-destructive/90" 
                      : "gradient-primary text-primary-foreground"
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : recorder.isRecording ? (
                    <>
                      <Square size={20} />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic size={20} />
                      Record
                    </>
                  )}
                </Button>
              </motion.div>

              {analysisResult && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRetry}
                  className="gap-2"
                >
                  <RotateCcw size={20} />
                  Retry
                </Button>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="p-6 border-t border-border/50 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentIndex === 0 || recorder.isRecording || isAnalyzing}
              className="gap-2"
            >
              <ChevronLeft size={20} />
              Previous
            </Button>
            <Button
              variant="default"
              onClick={handleNext}
              disabled={recorder.isRecording || isAnalyzing}
              className="gap-2"
            >
              {isLastItem ? "Complete" : "Next"}
              <ChevronRight size={20} />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
