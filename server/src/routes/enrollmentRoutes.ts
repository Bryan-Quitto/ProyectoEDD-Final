import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollmentController';

const router = Router();

router.post('/', EnrollmentController.createEnrollment);
router.get('/course/:courseId/students', EnrollmentController.getStudentsByCourse);

export default router;