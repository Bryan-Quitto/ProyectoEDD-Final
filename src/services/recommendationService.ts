import axios from 'axios';
import type { Recommendation, PerformanceState, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class RecommendationService {
  static async generateRecommendations(studentId: string): Promise<ApiResponse<Recommendation[]>> {
    const response = await api.post(`/recommendations/generate/${studentId}`);
    return response.data;
  }

  static async getRecommendations(studentId: string): Promise<ApiResponse<Recommendation[]>> {
    const response = await api.get(`/recommendations/${studentId}`);
    return response.data;
  }

  static async markAsRead(recommendationId: string): Promise<ApiResponse<Recommendation>> {
    const response = await api.put(`/recommendations/${recommendationId}/read`);
    return response.data;
  }

  static async markAsApplied(recommendationId: string): Promise<ApiResponse<Recommendation>> {
    const response = await api.put(`/recommendations/${recommendationId}/applied`);
    return response.data;
  }

  static async updatePerformanceState(
    studentId: string, 
    performanceState: Partial<PerformanceState>
  ): Promise<ApiResponse<PerformanceState>> {
    const response = await api.put(`/recommendations/performance/${studentId}`, performanceState);
    return response.data;
  }

  static async getTreeStats(): Promise<ApiResponse<{ depth: number; nodeCount: number }>> {
    const response = await api.get('/recommendations/tree/stats');
    return response.data;
  }
}