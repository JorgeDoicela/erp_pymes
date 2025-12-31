import { Router } from 'express';
import { createVacancy, getVacancies, getPublicVacancies, getVacancyById, updateVacancyStatus, applyToVacancy } from '../controllers/recruitment.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadResume } from '../middleware/upload.middleware.js';

const router = Router();

// Public Routes (for candidates)
router.get('/public', getPublicVacancies);
router.get('/public/:id', getVacancyById);
router.post('/public/:id/apply', uploadResume.single('resume'), applyToVacancy);

// Admin Routes
router.post('/', authenticate, authorize(['admin', 'hr']), createVacancy);
router.get('/', authenticate, authorize(['admin', 'hr']), getVacancies);
router.put('/:id/status', authenticate, authorize(['admin', 'hr']), updateVacancyStatus);

export default router;
