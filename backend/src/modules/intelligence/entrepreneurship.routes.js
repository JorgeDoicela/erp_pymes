/**
 * @file entrepreneurship.routes.js
 * @description Norma ERP - Enrutador de Emprendimiento, CapTable y Validación
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import {
  getProjects,
  createProject,
  getProjectDetails,
  updateProject,
  deleteProject,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  addUpdate,
  deleteUpdate,
} from './entrepreneurship.controller.js';
import * as intelligence from './entrepreneurshipIntelligence.controller.js';
import * as capTable from './capTable.controller.js';
import * as validation from './validation.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, authorize(['entrepreneur', 'admin', 'employee']));

// Proyectos base
router.get('/', getProjects);
router.post('/', authorize(['entrepreneur', 'admin']), createProject);
router.get('/:id', getProjectDetails);
router.patch('/:id', authorize(['entrepreneur', 'admin']), updateProject);
router.delete('/:id', authorize(['entrepreneur', 'admin']), deleteProject);

// Inteligencia y BI
router.get('/:id/analytics', intelligence.getProjectAnalytics);
router.get('/:id/pitch-analysis', intelligence.getPitchAnalysis);
router.get('/:id/growth-metrics', intelligence.getGrowthData);

// CapTable y Rondas de Inversión
router.get('/:id/captable', capTable.getCapTable);
router.post('/equity', authorize(['entrepreneur', 'admin']), capTable.addEquityHolder);
router.patch('/equity/:id', authorize(['entrepreneur', 'admin']), capTable.updateEquityHolder);
router.delete('/equity/:id', authorize(['entrepreneur', 'admin']), capTable.deleteEquityHolder);

router.get('/:id/funding', capTable.getFundingRounds);
router.post('/funding', authorize(['entrepreneur', 'admin']), capTable.addFundingRound);
router.patch('/funding/:id', authorize(['entrepreneur', 'admin']), capTable.updateFundingRound);
router.delete('/funding/:id', authorize(['entrepreneur', 'admin']), capTable.deleteFundingRound);

// Validación de Mercado y Clientes
router.get('/:id/interviews', validation.getInterviews);
router.post('/interviews', authorize(['entrepreneur', 'admin']), validation.addInterview);
router.patch('/interviews/:id', authorize(['entrepreneur', 'admin']), validation.updateInterview);
router.delete('/interviews/:id', authorize(['entrepreneur', 'admin']), validation.deleteInterview);
router.post('/market', authorize(['entrepreneur', 'admin']), validation.updateMarketSize);

// Hitos
router.post('/milestones', authorize(['entrepreneur', 'admin']), addMilestone);
router.patch('/milestones/:id', authorize(['entrepreneur', 'admin']), updateMilestone);
router.delete('/milestones/:id', authorize(['entrepreneur', 'admin']), deleteMilestone);

// Actualizaciones
router.post('/updates', authorize(['entrepreneur', 'admin']), addUpdate);
router.delete('/updates/:id', authorize(['entrepreneur', 'admin']), deleteUpdate);

export default router;

