import { Request, Response } from 'express';
import { LessonService } from '../services/lessonService';

export class LessonController {
  private lessonService = new LessonService();

  public createLesson = async (req: Request, res: Response) => {
    const result = await this.lessonService.create(req.body);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  };

  public getLessonById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.lessonService.getById(id);
    if (result.error || !result.data) {
      return res.status(404).json({ data: null, error: { message: 'Lección no encontrada' } });
    }
    return res.status(200).json(result);
  };

  public getLessonsByModule = async (req: Request, res: Response) => {
    const { moduleId } = req.params;
    const result = await this.lessonService.getByModuleId(moduleId);
    if (result.error) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  };

  public updateLesson = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.lessonService.update(id, req.body);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  };

  public deleteLesson = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.lessonService.remove(id);
    if (result.error) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  };
}