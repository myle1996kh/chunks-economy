import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Award, Crown, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinBadge } from "@/components/ui/CoinBadge";
import { useLeaderboard, useUserRank } from "@/hooks/useLeaderboard";
import { useAuth } from "@/context/AuthContext";

const Leaderboard = () => {
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = useLeaderboard(50);
  const { data: userRank } = useUserRank(user?.id);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/10 to-gray-500/5 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/10 to-amber-700/5 border-amber-600/30";
      default:
        return "bg-card border-border/50";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Top learners by total score
            </p>
          </div>
        </div>

        {/* User's Rank */}
        {userRank && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">#{userRank}</span>
                    </div>
                    <div>
                      <p className="font-medium">Your Rank</p>
                      <p className="text-sm text-muted-foreground">Keep practicing to climb higher!</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-3">
          {leaderboard?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No rankings yet. Be the first to practice and earn points!
                </p>
              </CardContent>
            </Card>
          ) : (
            leaderboard?.map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`${getRankStyle(entry.rank)} ${
                  entry.userId === user?.id ? "ring-2 ring-primary" : ""
                }`}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-10 flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={entry.avatarUrl || undefined} />
                        <AvatarFallback className="bg-secondary text-lg">
                          {entry.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name & Stats */}
                      <div className="flex-1">
                        <p className="font-semibold">
                          {entry.displayName}
                          {entry.userId === user?.id && (
                            <span className="ml-2 text-xs text-primary">(You)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{entry.practiceCount} practices</span>
                          <span>Avg: {entry.avgScore}%</span>
                        </div>
                      </div>

                      {/* Score & Coins */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {entry.totalScore.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.coins.toLocaleString()} C
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
