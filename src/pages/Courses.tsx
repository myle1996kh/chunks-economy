import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Loader2, CheckCircle2, ArrowRight, Mic } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCourses, useEnrollments, useCourseLessons, useEnrollInCourse } from "@/hooks/useCourses";
import { cn } from "@/lib/utils";

const Courses = () => {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const enrollInCourse = useEnrollInCourse();
  
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [enrollDialogCourse, setEnrollDialogCourse] = useState<typeof courses[0] | null>(null);

  const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
  const selectedCourse = courses?.find(c => c.id === selectedCourseId);
  
  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(selectedCourseId);

  const isLoading = coursesLoading || enrollmentsLoading;

  const confirmEnroll = () => {
    if (enrollDialogCourse) {
      enrollInCourse.mutate(enrollDialogCourse.id);
      setEnrollDialogCourse(null);
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
                                  <Badge variant="outline" className="mt-1">{course.code}</Badge>
                                </div>
                              </div>
                              {course.description && (
                                <CardDescription className="mt-3 line-clamp-2">
                                  {course.description}
                                </CardDescription>
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
            // Lessons View
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
                  {lessons?.map((lesson, index) => (
                    <Link key={lesson.id} to={`/practice?lesson=${lesson.id}`}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * index }}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:bg-card hover:border-primary/30 transition-all cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                          {lesson.order_index}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {lesson.lesson_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {Object.keys(lesson.categories || {}).slice(0, 3).map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button size="sm" className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Mic className="w-4 h-4" />
                          Practice
                        </Button>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Enrollment Confirmation Dialog */}
      <Dialog open={!!enrollDialogCourse} onOpenChange={() => setEnrollDialogCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll in {enrollDialogCourse?.name}?</DialogTitle>
            <DialogDescription>
              You'll get access to all lessons and practice materials in this course.
            </DialogDescription>
          </DialogHeader>
          
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