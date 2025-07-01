import { Request, Response } from 'express';
import { EnrollmentService } from '../services/enrollmentService';

const enrollmentService = new EnrollmentService();

export const EnrollmentController = {
  async createEnrollment(req: Request, res: Response): Promise<void> {
    const { student_id, course_id } = req.body;

    if (!student_id || !course_id) {
      res.status(400).json({ data: null, error: { message: 'student_id y course_id son requeridos' } });
      return;
    }

    const result = await enrollmentService.create({ student_id, course_id });

    if (result.error) {
      res.status(result.error.status || 500).json(result);
    } else {
      res.status(201).json(result);
    }
  },

  async getStudentsByCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    if (!courseId) {
      res.status(400).json({ data: null, error: { message: 'El ID del curso es requerido.' } });
      return;
    }

    const result = await enrollmentService.getStudentsByCourse(courseId);

    if (result.error) {
      res.status(500).json(result);
    } else {
      res.status(200).json(result);
    }
  }
};