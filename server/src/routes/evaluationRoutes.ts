import { Router } from 'express';
import { EvaluationController } from '../controllers/evaluationController';

const router = Router();
const evaluationController = new EvaluationController();

router.post('/', evaluationController.createEvaluation);
router.get('/:id', evaluationController.getEvaluationById);
router.put('/:id', evaluationController.updateEvaluation);
router.delete('/:id', evaluationController.deleteEvaluation);
router.get('/by-lesson/:lessonId', evaluationController.getEvaluationsByLesson);

export default router;