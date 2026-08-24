import { Router } from 'express';
import {
    createEvaluationTemplate,
    getEvaluationTemplates,
    getEmployeeEvaluations,
    getPerformanceStats,
    assignEvaluation,
    getMyEvaluations,
    submitAssessment,
    getEvaluationResults,
    getMyResultsList
} from '../../controllers/performance/evaluation.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { ROLES } from '../../config/roles.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Gestión y Dashboard Administrativo de Desempeño
router.get('/stats', authorize([ROLES.ADMIN, ROLES.HR]), getPerformanceStats);
router.get('/evaluations', authorize([ROLES.ADMIN, ROLES.HR]), getEmployeeEvaluations);
router.post('/templates', authorize([ROLES.ADMIN, ROLES.HR]), createEvaluationTemplate);
router.get('/templates', authorize([ROLES.ADMIN, ROLES.HR]), getEvaluationTemplates);
router.post('/assignments', authorize([ROLES.ADMIN, ROLES.HR]), assignEvaluation);

// Evaluación del empleado (Autoevaluación o revisión de pares / subordinados)
router.get('/my-pending', authorize([ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.ACCOUNTING, ROLES.MANAGER]), getMyEvaluations);
router.post('/submit', authorize([ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.ACCOUNTING, ROLES.MANAGER]), submitAssessment);

// Resultados
router.get('/my-results', authorize([ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.ACCOUNTING, ROLES.MANAGER]), getMyResultsList);
router.get('/results/:id', authorize([ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.ACCOUNTING, ROLES.MANAGER]), getEvaluationResults);

export default router;
