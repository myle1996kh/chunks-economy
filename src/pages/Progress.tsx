import { motion } from "framer-motion";
import { 
  Target, 
  TrendingUp, 
  Clock,
  Trophy,
  History,
  Loader2
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStats } from "@/hooks/usePractice";
import { useStreak } from "@/hooks/useStreak";
import { StreakDisplay } from "@/components/ui/StreakDisplay";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const Progress = () => {
  const { data: userStats, isLoading } = useUserStats();
  const { data: streakData } = useStreak();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Achievement thresholds
  const achievements = [
    {
      id: "streak-3",
      icon: Trophy,
      name: "3-Day Streak",
      description: "Practice 3 days in a row",
      unlocked: (streakData?.current_streak || 0) >= 3
    },
    {
      id: "practice-10",
      icon: Target,
      name: "First 10 Practices",
      description: "Complete 10 practice sessions",
      unlocked: (userStats?.totalPractice || 0) >= 10
    },
    {
      id: "score-80",
      icon: TrendingUp,
      name: "High Performer",
      description: "Maintain 80%+ average score",
      unlocked: (userStats?.avgScore || 0) >= 80
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-2">
              Your Progress
            </h1>
            <p className="text-muted-foreground">
              Track your learning journey
            </p>
          </motion.div>

          {/* Streak Card - Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <StreakDisplay streak={streakData} />
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-6"
          >
            <Card>
              <CardContent className="py-4 text-center">
                <Target className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{userStats?.totalPractice || 0}</div>
                <div className="text-xs text-muted-foreground">Practices</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="text-2xl font-bold">{userStats?.avgScore || 0}%</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold">{userStats?.practiceHours || 0}h</div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="w-5 h-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userStats?.recentHistory && userStats.recentHistory.length > 0 ? (
                    <div className="space-y-3">
                      {userStats.recentHistory.slice(0, 5).map((history: any, i: number) => (
                        <div 
                          key={i} 
                          className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                        >
                          <div>
                            <div className="text-sm font-medium">{history.category}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(history.practiced_at), { addSuffix: true })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "text-sm font-bold",
                              history.score >= 70 ? "text-success" : "text-muted-foreground"
                            )}>
                              {history.score}%
                            </div>
                            <div className={cn(
                              "text-xs",
                              history.coins_earned >= 0 ? "text-success" : "text-destructive"
                            )}>
                              {history.coins_earned >= 0 ? "+" : ""}{history.coins_earned}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No activity yet. Start practicing!
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="w-5 h-5 text-primary" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {achievements.map((achievement) => {
                      const Icon = achievement.icon;
                      return (
                        <div 
                          key={achievement.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all",
                            achievement.unlocked 
                              ? "bg-primary/10 border-primary/30" 
                              : "bg-muted/20 border-border/30 opacity-60"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            achievement.unlocked 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{achievement.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {achievement.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Progress;