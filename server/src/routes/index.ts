import { Router } from 'express';
import authRoutes from './authRoutes';
import courseRoutes from './courseRoutes';
import recommendationRoutes from './recommendationRoutes';
import moduleRoutes from './moduleRoutes';
import lessonRoutes from './lessonRoutes'; 
import evaluationRoutes from './evaluationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/evaluations', evaluationRoutes);

export default router;