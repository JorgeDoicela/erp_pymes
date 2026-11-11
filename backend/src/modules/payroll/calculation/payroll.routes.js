/**
 * @file payroll.routes.js
 * @description Rutas HTTP para la generación, gestión y configuración de nómina (Norma ERP).
 * Define endpoints protegidos con autenticación, RBAC y validación Zod de DTOs.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import payrollConfigController from '../config/payrollConfig.controller.js';
import payrollController from './payroll.controller.js';
import { authenticate, authorize } from '../../auth/auth.middleware.js';
import { validate } from '../../../core/middleware/validate.middleware.js';
import { generatePayrollDto, createPayrollConfigDto } from './payroll.dto.js';

const router = Router();

// Configuración legal de nómina
router.get(
  '/config',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  payrollConfigController.getConfig
);

router.post(
  '/config',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  validate(createPayrollConfigDto),
  payrollConfigController.createConfig
);

// Gestión y generación de nóminas
router.post(
  '/generate',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  validate(generatePayrollDto),
  payrollController.generate
);

router.get('/', authenticate, authorize(['admin', 'hr', 'accounting']), payrollController.getAll);
router.get('/my-payrolls', authenticate, payrollController.getMyPayrolls);

router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  payrollController.getById
);

router.put(
  '/:id/confirm',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  payrollController.confirm
);

router.patch(
  '/detail/:id',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  payrollController.updateDetail
);

router.put('/detail/:id/sign', authenticate, payrollController.signPayslip);
router.put('/detail/:id/dispute', authenticate, payrollController.disputePayslip);

router.post(
  '/:id/notify-pending',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  payrollController.notifyPendingSignatures
);

router.get(
  '/:id/bank-file',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  payrollController.generateBankFile
);

router.put(
  '/:id/mark-paid',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  payrollController.markAsPaid
);

router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  payrollController.delete
);

export default router;
