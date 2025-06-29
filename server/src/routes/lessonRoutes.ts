import { Router } from 'express';
import { LessonController } from '../controllers/lessonController';

const router = Router();
const lessonController = new LessonController();

router.post('/', lessonController.createLesson);
router.get('/:id', lessonController.getLessonById);
router.put('/:id', lessonController.updateLesson);
router.delete('/:id', lessonController.deleteLesson);
router.get('/by-module/:moduleId', lessonController.getLessonsByModule);

export default router;