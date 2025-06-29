import { Request, Response } from 'express';
import { EvaluationService } from '../services/evaluationService';

const evaluationService = new EvaluationService();

export const EvaluationController = {
  async submitAttempt(req: Request, res: Response) {
      const { evaluationId } = req.params;
      const { student_id, answers } = req.body;

      if (!student_id || !answers) {
          return res.status(400).json({ data: null, error: { message: "Faltan datos del estudiante o las respuestas." } });
      }

      const result = await evaluationService.submitAttempt(evaluationId, student_id, answers);
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