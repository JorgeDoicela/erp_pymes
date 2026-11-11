/**
 * @file audit.routes.js
 * @description Norma ERP - Enrutador de Auditoría
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import { getAuditLogs, getAuditStats, getEntityLogs } from './audit.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';

const router = Router();

// Todas las rutas de auditoría requieren autenticación de administrador
router.use(authenticate);
router.use(authorize(['admin']));

router.get('/stats', getAuditStats);
router.get('/', getAuditLogs);
router.get('/:entityId', getEntityLogs);

export default router;
