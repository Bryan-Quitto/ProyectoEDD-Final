import { Router } from 'express';
import { RecommendationController } from '../controllers/RecommendationController';

const router = Router();
const recommendationController = new RecommendationController();

// Rutas para recomendaciones
router.post('/generate/:studentId', recommendationController.generateRecommendations);
router.get('/student/:studentId', recommendationController.getStudentRecommendations);
router.patch('/:recommendationId/read', recommendationController.markAsRead);
router.patch('/:recommendationId/applied', recommendationController.markAsApplied);
router.post('/performance', recommendationController.updatePerformanceState);
router.get('/tree/stats', recommendationController.getTreeStats);

export default router;