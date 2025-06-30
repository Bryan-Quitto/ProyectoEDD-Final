import type { Recommendation, PaginatedResponse, ApiResponse } from '@plataforma-educativa/types';

export const recommendationService = {
  async generateForCourse(studentId: string, courseId: string): Promise<ApiResponse<Recommendation[]>> {
    try {
      const response = await fetch(`/api/recommendations/generate/student/${studentId}/course/${courseId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al generar recomendaciones');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },

  async getStudentRecommendations(studentId: string, page: number = 1, limit: number = 10, onlyUnread: boolean = false): Promise<ApiResponse<PaginatedResponse<Recommendation>>> {
    try {
      const response = await fetch(`/api/recommendations/student/${studentId}?page=${page}&limit=${limit}&onlyUnread=${onlyUnread}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al obtener recomendaciones');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },
  
  async markAsRead(recommendationId: string): Promise<ApiResponse<Recommendation>> {
    try {
      const response = await fetch(`/api/recommendations/${recommendationId}/read`, { method: 'PATCH' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al marcar como leída');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  },

  async markAsApplied(recommendationId: string): Promise<ApiResponse<Recommendation>> {
    try {
      const response = await fetch(`/api/recommendations/${recommendationId}/applied`, { method: 'PATCH' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Error al marcar como aplicada');
      }
      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de red';
      return { data: null, error: { message } };
    }
  }
};