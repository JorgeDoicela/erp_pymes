import { Router } from 'express';
import { createGoal, getMyGoals, updateGoalProgress, deleteGoal } from '../../controllers/performance/goals.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, authorize(['admin', 'hr', 'manager', 'employee']), createGoal);
router.get('/', authenticate, authorize(['admin', 'hr', 'manager', 'employee']), getMyGoals);
router.put('/:id/progress', authenticate, authorize(['admin', 'hr', 'manager', 'employee']), updateGoalProgress);
router.delete('/:id', authenticate, authorize(['admin', 'hr', 'manager', 'employee']), deleteGoal);

export default router;
