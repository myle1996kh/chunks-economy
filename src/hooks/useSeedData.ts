import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EREL_COURSE, EREL_LESSONS } from '@/data/erelCourse';
import { toast } from 'sonner';

export const useSeedERELCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Check if EREL course already exists
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('code', 'EREL')
        .maybeSingle();

      if (existingCourse) {
        throw new Error('EREL course already exists');
      }

      // Create the course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          code: EREL_COURSE.code,
          name: EREL_COURSE.name,
          description: EREL_COURSE.description,
          is_active: EREL_COURSE.is_active
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Create all lessons
      const lessonsToInsert = EREL_LESSONS.map(lesson => ({
        course_id: course.id,
        lesson_name: lesson.lesson_name,
        order_index: lesson.order_index,
        categories: lesson.categories
      }));

      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonsToInsert);

      if (lessonsError) throw lessonsError;

      return { course, lessonsCount: lessonsToInsert.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['all-lessons'] });
      toast.success(`EREL course created with ${data.lessonsCount} lessons!`);
    },
    onError: (error) => {
      toast.error(`Failed to seed EREL: ${error.message}`);
    }
  });
};
