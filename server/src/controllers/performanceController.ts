import { Request, Response } from 'express';
import { PerformanceService } from '../services/performanceService';

const performanceService = new PerformanceService();

export const PerformanceController = {
  async getStudentStats(req: Request, res: Response): Promise<void> {
    const { studentId } = req.params;
    if (!studentId) {
      res.status(400).json({ data: null, error: { message: 'ID del estudiante es requerido' } });
      return;
    }

    const result = await performanceService.getStudentStats(studentId);
    
    if (result.error) {
      res.status(500).json(result);
    } else {
      res.status(200).json(result);
    }
  }
};