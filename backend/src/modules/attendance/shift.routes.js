/**
 * @file shift.routes.js
 * @description Rutas HTTP para gestión de turnos y asignación de horarios laborales (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import shiftController from './shift.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// /shifts
router.post('/', authorize(['admin', 'hr', 'manager']), shiftController.createShift);
router.get('/', authorize(['admin', 'hr', 'manager', 'employee']), shiftController.getAllShifts);
router.put('/:id', authorize(['admin', 'hr', 'manager']), shiftController.updateShift);
router.delete('/:id', authorize(['admin', 'hr', 'manager']), shiftController.deleteShift);

// /shifts/assign
router.post('/assign', authorize(['admin', 'hr', 'manager']), shiftController.assignShifts);
router.get('/schedules', authorize(['admin', 'hr', 'manager']), shiftController.getAllSchedules);
router.delete(
  '/schedule/:id',
  authorize(['admin', 'hr', 'manager']),
  shiftController.deleteSchedule
);

// /shifts/employee/:employeeId
router.get(
  '/employee/:employeeId',
  authorize(['admin', 'hr', 'manager', 'employee']),
  shiftController.getEmployeeSchedule
);

export default router;
