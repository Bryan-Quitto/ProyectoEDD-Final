import { supabase } from '../config/supabaseAdmin';
import type { ApiResponse, StudentProgress } from '@plataforma-educativa/types';

export class StudentProgressService {
  async markLessonAsCompleted(studentId: string, lessonId: string): Promise<ApiResponse<StudentProgress>> {
    try {
      const progressData = {
        student_id: studentId,
        lesson_id: lessonId,
        status: 'completed' as const,
        progress_percentage: 100,
        time_spent: 0, // Podríamos mejorarlo en el futuro
        completed_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('student_progress')
        .upsert(progressData, { onConflict: 'student_id,lesson_id' })
        .select()
        .single();
      
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al marcar la lección como completada.';
      return { data: null, error: { message } };
    }
  }
}