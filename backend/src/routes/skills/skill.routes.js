import { Router } from 'express';
import skillController from '../../controllers/skills/skillController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, skillController.create);
router.delete('/:id', authenticate, skillController.delete);

export default router;
