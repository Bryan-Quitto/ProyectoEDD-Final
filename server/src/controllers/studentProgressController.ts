import { Request, Response } from 'express';
import { StudentProgressService } from '../services/studentProgressService';
import type { User } from '@plataforma-educativa/types';

const studentProgressService = new StudentProgressService();

interface AuthenticatedRequest extends Request {
  user?: Partial<User>;
}

export const StudentProgressController = {
  async markLessonAsCompleted(req: AuthenticatedRequest, res: Response) {
    const { lessonId } = req.body;
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ data: null, error: { message: "No autenticado" } });
    }
    if (!lessonId) {
      return res.status(400).json({ data: null, error: { message: 'ID de la lección es requerido' } });
    }

    const result = await studentProgressService.markLessonAsCompleted(studentId, lessonId);
    
    if (result.error) {
      return res.status(500).json(result);
    }
    return res.status(200).json(result);
  }
};