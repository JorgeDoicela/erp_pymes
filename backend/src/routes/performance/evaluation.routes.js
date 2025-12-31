import { Router } from 'express';
import { createEvaluationTemplate, getEvaluationTemplates, assignEvaluation } from '../../controllers/performance/evaluation.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Solo admin puede crear plantillas
router.post('/templates', authorize(['admin']), createEvaluationTemplate);
router.get('/templates', authorize(['admin', 'hr']), getEvaluationTemplates);
router.post('/assignments', authorize(['admin', 'hr']), assignEvaluation);

export default router;
