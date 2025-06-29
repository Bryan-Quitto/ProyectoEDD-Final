import { Request, Response } from 'express';
import { EvaluationService } from '../services/evaluationService';

export class EvaluationController {
  private evaluationService: EvaluationService;

  constructor() {
    this.evaluationService = new EvaluationService();
  }

  createEvaluation = async (req: Request, res: Response) => {
    const result = await this.evaluationService.create(req.body);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  };

  getEvaluationById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.evaluationService.getById(id);
    if (result.error) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  };
  
  getEvaluationsByLesson = async (req: Request, res: Response) => {
    const { lessonId } = req.params;
    const result = await this.evaluationService.getByLessonId(lessonId);
    if (result.error) {
        return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };

  updateEvaluation = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.evaluationService.update(id, req.body);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };

  deleteEvaluation = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.evaluationService.remove(id);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };
}