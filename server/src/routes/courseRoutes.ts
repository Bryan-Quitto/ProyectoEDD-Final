import { Router } from 'express';
import { CourseController } from '../controllers/CourseController';
import { authMiddleware, checkRole } from '../middleware/authMiddleware';

const router = Router();

// --- Rutas Públicas (no requieren autenticación) ---
router.get('/', CourseController.getAllCourses);
router.get('/:courseId', CourseController.getCourseById);
router.get('/:courseId/modules', CourseController.getCourseModules);


// --- Rutas Protegidas (requieren autenticación y roles específicos) ---
router.post(
    '/', 
    authMiddleware, 
    checkRole(['admin', 'teacher']), 
    CourseController.createCourse
);

router.put(
    '/:courseId', 
    authMiddleware, 
    checkRole(['admin', 'teacher']), 
    CourseController.updateCourse
);

router.delete(
    '/:courseId', 
    authMiddleware, 
    checkRole(['admin']), 
    CourseController.deleteCourse
);

export default router;