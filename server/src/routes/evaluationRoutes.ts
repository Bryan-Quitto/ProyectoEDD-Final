import { Router } from 'express';
import { EvaluationController } from '../controllers/evaluationController';

const router = Router();

router.get('/module/:moduleId', EvaluationController.getEvaluationByModule);
router.post('/module/:moduleId', EvaluationController.upsertEvaluationByModule);

router.get('/:evaluationId/attempts', EvaluationController.getAttempts);
router.post('/:evaluationId/submit', EvaluationController.submitAttempt);
router.post('/', EvaluationController.createEvaluation);
router.get('/:id', EvaluationController.getEvaluationById);
router.put('/:id', EvaluationController.updateEvaluation);
router.delete('/:id', EvaluationController.deleteEvaluation);
router.get('/by-lesson/:lessonId', EvaluationController.getEvaluationsByLesson);

export default router;