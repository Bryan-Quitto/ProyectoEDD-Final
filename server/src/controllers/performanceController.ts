import { Request, Response } from 'express';
import { PerformanceService } from '../services/performanceService';

const performanceService = new PerformanceService();

export const PerformanceController = {
  async getStudentStats(req: Request, res: Response) {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ data: null, error: { message: 'ID del estudiante es requerido' } });
    }

    const result = await performanceService.getStudentStats(studentId);
    
    if (result.error) {
      return res.status(500).json(result);
    }
    return res.status(200).json(result);
  }
};