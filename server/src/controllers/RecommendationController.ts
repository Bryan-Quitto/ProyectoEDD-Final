import { Request, Response } from 'express';
import { RecommendationService } from '../services/RecommendationService';
import type { ApiResponse } from '@plataforma-educativa/types';

const recommendationService = new RecommendationService();

export const RecommendationController = {
  async generateRecommendations(req: Request, res: Response) {
    const { studentId, courseId } = req.params;
    if (!studentId || !courseId) return res.status(400).json({ data: null, error: { message: 'ID del estudiante y del curso son requeridos' } });
    
    const result = await recommendationService.generateRecommendationsForStudent(studentId, courseId);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async getStudentRecommendations(req: Request, res: Response) {
    const { studentId } = req.params;
    const { page = '1', limit = '10', onlyUnread = 'false' } = req.query;
    if (!studentId) return res.status(400).json({ data: null, error: { message: 'ID del estudiante es requerido' } });

    const result = await recommendationService.getStudentRecommendations(studentId, parseInt(page as string), parseInt(limit as string), onlyUnread === 'true');
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async markAsRead(req: Request, res: Response) {
    const { recommendationId } = req.params;
    if (!recommendationId) return res.status(400).json({ data: null, error: { message: 'ID de la recomendación es requerido' } });

    const result = await recommendationService.markRecommendationAsRead(recommendationId);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async markAsApplied(req: Request, res: Response) {
    const { recommendationId } = req.params;
    if (!recommendationId) return res.status(400).json({ data: null, error: { message: 'ID de la recomendación es requerido' } });

    const result = await recommendationService.markRecommendationAsApplied(recommendationId);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async updatePerformanceState(req: Request, res: Response) {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) return res.status(400).json({ data: null, error: { message: 'ID del estudiante y del curso son requeridos' } });

    const result = await recommendationService.updateStudentPerformanceState(studentId, courseId);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async getTreeStats(req: Request, res: Response) {
    const stats = recommendationService.getDecisionTreeStats();
    const apiResponse: ApiResponse<any> = { data: stats, error: null };
    return res.status(200).json(apiResponse);
  }
};