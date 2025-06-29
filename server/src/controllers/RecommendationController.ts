import { Request, Response } from 'express';
import { RecommendationService } from '../services/RecommendationService';
import type { ApiResponse } from '@plataforma-educativa/types';

export class RecommendationController {
  private recommendationService: RecommendationService;

  constructor() {
    this.recommendationService = new RecommendationService();
  }

  generateRecommendations = async (req: Request, res: Response) => {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ data: null, error: { message: 'ID del estudiante es requerido' } });
    }
    
    const result = await this.recommendationService.generateRecommendationsForStudent(studentId);
    
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };

  getStudentRecommendations = async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const { page = '1', limit = '10', onlyUnread = 'false' } = req.query;

    if (!studentId) {
      return res.status(400).json({ data: null, error: { message: 'ID del estudiante es requerido' } });
    }

    const result = await this.recommendationService.getStudentRecommendations(
      studentId,
      parseInt(page as string),
      parseInt(limit as string),
      onlyUnread === 'true'
    );
    
    if (result.error) {
        return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };

  markAsRead = async (req: Request, res: Response) => {
    const { recommendationId } = req.params;
    if (!recommendationId) {
      return res.status(400).json({ data: null, error: { message: 'ID de la recomendación es requerido' } });
    }

    const result = await this.recommendationService.markRecommendationAsRead(recommendationId);

    if (result.error) {
        return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };

  markAsApplied = async (req: Request, res: Response) => {
    const { recommendationId } = req.params;
    if (!recommendationId) {
      return res.status(400).json({ data: null, error: { message: 'ID de la recomendación es requerido' } });
    }

    const result = await this.recommendationService.markRecommendationAsApplied(recommendationId);

    if (result.error) {
        return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };

  updatePerformanceState = async (req: Request, res: Response) => {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ data: null, error: { message: 'ID del estudiante y del curso son requeridos' } });
    }

    const result = await this.recommendationService.updateStudentPerformanceState(studentId, courseId);
    
    if (result.error) {
        return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };

  getTreeStats = async (req: Request, res: Response) => {
    const stats = this.recommendationService.getDecisionTreeStats();
    const apiResponse: ApiResponse<any> = { data: stats, error: null };
    return res.status(200).json(apiResponse);
  };
}