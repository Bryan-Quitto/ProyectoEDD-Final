import { supabase } from '../config/supabaseAdmin';
import type { ApiResponse, StudentProgress } from '@plataforma-educativa/types';

export class StudentProgressService {
  
  private async invokeModuleCompletionFunction(studentId: string, lessonId: string) {
    try {
      const { error } = await supabase.functions.invoke('process-module-completion', {
        body: { student_id: studentId, lesson_id: lessonId },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error al invocar la Edge Function process-module-completion:', error);
    }
  }
  
  async markLessonAsCompleted(studentId: string, lessonId: string): Promise<ApiResponse<StudentProgress>> {
    try {
      const progressData = {
        student_id: studentId,
        lesson_id: lessonId,
        status: 'completed' as const,
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('student_progress')
        .upsert(progressData, { onConflict: 'student_id,lesson_id' })
        .select()
        .single();
      
      if (error) throw error;

      // Invocamos la Edge Function en segundo plano (sin esperar la respuesta)
      this.invokeModuleCompletionFunction(studentId, lessonId);

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al marcar la lección como completada.';
      return { data: null, error: { message } };
    }
  }
}