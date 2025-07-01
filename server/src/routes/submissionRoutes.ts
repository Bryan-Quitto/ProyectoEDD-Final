import { Router } from 'express';
import { SubmissionController } from '../controllers/SubmissionController';
import { authMiddleware, checkRole } from '../middleware/authMiddleware';

const router = Router();

router.post(
  '/',
  authMiddleware,
  checkRole(['student']),
  SubmissionController.submitTextLesson
);

router.get(
  '/lesson/:lessonId/student/:studentId',
  authMiddleware,
  checkRole(['student', 'teacher']),
  SubmissionController.getSubmission
);

export default router;