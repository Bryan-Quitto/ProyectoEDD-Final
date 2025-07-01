import api from './api';
import type { Recommendation, PaginatedResponse, ApiResponse } from '@plataforma-educativa/types';

export const recommendationService = {
  async generateForEvaluation(studentId: string, courseId: string, evaluationId: string, attemptId: string): Promise<ApiResponse<Recommendation[]>> {
    const payload = { evaluationId, attemptId };
    return api.post(`/recommendations/generate/student/${studentId}/course/${courseId}`, payload);
  },
  
  async getStudentRecommendations(studentId: string, page: number = 1, limit: number = 10, onlyUnread: boolean = false): Promise<ApiResponse<PaginatedResponse<Recommendation>>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      onlyUnread: String(onlyUnread),
    });
    return api.get(`/recommendations/student/${studentId}?${params.toString()}`);
  },
  
  async markAsRead(recommendationId: string): Promise<ApiResponse<Recommendation>> {
    return api.patch(`/recommendations/${recommendationId}/read`, {});
  },

  async markAsApplied(recommendationId: string): Promise<ApiResponse<Recommendation>> {
    return api.patch(`/recommendations/${recommendationId}/applied`, {});
  }
};