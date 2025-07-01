import { Request, Response } from 'express';
import { StudentProgressService } from '../services/studentProgressService';
import type { User } from '@plataforma-educativa/types';

const studentProgressService = new StudentProgressService();

interface AuthenticatedRequest extends Request {
  user?: Partial<User>;
}

export const StudentProgressController = {
  async markLessonAsCompleted(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { lessonId } = req.body;
    const studentId = req.user?.id;

    if (!studentId) {
      res.status(401).json({ data: null, error: { message: "No autenticado" } });
      return;
    }
    if (!lessonId) {
      res.status(400).json({ data: null, error: { message: 'ID de la lección es requerido' } });
      return;
    }

    const result = await studentProgressService.markLessonAsCompleted(studentId, lessonId);
    
    if (result.error) {
      res.status(500).json(result);
    } else {
      res.status(200).json(result);
    }
  }
};