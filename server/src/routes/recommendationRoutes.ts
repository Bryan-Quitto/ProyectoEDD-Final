import { Router } from 'express';
import { RecommendationController } from '../controllers/RecommendationController';
import { authMiddleware, checkRole } from '../middleware/authMiddleware';

const router = Router();

router.post(
    '/generate/student/:studentId/course/:courseId',
    authMiddleware,
    checkRole(['student', 'teacher', 'admin']),
    RecommendationController.generateAndGetRecommendations
);

router.post(
    '/progress/complete',
    authMiddleware,
    checkRole(['student']),
    RecommendationController.generateForLessonCompletion
);

router.get(
    '/student/:studentId', 
    authMiddleware, 
    checkRole(['student', 'teacher']), 
    RecommendationController.getStudentRecommendations
);
router.patch(
    '/:recommendationId/read', 
    authMiddleware, 
    checkRole(['student']),
    RecommendationController.markAsRead
);
router.patch(
    '/:recommendationId/applied', 
    authMiddleware, 
    checkRole(['student']),
    RecommendationController.markAsApplied
);

export default router;