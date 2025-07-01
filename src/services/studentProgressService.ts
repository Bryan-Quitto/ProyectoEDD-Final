import api from './api';
import type { ApiResponse, StudentProgress } from '@plataforma-educativa/types';

export const studentProgressService = {
  async markLessonAsCompleted(studentId: string, lessonId: string, courseId: string): Promise<ApiResponse<StudentProgress>> {
    const payload = {
      studentId,
      lessonId,
      courseId
    };
    return api.post('/recommendations/progress/complete', payload);
  }
};