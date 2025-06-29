import { Router } from 'express';
import { RecommendationController } from '../controllers/RecommendationController';

const router = Router();

router.post('/generate/:studentId', RecommendationController.generateRecommendations);
router.get('/student/:studentId', RecommendationController.getStudentRecommendations);
router.patch('/:recommendationId/read', RecommendationController.markAsRead);
router.patch('/:recommendationId/applied', RecommendationController.markAsApplied);
router.post('/performance', RecommendationController.updatePerformanceState);
router.get('/tree/stats', RecommendationController.getTreeStats);

export default router;