import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Flame,
  Mic,
  Loader2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useUserData";
import { useCourses, useEnrollments, useCourseLessons } from "@/hooks/useCourses";
import { useUserStats } from "@/hooks/usePractice";
import { CoinBadge } from "@/components/ui/CoinBadge";
import { useWallet } from "@/hooks/useUserData";

const Index = () => {
  const { data: profile } = useProfile();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: userStats } = useUserStats();
  const { data: wallet } = useWallet();

  const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
  const firstEnrolledCourse = courses?.find(c => enrolledCourseIds.includes(c.id));

  const { data: lessons } = useCourseLessons(firstEnrolledCourse?.id || null);

  // Find next lesson to practice (first one with items)
  const nextLesson = lessons?.[0];

  const isLoading = coursesLoading || enrollmentsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasEnrolledCourses = enrolledCourseIds.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-3xl mx-auto">
          {/* Compact Header with Stats */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                  Hey, {profile?.display_name?.split(' ')[0] || "there"} 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                  {hasEnrolledCourses 
                    ? "Ready for today's practice?" 
                    : "Let's get you started with a course"
                  }
                </p>
              </div>
              <CoinBadge amount={wallet?.balance || 0} size="lg" />
            </div>

            {/* Minimal Stats Row */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{userStats?.streak || 0} days</div>
                  <div className="text-xs text-muted-foreground">streak</div>
                </div>
              </div>
              
              {userStats?.avgScore && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{userStats.avgScore}%</div>
                    <div className="text-xs text-muted-foreground">avg score</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Primary CTA - Start Practice */}
          {hasEnrolledCourses && nextLesson ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Link to={`/practice?lesson=${nextLesson.id}`}>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6 lg:p-8 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-primary">Continue Learning</span>
                      </div>
                      <h2 className="text-xl lg:text-2xl font-display font-bold text-foreground mb-2">
                        {nextLesson.lesson_name}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {Object.keys(nextLesson.categories || {}).length} categories • 
                        {Object.values(nextLesson.categories || {}).reduce((sum: number, items: any) => sum + items.length, 0)} items
                      </p>
                    </div>
                    
                    <Button size="lg" className="gradient-primary glow-primary gap-2 shrink-0">
                      Start Practice
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ) : !hasEnrolledCourses ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Link to="/courses">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/30 p-6 lg:p-8 cursor-pointer transition-all hover:border-accent/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-accent" />
                        <span className="text-sm font-medium text-accent">Get Started</span>
                      </div>
                      <h2 className="text-xl lg:text-2xl font-display font-bold text-foreground mb-2">
                        Enroll in Your First Course
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Browse available courses and start learning
                      </p>
                    </div>
                    
                    <Button size="lg" className="gradient-gold gap-2">
                      Browse Courses
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ) : null}

          {/* Quick Lesson List */}
          {hasEnrolledCourses && lessons && lessons.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">
                  All Lessons
                </h2>
                <Link to="/courses" className="text-sm text-primary hover:underline">
                  View all →
                </Link>
              </div>

              <div className="space-y-2">
                {lessons.slice(0, 5).map((lesson, index) => (
                  <Link key={lesson.id} to={`/practice?lesson=${lesson.id}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="group flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card hover:border-border/50 transition-all cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {lesson.order_index}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {lesson.lesson_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {Object.keys(lesson.categories || {}).length} categories
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;