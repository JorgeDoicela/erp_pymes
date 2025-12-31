import { Router } from 'express';
import { createVacancy, getVacancies, getPublicVacancies, getVacancyById, updateVacancyStatus, applyToVacancy, getApplicationsByVacancy, getApplicationDetails, updateApplicationStatus, addApplicationNote, scheduleInterview } from '../controllers/recruitment.controller.js';
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

// Application Management
router.get('/:id/applications', authenticate, authorize(['admin', 'hr']), getApplicationsByVacancy);
router.get('/applications/:id', authenticate, authorize(['admin', 'hr']), getApplicationDetails);
router.put('/applications/:id/status', authenticate, authorize(['admin', 'hr']), updateApplicationStatus);
router.post('/applications/:id/notes', authenticate, authorize(['admin', 'hr']), addApplicationNote);
router.post('/applications/:id/interviews', authenticate, authorize(['admin', 'hr']), scheduleInterview);

export default router;
