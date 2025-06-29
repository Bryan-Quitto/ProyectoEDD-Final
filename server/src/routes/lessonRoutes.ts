import { Router } from 'express';
import { LessonController } from '../controllers/lessonController';

const router = Router();

router.post('/', LessonController.createLesson);
router.get('/module/:moduleId', LessonController.getLessonsByModule);
router.put('/:id', LessonController.updateLesson);
router.delete('/:id', LessonController.deleteLesson);
router.get('/:id', LessonController.getLessonById);

export default router;