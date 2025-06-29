import { Request, Response } from 'express';
import { LessonService } from '../services/lessonService';

export class LessonController {
  private lessonService: LessonService;

  constructor() {
    this.lessonService = new LessonService();
  }

  createLesson = async (req: Request, res: Response) => {
    const result = await this.lessonService.create(req.body);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  };

  getLessonById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.lessonService.getById(id);
    if (result.error) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  };
  
  getLessonsByModule = async (req: Request, res: Response) => {
    const { moduleId } = req.params;
    const result = await this.lessonService.getByModuleId(moduleId);
    if (result.error) {
        return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };

  updateLesson = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.lessonService.update(id, req.body);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };

  deleteLesson = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.lessonService.remove(id);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };
}