import { Router } from 'express';
import { createEvaluationTemplate, getEvaluationTemplates, assignEvaluation, getMyEvaluations, submitAssessment, getEvaluationResults, getMyResultsList } from '../../controllers/performance/evaluation.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { ROLES } from '../../config/roles.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Solo admin/hr puede crear y asignar plantillas
router.post('/templates', authorize([ROLES.ADMIN]), createEvaluationTemplate);
router.get('/templates', authorize([ROLES.ADMIN, ROLES.HR]), getEvaluationTemplates);
router.post('/assignments', authorize([ROLES.ADMIN, ROLES.HR]), assignEvaluation);

// Evaluación del empleado (Autoevaluación o revisión de otros)
router.get('/my-pending', authorize([ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.ACCOUNTING, ROLES.MANAGER]), getMyEvaluations);
router.post('/submit', authorize([ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.ACCOUNTING, ROLES.MANAGER]), submitAssessment);

// Resultados
router.get('/my-results', authorize([ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.ACCOUNTING, ROLES.MANAGER]), getMyResultsList);
router.get('/results/:id', authorize([ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.ACCOUNTING, ROLES.MANAGER]), getEvaluationResults);

export default router;
