import { Router } from 'express';
import { createGoal, getMyGoals, updateGoalProgress, deleteGoal } from '../../controllers/performance/goals.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, createGoal);
router.get('/', authenticate, getMyGoals);
router.put('/:id/progress', authenticate, updateGoalProgress);
router.delete('/:id', authenticate, deleteGoal);

export default router;
