/**
 * @file employee.routes.js
 * @description Rutas HTTP para el módulo de empleados (Norma ERP).
 * Define endpoints protegidos con autenticación, RBAC y validación Zod de DTOs.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import employeeController from './employee.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createEmployeeDto, updateEmployeeDto } from './employee.dto.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['admin', 'hr']),
  validate(createEmployeeDto),
  employeeController.create
);

router.get('/', authenticate, authorize(['admin', 'hr', 'accounting']), employeeController.getAll);
router.get('/profile', authenticate, employeeController.getProfile);
router.get('/profile/me', authenticate, employeeController.getProfile);
router.post('/consent', authenticate, employeeController.updateConsent);

router.get(
  '/departments',
  authenticate,
  authorize(['admin', 'hr', 'accounting', 'employee']),
  employeeController.getDepartments
);

router.get(
  '/stats/salary',
  authenticate,
  authorize(['admin', 'hr']),
  employeeController.getSalaryStats
);

router.get(
  '/department/:department',
  authenticate,
  authorize(['admin', 'hr']),
  employeeController.getByDepartment
);

router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'hr', 'employee']),
  employeeController.getById
);

router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'hr', 'employee']),
  validate(updateEmployeeDto),
  employeeController.update
);

router.post(
  '/:id/terminate',
  authenticate,
  authorize(['admin', 'hr']),
  employeeController.terminate
);

router.get(
  '/:id/history',
  authenticate,
  authorize(['admin', 'hr', 'employee']),
  employeeController.getHistory
);

router.delete('/:id', authenticate, authorize(['admin', 'hr']), employeeController.delete);

export default router;
