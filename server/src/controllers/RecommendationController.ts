import { Request, Response } from 'express';
import { RecommendationService } from '../services/RecommendationService';

export class RecommendationController {
  private recommendationService: RecommendationService;

  constructor() {
    this.recommendationService = new RecommendationService();
  }

  // Generar recomendaciones para un estudiante
  generateRecommendations = async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: 'ID del estudiante es requerido'
        });
      }

      const result = await this.recommendationService.generateRecommendationsForStudent(studentId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in generateRecommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };

  // Obtener recomendaciones de un estudiante
  getStudentRecommendations = async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { page = '1', limit = '10', onlyUnread = 'false' } = req.query;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: 'ID del estudiante es requerido'
        });
      }

      const result = await this.recommendationService.getStudentRecommendations(
        studentId,
        parseInt(page as string),
        parseInt(limit as string),
        onlyUnread === 'true'
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getStudentRecommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };

  // Marcar recomendación como leída
  markAsRead = async (req: Request, res: Response) => {
    try {
      const { recommendationId } = req.params;
      
      if (!recommendationId) {
        return res.status(400).json({
          success: false,
          error: 'ID de la recomendación es requerido'
        });
      }

      const result = await this.recommendationService.markRecommendationAsRead(recommendationId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in markAsRead:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };

  // Marcar recomendación como aplicada
  markAsApplied = async (req: Request, res: Response) => {
    try {
      const { recommendationId } = req.params;
      
      if (!recommendationId) {
        return res.status(400).json({
          success: false,
          error: 'ID de la recomendación es requerido'
        });
      }

      const result = await this.recommendationService.markRecommendationAsApplied(recommendationId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in markAsApplied:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };

  // Actualizar estado de rendimiento
  updatePerformanceState = async (req: Request, res: Response) => {
    try {
      const { studentId, courseId } = req.body;
      
      if (!studentId || !courseId) {
        return res.status(400).json({
          success: false,
          error: 'ID del estudiante y del curso son requeridos'
        });
      }

      const result = await this.recommendationService.updateStudentPerformanceState(studentId, courseId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in updatePerformanceState:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };

  // Obtener estadísticas del árbol de decisión
  getTreeStats = async (req: Request, res: Response) => {
    try {
      const stats = this.recommendationService.getDecisionTreeStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Estadísticas del árbol de decisión obtenidas'
      });
    } catch (error) {
      console.error('Error in getTreeStats:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };
}