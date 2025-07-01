import { Router } from 'express';
import { EvaluationController } from '../controllers/evaluationController';
import { authMiddleware, checkRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/module/:moduleId', EvaluationController.getEvaluationsByModule);

router.post(
    '/:evaluationId/submit', 
    authMiddleware, 
    checkRole(['student']), 
    EvaluationController.submitAttempt
);

router.get(
    '/:evaluationId/attempts', 
    authMiddleware, 
    checkRole(['student', 'teacher', 'admin']), 
    EvaluationController.getAttempts
);

router.post(
    '/', 
    authMiddleware, 
    checkRole(['teacher', 'admin']), 
    EvaluationController.createEvaluation
);

router.get('/:id', EvaluationController.getEvaluationById);

router.put(
    '/:id', 
    authMiddleware, 
    checkRole(['teacher', 'admin']), 
    EvaluationController.updateEvaluation
);

router.delete(
    '/:id', 
    authMiddleware, 
    checkRole(['teacher', 'admin']), 
    EvaluationController.deleteEvaluation
);

router.get('/by-lesson/:lessonId', EvaluationController.getEvaluationsByLesson);

export default router;