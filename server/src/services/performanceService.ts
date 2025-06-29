import { supabase } from '../config/supabaseAdmin';
import type { StudentStats, ApiResponse } from '@plataforma-educativa/types';

export class PerformanceService {
  async getStudentStats(studentId: string): Promise<ApiResponse<StudentStats>> {
    try {
      const [enrollments, progress, attempts] = await Promise.all([
        supabase
          .from('enrollments')
          .select('id', { count: 'exact' })
          .eq('student_id', studentId),
        supabase
          .from('student_progress')
          .select('id', { count: 'exact' })
          .eq('student_id', studentId)
          .eq('status', 'completed'),
        supabase
          .from('evaluation_attempts')
          .select('percentage')
          .eq('student_id', studentId),
      ]);

      if (enrollments.error || progress.error || attempts.error) {
        let errorMessage = "Error al consultar las estadísticas. ";
        if (enrollments.error) errorMessage += `(Enrollments: ${enrollments.error.message}) `;
        if (progress.error) errorMessage += `(Progress: ${progress.error.message}) `;
        if (attempts.error) errorMessage += `(Attempts: ${attempts.error.message}) `;
        throw new Error(errorMessage);
      }

      const coursesInProgress = enrollments.count ?? 0;
      const lessonsCompleted = progress.count ?? 0;

      let averageScore: number | null = null;
      if (attempts.data && attempts.data.length > 0) {
        const validAttempts = attempts.data.filter((a: {percentage: number | null}) => typeof a.percentage === 'number');
        if (validAttempts.length > 0) {
          const totalPercentage = validAttempts.reduce((sum: number, a: {percentage: number}) => sum + a.percentage, 0);
          averageScore = Math.round(totalPercentage / validAttempts.length);
        }
      }

      const stats: StudentStats = {
        coursesInProgress,
        lessonsCompleted,
        averageScore,
      };

      return { data: stats, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      return { data: null, error: { message } };
    }
  }
}