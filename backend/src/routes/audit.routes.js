import { Router } from 'express';
import { getAuditLogs, getEntityLogs } from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas de auditoría requieren ser administrador
router.use(authenticate);
router.use(authorize(['admin']));

router.get('/', getAuditLogs);
router.get('/:entityId', getEntityLogs);

export default router;
