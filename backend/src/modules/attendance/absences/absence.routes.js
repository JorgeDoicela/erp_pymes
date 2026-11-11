/**
 * @file absence.routes.js
 * @description Rutas HTTP para gestión de solicitudes de ausencia, permisos y vacaciones (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import absenceController from './absence.controller.js';
import { authenticate, authorize } from '../../auth/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Crear (Upload file) - Empleado o Admin
router.post('/', absenceController.uploadMiddleware, absenceController.createRequest);

// Listar todas (Admin/HR/Manager/Accounting)
router.get('/', authorize(['admin', 'hr', 'manager', 'accounting']), absenceController.getRequests);

// Mis solicitudes (Empleado)
router.get('/my-requests', absenceController.getMyRequests);

// Aprobar/Rechazar (Admin/HR/Manager)
router.patch('/:id/status', authorize(['admin', 'hr', 'manager']), absenceController.updateStatus);

export default router;
