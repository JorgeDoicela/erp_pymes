/**
 * @file benefits.routes.js
 * @description Rutas HTTP para la gestión de beneficios, rubros y bonos de empleados (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import employeeBenefitController from './employeeBenefit.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  employeeBenefitController.getAll
);

router.get(
  '/stats',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  employeeBenefitController.getStats
);

router.post(
  '/',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  employeeBenefitController.create
);

router.post(
  '/bulk',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  employeeBenefitController.bulkCreate
);

router.get(
  '/employee/:employeeId',
  authenticate,
  authorize(['admin', 'hr', 'employee', 'accounting']),
  employeeBenefitController.getByEmployee
);

router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  employeeBenefitController.update
);

router.put(
  '/:id/deactivate',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  employeeBenefitController.deactivate
);

export default router;
