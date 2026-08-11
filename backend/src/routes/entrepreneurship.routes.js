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
    deleteUpdate
} from '../controllers/entrepreneurship/entrepreneurship.controller.js';
import * as intelligence from '../controllers/entrepreneurship/intelligence.controller.js';
import * as capTable from '../controllers/entrepreneurship/capTable.controller.js';
import * as validation from '../controllers/entrepreneurship/validation.controller.js';

import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Protección de rutas: Solo Emprendedores, Admin y Empleados autorizados
router.use(authenticate, authorize(['entrepreneur', 'admin', 'employee']));

// Rutas base de proyectos
router.get('/', getProjects);
router.post('/', authorize(['entrepreneur', 'admin']), createProject);
router.get('/:id', getProjectDetails);
router.patch('/:id', authorize(['entrepreneur', 'admin']), updateProject);
router.delete('/:id', authorize(['entrepreneur', 'admin']), deleteProject);

// Inteligencia y BI (NUEVO)
router.get('/:id/analytics', intelligence.getProjectAnalytics);
router.get('/:id/pitch-analysis', intelligence.getPitchAnalysis);
router.get('/:id/growth-metrics', intelligence.getGrowthData);

// Gestión de Capital e Inversión (NUEVO)
router.get('/:id/captable', capTable.getCapTable);
router.post('/equity', authorize(['entrepreneur', 'admin']), capTable.addEquityHolder);
router.patch('/equity/:id', authorize(['entrepreneur', 'admin']), capTable.updateEquityHolder);
router.delete('/equity/:id', authorize(['entrepreneur', 'admin']), capTable.deleteEquityHolder);

router.get('/:id/funding', capTable.getFundingRounds);
router.post('/funding', authorize(['entrepreneur', 'admin']), capTable.addFundingRound);
router.patch('/funding/:id', authorize(['entrepreneur', 'admin']), capTable.updateFundingRound);
router.delete('/funding/:id', authorize(['entrepreneur', 'admin']), capTable.deleteFundingRound);

// Validación de Mercado y Clientes (NUEVO)
router.get('/:id/interviews', validation.getInterviews);
router.post('/interviews', authorize(['entrepreneur', 'admin']), validation.addInterview);
router.patch('/interviews/:id', authorize(['entrepreneur', 'admin']), validation.updateInterview);
router.delete('/interviews/:id', authorize(['entrepreneur', 'admin']), validation.deleteInterview);
router.post('/market', authorize(['entrepreneur', 'admin']), validation.updateMarketSize);

// Rutas de hitos (Milestones)
router.post('/milestones', authorize(['entrepreneur', 'admin']), addMilestone);
router.patch('/milestones/:id', authorize(['entrepreneur', 'admin']), updateMilestone);
router.delete('/milestones/:id', authorize(['entrepreneur', 'admin']), deleteMilestone);

// Rutas de actualizaciones (Bitácora)
router.post('/updates', authorize(['entrepreneur', 'admin']), addUpdate);
router.delete('/updates/:id', authorize(['entrepreneur', 'admin']), deleteUpdate);

export default router;
