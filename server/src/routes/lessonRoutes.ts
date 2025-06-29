import { Router } from 'express';
import { LessonController } from '../controllers/lessonController';

const router = Router();
const lessonController = new LessonController();

router.post('/', lessonController.createLesson);
router.get('/module/:moduleId', lessonController.getLessonsByModule);
router.put('/:id', lessonController.updateLesson);
router.delete('/:id', lessonController.deleteLesson);
router.get('/:id', lessonController.getLessonById);

export default router;