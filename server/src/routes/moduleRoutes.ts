import { Router } from 'express';
import { ModuleController } from '../controllers/moduleController';

const router = Router();

router.post('/', ModuleController.createModule);
router.get('/:id', ModuleController.getModuleById);
router.put('/:id', ModuleController.updateModule);
router.delete('/:id', ModuleController.deleteModule);
router.get('/by-course/:courseId', ModuleController.getModulesByCourse);

export default router;