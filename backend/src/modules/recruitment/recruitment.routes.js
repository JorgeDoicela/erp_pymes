/**
 * @file recruitment.routes.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import {
  createVacancy,
  getRecruitmentStats,
  getVacancies,
  getPublicVacancies,
  getVacancyById,
  updateVacancyStatus,
  deleteVacancy,
  applyToVacancy,
  getApplicationsByVacancy,
  getApplicationDetails,
  updateApplicationStatus,
  deleteApplication,
  addApplicationNote,
  scheduleInterview,
  evaluateCandidate,
  hireCandidate,
} from './recruitment.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import { requireTenant } from '../tenants/index.js';
import { uploadResume } from '../../core/storage/upload.middleware.js';

const router = Router();
const protectedAdmin = [authenticate, requireTenant, authorize(['admin', 'hr'])];

// Public Routes (for candidates)
router.get('/public', getPublicVacancies);
router.get('/public/:id', getVacancyById);
router.post('/public/:id/apply', uploadResume.single('resume'), applyToVacancy);

// Admin Routes
router.get('/stats', protectedAdmin, getRecruitmentStats);
router.post('/', protectedAdmin, createVacancy);
router.get('/', protectedAdmin, getVacancies);
router.put('/:id/status', protectedAdmin, updateVacancyStatus);
router.delete('/:id', protectedAdmin, deleteVacancy);

// Application Management
router.get('/:id/applications', protectedAdmin, getApplicationsByVacancy);
router.get('/applications/:id', protectedAdmin, getApplicationDetails);
router.put('/applications/:id/status', protectedAdmin, updateApplicationStatus);
router.delete('/applications/:id', protectedAdmin, deleteApplication);
router.post('/applications/:id/notes', protectedAdmin, addApplicationNote);
router.post('/applications/:id/interviews', protectedAdmin, scheduleInterview);
router.post('/applications/:id/evaluations', protectedAdmin, evaluateCandidate);
router.post('/applications/:id/hire', protectedAdmin, hireCandidate);

export default router;
