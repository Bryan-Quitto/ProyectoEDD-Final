import type { ApiResponse, StudentProgress } from '@plataforma-educativa/types';
import { supabase } from './supabase';

export const studentProgressService = {
  async markLessonAsCompleted(lessonId: string): Promise<ApiResponse<StudentProgress>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { data: null, error: { message: "No hay una sesión activa." } };
      }

      const response = await fetch(`/api/recommendations/progress/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ lessonId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al marcar la lección como completada');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },
};