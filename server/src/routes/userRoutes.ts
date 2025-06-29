import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

router.get('/teachers', UserController.getTeachers);

export default router;