import { Request, Response } from 'express';
import { EvaluationService } from '../services/evaluationService';
import type { User, Evaluation } from '@plataforma-educativa/types';

const evaluationService = new EvaluationService();

interface AuthenticatedRequest extends Request {
  user?: Partial<User>;
}

export const EvaluationController = {
  async getAttempts(req: Request, res: Response): Promise<void> {
    const { evaluationId } = req.params;
    const { student_id } = req.query;
    if (!student_id) {
      res.status(400).json({ data: null, error: { message: "Falta el student_id" } });
      return;
    }
    const result = await evaluationService.getAttempts(evaluationId, student_id as string);
    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  },

  async submitAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { evaluationId } = req.params;
    const { answers } = req.body;
    if (!req.user || !req.user.id) {
      res.status(401).json({ data: null, error: { message: "No autenticado" } });
      return;
    }
    if (!answers) {
      res.status(400).json({ data: null, error: { message: "Faltan las respuestas" } });
      return;
    }
    const result = await evaluationService.submitAttempt(evaluationId, req.user.id, answers);
    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  },

  async getEvaluationsByModule(req: Request, res: Response): Promise<void> {
    const { moduleId } = req.params;
    const { type } = req.query;
    const result = await evaluationService.getByModuleId(moduleId, type as Evaluation['evaluation_type']);
    if (result.error) {
      res.status(404).json(result);
    } else {
      res.status(200).json(result);
    }
  },

  async createEvaluation(req: Request, res: Response): Promise<void> {
    const result = await evaluationService.create(req.body);
    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(201).json(result);
    }
  },

  async getEvaluationById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await evaluationService.getById(id);
    if (result.error) {
      res.status(404).json(result);
    } else {
      res.status(200).json(result);
    }
  },
  
  async getEvaluationsByLesson(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;
    const result = await evaluationService.getByLessonId(lessonId);
    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  },

  async updateEvaluation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await evaluationService.update(id, req.body);
    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  },

  async deleteEvaluation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await evaluationService.remove(id);
    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  }
};