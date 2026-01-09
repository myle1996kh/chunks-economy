import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EREL_LESSONS_DATA } from '@/data/lessons';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export const EREL_COURSE = {
  code: "EREL",
  name: "EREL Listening",
  description: "Master everyday English through real-world conversations, street food adventures, and practical business scenarios. 15 comprehensive lessons with vocabulary, phrases, and sentences.",
  is_active: true
};

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

      // Create all lessons from the imported JSON data
      const lessonsToInsert = EREL_LESSONS_DATA.map((lesson, index) => ({
        course_id: course.id,
        lesson_name: lesson.lesson_name,
        order_index: index + 1,
        categories: lesson.categories as unknown as Json
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
      toast.success(`EREL Listening course created with ${data.lessonsCount} lessons!`);
    },
    onError: (error) => {
      toast.error(`Failed to seed EREL: ${error.message}`);
    }
  });
};
