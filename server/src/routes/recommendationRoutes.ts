import { Router } from 'express';
import { RecommendationController } from '../controllers/RecommendationController';
import { StudentProgressController } from '../controllers/studentProgressController';

const router = Router();

router.post('/generate/student/:studentId/course/:courseId', RecommendationController.generateRecommendations);

router.get('/student/:studentId', RecommendationController.getStudentRecommendations);
router.patch('/:recommendationId/read', RecommendationController.markAsRead);
router.patch('/:recommendationId/applied', RecommendationController.markAsApplied);

router.post('/performance', RecommendationController.updatePerformanceState);
router.get('/tree/stats', RecommendationController.getTreeStats);

router.post('/progress/complete', StudentProgressController.markLessonAsCompleted);


export default router;