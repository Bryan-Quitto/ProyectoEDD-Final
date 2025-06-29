import { Router } from 'express';
import { CourseController } from '../controllers/CourseController';

const router = Router();

router.get('/', CourseController.getAllCourses);
router.get('/:courseId', CourseController.getCourseById);
router.post('/', CourseController.createCourse);
router.put('/:courseId', CourseController.updateCourse);
router.delete('/:courseId', CourseController.deleteCourse);
router.get('/:courseId/modules', CourseController.getCourseModules);

export default router;