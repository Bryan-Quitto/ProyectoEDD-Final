import { Router } from 'express';
import { PerformanceController } from '../controllers/performanceController';

const router = Router();

router.get('/stats/:studentId', PerformanceController.getStudentStats);

export default router;