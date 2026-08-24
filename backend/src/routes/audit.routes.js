import { Router } from 'express';
import { getAuditLogs, getAuditStats, getEntityLogs } from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas de auditoría requieren autenticación de administrador
router.use(authenticate);
router.use(authorize(['admin']));

router.get('/stats', getAuditStats);
router.get('/', getAuditLogs);
router.get('/:entityId', getEntityLogs);

export default router;
