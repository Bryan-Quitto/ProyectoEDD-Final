import { Router } from 'express';
import { CourseController } from '../controllers/CourseController';

const router = Router();
const courseController = new CourseController();

router.get('/', courseController.getAllCourses);
router.get('/:courseId', courseController.getCourseById);
router.post('/', courseController.createCourse);
router.put('/:courseId', courseController.updateCourse);
router.delete('/:courseId', courseController.deleteCourse);
router.get('/:courseId/modules', courseController.getCourseModules);

export default router;