import { Router } from 'express';
import { StudentProgressController } from '../controllers/studentProgressController';
import { authMiddleware, checkRole } from '../middleware/authMiddleware';

const router = Router();

router.post(
    '/complete-lesson', 
    authMiddleware,
    checkRole(['student']), 
    StudentProgressController.markLessonAsCompleted
);

export default router;