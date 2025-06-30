import { Router } from 'express';
// import authRoutes from './authRoutes'; // <--- LÍNEA ELIMINADA
import courseRoutes from './courseRoutes';
import recommendationRoutes from './recommendationRoutes';
import moduleRoutes from './moduleRoutes';
import lessonRoutes from './lessonRoutes'; 
import evaluationRoutes from './evaluationRoutes';
import performanceRoutes from './performanceRoutes';
import enrollmentRoutes from './enrollmentRoutes';
import userRoutes from './userRoutes';
import moduleSupportResourceRoutes from './moduleSupportResourceRoutes';

const router = Router();

// router.use('/auth', authRoutes); // <--- LÍNEA ELIMINADA
router.use('/courses', courseRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/performance', performanceRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/users', userRoutes);
router.use('/module-resources', moduleSupportResourceRoutes);

export default router;