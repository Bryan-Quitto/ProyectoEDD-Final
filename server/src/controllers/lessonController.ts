import { Request, Response } from 'express';
import { LessonService } from '../services/lessonService';

const lessonService = new LessonService();

export const LessonController = {
  async createLesson(req: Request, res: Response): Promise<void> {
    const result = await lessonService.create(req.body);

    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(201).json(result);
    }
  },

  async getLessonById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await lessonService.getById(id);
    if (result.error || !result.data) {
      res.status(404).json({ data: null, error: { message: 'Lección no encontrada' } });
    } else {
      res.status(200).json(result);
    }
  },

  async getLessonsByModule(req: Request, res: Response): Promise<void> {
    const { moduleId } = req.params;
    const result = await lessonService.getByModuleId(moduleId);
    if (result.error) {
      res.status(404).json(result);
    } else {
      res.status(200).json(result);
    }
  },

  async updateLesson(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await lessonService.update(id, req.body);
    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  },

  async deleteLesson(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await lessonService.remove(id);
    if (result.error) {
      res.status(404).json(result);
    } else {
      res.status(200).json(result);
    }
  }
};