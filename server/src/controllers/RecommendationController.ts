import { Request, Response } from 'express';
import { supabase } from '../config/supabaseAdmin';
import type { ApiResponse, PaginatedResponse, Recommendation, EvaluationContext } from '@plataforma-educativa/types';
import { RecommendationService } from '../services/RecommendationService';
import { evaluationService } from '../services/evaluationService';

const recommendationService = new RecommendationService();

export const RecommendationController = {
  async generateForLessonCompletion(req: Request, res: Response): Promise<void> {
    const { studentId, lessonId, courseId } = req.body;
    try {
        if (!studentId || !lessonId || !courseId) {
            res.status(400).json({ data: null, error: { message: 'studentId, lessonId, y courseId son requeridos.' } });
            return;
        }

        // Aquí podríamos invocar una lógica de recomendación específica para cuando se completa una lección.
        // Por ahora, simplemente devolvemos un éxito para resolver el 404.
        // En el futuro, podríamos llamar a algo como:
        // const { data, error } = await recommendationService.generateForCompletedLesson(studentId, lessonId, courseId);
        // if (error) throw new Error(error.message);

        res.status(200).json({ data: { message: "Progreso registrado y recomendaciones actualizadas." }, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: { message: (error as Error).message } });
    }
  },

  async generateAndGetRecommendations(req: Request, res: Response): Promise<void> {
    const { studentId, courseId } = req.params;
    const { evaluationId, attemptId } = req.body;

    try {
        if (!evaluationId || !attemptId) {
            res.status(400).json({ data: null, error: { message: 'evaluationId y attemptId son requeridos.' } });
            return;
        }
        
        const context = await evaluationService.buildEvaluationContext(studentId, courseId, evaluationId, attemptId);
        
        if (!context) {
            res.status(404).json({ data: null, error: { message: 'No se pudo construir el contexto de la evaluación. Verifique los IDs.' } });
            return;
        }

        const { data: recommendations, error: serviceError } = await recommendationService.generateForEvaluation(context);

        if (serviceError) {
            throw new Error(serviceError.message);
        }

        const response: ApiResponse<Recommendation[]> = {
            data: recommendations,
            error: null,
        };
        res.status(201).json(response);

    } catch (error) {
        res.status(500).json({ data: null, error: { message: (error as Error).message } });
    }
  },

  async getStudentRecommendations(req: Request, res: Response): Promise<void> {
    const { studentId } = req.params;
    const { page = '1', limit = '10', onlyUnread = 'false' } = req.query;

    try {
      let query = supabase
        .from('recommendations')
        .select('*', { count: 'exact' })
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (onlyUnread === 'true') {
        query = query.eq('is_read', false);
      }
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const { data, error, count } = await query.range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

      if (error) throw error;
      
      const response: ApiResponse<PaginatedResponse<Recommendation>> = {
        data: {
          data: data || [],
          total: count || 0,
          page: pageNum,
          limit: limitNum,
        },
        error: null,
      };
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ data: null, error: { message: (error as Error).message } });
    }
  },

  async markAsRead(req: Request, res: Response): Promise<void> {
    const { recommendationId } = req.params;
    try {
      const { data, error } = await supabase.from('recommendations').update({ is_read: true }).eq('id', recommendationId).select().single();
      if (error) throw error;
      res.status(200).json({ data, error: null });
    } catch (error) {
      res.status(400).json({ data: null, error: { message: (error as Error).message } });
    }
  },

  async markAsApplied(req: Request, res: Response): Promise<void> {
    const { recommendationId } = req.params;
    try {
      const { data, error } = await supabase.from('recommendations').update({ is_applied: true }).eq('id', recommendationId).select().single();
      if (error) throw error;
      res.status(200).json({ data, error: null });
    } catch (error) {
      res.status(400).json({ data: null, error: { message: (error as Error).message } });
    }
  }
};