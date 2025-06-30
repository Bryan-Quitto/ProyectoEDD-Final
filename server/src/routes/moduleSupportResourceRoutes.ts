import { Router } from 'express';
import { ModuleSupportResourceController } from '../controllers/moduleSupportResourceController';

const router = Router();

router.get('/module/:moduleId', ModuleSupportResourceController.getByModule);
router.post('/', ModuleSupportResourceController.create);
router.delete('/:resourceId', ModuleSupportResourceController.remove);

export default router;