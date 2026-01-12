import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Loader2, CheckCircle2, ArrowRight, Mic, Calendar, Clock } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCourses, useEnrollments, useCourseLessons, useEnrollInCourse, Course } from "@/hooks/useCourses";
import { useProgressStats } from "@/hooks/useProgressStats";
import { formatScheduleDays, calculateLessonDeadlines, getDeadlineStatus } from "@/lib/scheduleUtils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const Courses = () => {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: progressStats } = useProgressStats();
  const enrollInCourse = useEnrollInCourse();
  
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [enrollDialogCourse, setEnrollDialogCourse] = useState<Course | null>(null);
  const [enrollStartDate, setEnrollStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
  const selectedCourse = courses?.find(c => c.id === selectedCourseId);
  const selectedEnrollment = enrollments?.find(e => e.course_id === selectedCourseId);
  
  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(selectedCourseId);

  // Calculate deadlines for selected course
  const lessonDeadlines = selectedEnrollment?.start_date && lessons && selectedCourse
    ? calculateLessonDeadlines(
        selectedEnrollment.start_date,
        selectedCourse.schedule_days || ['monday', 'wednesday', 'friday'],
        lessons.map(l => ({ id: l.id, lesson_name: l.lesson_name, order_index: l.order_index }))
      )
    : null;

  // Get lesson progress
  const getLessonProgress = (lessonId: string) => {
    const courseProgress = progressStats?.courses?.find(c => c.courseId === selectedCourseId);
    return courseProgress?.lessons.find(l => l.lessonId === lessonId);
  };

  const isLoading = coursesLoading || enrollmentsLoading;

  const confirmEnroll = () => {
    if (enrollDialogCourse) {
      enrollInCourse.mutate({ 
        courseId: enrollDialogCourse.id,
        startDate: enrollStartDate 
      });
      setEnrollDialogCourse(null);
      setEnrollStartDate(format(new Date(), 'yyyy-MM-dd'));
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
      <Sidebar />
      
      <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-2">
              Courses
            </h1>
            <p className="text-muted-foreground">
              {selectedCourse ? `${selectedCourse.name} • ${lessons?.length || 0} lessons` : "Browse and enroll in courses"}
            </p>
          </motion.div>

          {/* Course Cards or Lessons */}
          {!selectedCourseId ? (
            // Course Selection View
            <div className="grid gap-4">
              {courses?.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No courses available yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                courses?.map((course, index) => {
                  const isEnrolled = enrolledCourseIds.includes(course.id);
                  const enrollment = enrollments?.find(e => e.course_id === course.id);
                  
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "group cursor-pointer transition-all hover:border-primary/50",
                        isEnrolled && "border-primary/30 bg-primary/5"
                      )}
                      onClick={() => isEnrolled ? setSelectedCourseId(course.id) : setEnrollDialogCourse(course)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                  <BookOpen className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg">{course.name}</CardTitle>
                                    {isEnrolled && (
                                      <Badge className="bg-primary/20 text-primary border-0">
                                        <CheckCircle2 size={12} className="mr-1" />
                                        Enrolled
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">{course.code}</Badge>
                                    {course.schedule_days && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatScheduleDays(course.schedule_days)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {course.description && (
                                <CardDescription className="mt-3 line-clamp-2">
                                  {course.description}
                                </CardDescription>
                              )}
                              {isEnrolled && enrollment?.start_date && (
                                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Started: {format(new Date(enrollment.start_date), 'MMM d, yyyy')}
                                </div>
                              )}
                            </div>
                            
                            <Button 
                              variant={isEnrolled ? "secondary" : "default"}
                              className={!isEnrolled ? "gradient-primary" : ""}
                            >
                              {isEnrolled ? "View Lessons" : "Enroll"}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          ) : (
            // Lessons View with Progress & Deadlines
            <div>
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={() => setSelectedCourseId(null)}
              >
                ← Back to Courses
              </Button>
              
              {lessonsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : lessons?.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No lessons in this course yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {lessons?.map((lesson, index) => {
                    const progress = getLessonProgress(lesson.id);
                    const deadline = lessonDeadlines?.find(d => d.lessonId === lesson.id);
                    const deadlineStatus = deadline ? getDeadlineStatus(deadline) : null;
                    const isComplete = progress?.completionPercent === 100;

                    return (
                      <Link key={lesson.id} to={`/practice?lesson=${lesson.id}`}>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.03 * index }}
                          className={cn(
                            "group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                            isComplete 
                              ? "bg-success/5 border-success/30 hover:border-success/50" 
                              : "bg-card border-border/50 hover:border-primary/30"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                            isComplete 
                              ? "bg-success/20 text-success" 
                              : "gradient-primary text-primary-foreground"
                          )}>
                            {isComplete ? <CheckCircle2 className="w-6 h-6" /> : lesson.order_index}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {lesson.lesson_name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              {progress && progress.completionPercent > 0 ? (
                                <div className="flex items-center gap-2 max-w-[100px]">
                                  <Progress value={progress.completionPercent} className="h-1.5" />
                                  <span className="text-xs text-muted-foreground">
                                    {progress.completionPercent}%
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {Object.keys(lesson.categories || {}).slice(0, 2).map((cat) => (
                                    <Badge key={cat} variant="secondary" className="text-xs">
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Deadline & Score */}
                          <div className="flex items-center gap-3 shrink-0">
                            {deadline && !isComplete && (
                              <Badge 
                                variant={deadlineStatus?.variant} 
                                className={cn("text-xs gap-1", deadlineStatus?.className)}
                              >
                                <Clock className="w-3 h-3" />
                                {deadlineStatus?.label}
                              </Badge>
                            )}
                            
                            {progress && progress.avgScore > 0 && (
                              <span className={cn(
                                "text-sm font-medium",
                                progress.avgScore >= 80 ? "text-success" : 
                                progress.avgScore >= 60 ? "text-warning" : "text-muted-foreground"
                              )}>
                                {progress.avgScore}%
                              </span>
                            )}
                            
                            <Button size="sm" className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Mic className="w-4 h-4" />
                              Practice
                            </Button>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Enrollment Dialog with Start Date */}
      <Dialog open={!!enrollDialogCourse} onOpenChange={() => setEnrollDialogCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll in {enrollDialogCourse?.name}</DialogTitle>
            <DialogDescription>
              Set your personal start date to calculate lesson deadlines based on the course schedule.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Your Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={enrollStartDate}
                onChange={(e) => setEnrollStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lesson deadlines will be calculated from this date
              </p>
            </div>
            
            {enrollDialogCourse?.schedule_days && (
              <div className="p-3 rounded-lg bg-secondary/30 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Schedule: {formatScheduleDays(enrollDialogCourse.schedule_days)}</span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEnrollDialogCourse(null)}>
              Cancel
            </Button>
            <Button onClick={confirmEnroll} disabled={enrollInCourse.isPending}>
              {enrollInCourse.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Enroll Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;
