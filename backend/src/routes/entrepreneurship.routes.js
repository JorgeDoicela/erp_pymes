import { Router } from 'express';
import { 
    getProjects, 
    createProject, 
    getProjectDetails, 
    updateProject, 
    deleteProject,
    addMilestone,
    updateMilestone,
    addUpdate
} from '../controllers/entrepreneurship/entrepreneurship.controller.js';
import * as intelligence from '../controllers/entrepreneurship/intelligence.controller.js';
import * as capTable from '../controllers/entrepreneurship/capTable.controller.js';
import * as validation from '../controllers/entrepreneurship/validation.controller.js';

const router = Router();

// Rutas base de proyectos
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectDetails);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

// Inteligencia y BI (NUEVO)
router.get('/:id/analytics', intelligence.getProjectAnalytics);
router.get('/:id/pitch-analysis', intelligence.getPitchAnalysis);
router.get('/:id/growth-metrics', intelligence.getGrowthData);

// Gestión de Capital e Inversión (NUEVO)
router.get('/:id/captable', capTable.getCapTable);
router.post('/equity', capTable.addEquityHolder);
router.patch('/equity/:id', capTable.updateEquityHolder);
router.delete('/equity/:id', capTable.deleteEquityHolder);

router.get('/:id/funding', capTable.getFundingRounds);
router.post('/funding', capTable.addFundingRound);
router.patch('/funding/:id', capTable.updateFundingRound);
router.delete('/funding/:id', capTable.deleteFundingRound);

// Validación de Mercado y Clientes (NUEVO)
router.get('/:id/interviews', validation.getInterviews);
router.post('/interviews', validation.addInterview);
router.patch('/interviews/:id', validation.updateInterview);
router.delete('/interviews/:id', validation.deleteInterview);
router.post('/market', validation.updateMarketSize);

// Rutas de hitos (Milestones)
router.post('/milestones', addMilestone);
router.patch('/milestones/:id', updateMilestone);

// Rutas de actualizaciones (Bitácora)
router.post('/updates', addUpdate);

export default router;
