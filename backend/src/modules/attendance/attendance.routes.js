/**
 * @file attendance.routes.js
 * @description Rutas HTTP para registro y consulta de asistencia biométrica y geocercas (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import attendanceController from './attendance.controller.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// POST /attendance/mark (Autenticado o Quiosco público)
router.post('/mark', optionalAuth, attendanceController.markAttendance);

// GET /attendance/status/:employeeId
router.get('/status/:employeeId', optionalAuth, attendanceController.getStatus);

export default router;
