import { Request, Response } from 'express';
import { LessonService } from '../services/lessonService';

const lessonService = new LessonService();

export const LessonController = {
  async createLesson(req: Request, res: Response) {
        console.log("[CONTROLLER-BE] Petición recibida en createLesson. Body:", JSON.stringify(req.body, null, 2));

    const result = await lessonService.create(req.body);
    console.log("[CONTROLLER-BE] Resultado del lessonService:", result);

    if (result.error) return res.status(400).json(result);
    return res.status(201).json(result);
  },

  async getLessonById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await lessonService.getById(id);
    if (result.error || !result.data) return res.status(404).json({ data: null, error: { message: 'Lección no encontrada' } });
    return res.status(200).json(result);
  },

  async getLessonsByModule(req: Request, res: Response) {
    const { moduleId } = req.params;
    const result = await lessonService.getByModuleId(moduleId);
    if (result.error) return res.status(404).json(result);
    return res.status(200).json(result);
  },

  async updateLesson(req: Request, res: Response) {
    const { id } = req.params;
    const result = await lessonService.update(id, req.body);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async deleteLesson(req: Request, res: Response) {
    const { id } = req.params;
    const result = await lessonService.remove(id);
    if (result.error) return res.status(404).json(result);
    return res.status(200).json(result);
  }
};