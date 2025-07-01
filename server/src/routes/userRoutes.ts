import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
router.get('/', UserController.getAllStudents); 
router.get('/teachers', UserController.getTeachers);
router.get('/:userId', UserController.getUserById);

export default router;