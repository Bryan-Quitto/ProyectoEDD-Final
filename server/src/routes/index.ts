import { Router } from 'express';
import courseRoutes from './courseRoutes';
import recommendationRoutes from './recommendationRoutes';
import moduleRoutes from './moduleRoutes';
import lessonRoutes from './lessonRoutes'; 
import evaluationRoutes from './evaluationRoutes';
import performanceRoutes from './performanceRoutes';
import enrollmentRoutes from './enrollmentRoutes';
import userRoutes from './userRoutes';
import moduleSupportResourceRoutes from './moduleSupportResourceRoutes';
import studentProgressRoutes from './studentProgressRoutes';
import submissionRoutes from './submissionRoutes';

const router = Router();

router.use('/courses', courseRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/performance', performanceRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/users', userRoutes);
router.use('/module-resources', moduleSupportResourceRoutes);
router.use('/progress', studentProgressRoutes);
router.use('/submissions', submissionRoutes);

export default router;