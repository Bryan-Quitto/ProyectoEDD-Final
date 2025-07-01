import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollmentController';
import { authMiddleware, checkRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authMiddleware, checkRole(['student']), EnrollmentController.createEnrollment);
router.get('/course/:courseId/students', authMiddleware, checkRole(['teacher', 'admin']), EnrollmentController.getStudentsByCourse);
router.delete('/', authMiddleware, checkRole(['student']), EnrollmentController.deleteEnrollment);

export default router;