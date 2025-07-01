import { Request, Response } from 'express';
import { supabase } from '../config/supabaseAdmin';
import type { ApiResponse, PaginatedResponse, Recommendation } from '@plataforma-educativa/types';
import { RecommendationService } from '../services/RecommendationService';
import { evaluationService } from '../services/evaluationService';

const recommendationService = new RecommendationService();

export const RecommendationController = {
  async generateForLessonCompletion(req: Request, res: Response): Promise<void> {
    console.log('\n--- [BE] INICIO: Marcando lección como completada ---');
    try {
        const { studentId, lessonId } = req.body;
        console.log(`[BE] Recibido - StudentID: ${studentId}, LessonID: ${lessonId}`);

        if (!studentId || !lessonId) {
            console.error('[BE] ERROR: Faltan studentId o lessonId en el body.');
            res.status(400).json({ data: null, error: { message: 'studentId y lessonId son requeridos.' } });
            return;
        }

        const now = new Date().toISOString();
        
        const payloadToUpsert = {
            student_id: studentId,
            lesson_id: lessonId,
            status: 'completed',
            progress_percentage: 100,
            completed_at: now,
            updated_at: now,
            time_spent: 0, // Valor por defecto, se puede mejorar después
            last_accessed: now, 
        };

        console.log('[BE] Preparando para hacer "upsert" con el siguiente payload:', payloadToUpsert);

        const { data, error } = await supabase
            .from('student_progress')
            .upsert(payloadToUpsert, {
                onConflict: 'student_id, lesson_id',
            })
            .select()
            .single();

        console.log('[BE] Respuesta de Supabase:', { data, error });

        if (error) {
            console.error("[BE] ERROR de Supabase durante el upsert:", error);
            throw new Error('No se pudo guardar el progreso en la base de datos.');
        }

        console.log('[BE] ÉXITO: Upsert realizado correctamente. Fila afectada:', data);
        console.log('--- [BE] FIN: Marcando lección como completada ---\n');
        
        res.status(200).json({ data, error: null });

    } catch (error) {
        console.error("[BE] ERROR CATASTRÓFICO en el bloque catch:", error);
        res.status(500).json({ data: null, error: { message: (error as Error).message } });
    }
  },

  // ... (el resto de las funciones del controlador permanecen igual)

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