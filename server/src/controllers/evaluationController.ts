import { Request, Response } from 'express';
import { EvaluationService } from '../services/evaluationService';
import type { User } from '@plataforma-educativa/types';

const evaluationService = new EvaluationService();

interface AuthenticatedRequest extends Request {
  user?: Partial<User>;
}

export const EvaluationController = {
  async getAttempts(req: Request, res: Response) {
    const { evaluationId } = req.params;
    const { student_id } = req.query; 
    if (!student_id) {
      return res.status(400).json({ data: null, error: { message: "Falta el student_id" } });
    }
    const result = await evaluationService.getAttempts(evaluationId, student_id as string);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async submitAttempt(req: AuthenticatedRequest, res: Response) {
    const { evaluationId } = req.params;
    const { answers } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ data: null, error: { message: "No autenticado" } });
    }
    
    if (!answers) {
       return res.status(400).json({ data: null, error: { message: "Faltan las respuestas" } });
    }

    const result = await evaluationService.submitAttempt(evaluationId, req.user.id, answers);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async createEvaluation(req: Request, res: Response) {
    const result = await evaluationService.create(req.body);
    if (result.error) return res.status(400).json(result);
    return res.status(201).json(result);
  },

  async getEvaluationById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await evaluationService.getById(id);
    if (result.error) return res.status(404).json(result);
    return res.status(200).json(result);
  },
  
  async getEvaluationsByLesson(req: Request, res: Response) {
    const { lessonId } = req.params;
    const result = await evaluationService.getByLessonId(lessonId);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async updateEvaluation(req: Request, res: Response) {
    const { id } = req.params;
    const result = await evaluationService.update(id, req.body);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async deleteEvaluation(req: Request, res: Response) {
    const { id } = req.params;
    const result = await evaluationService.remove(id);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  }
};