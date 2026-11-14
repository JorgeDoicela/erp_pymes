/**
 * @file payroll.routes.js
 * @description Rutas HTTP para la generación, gestión y configuración de nómina (Norma ERP).
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
const canManage = authorize(['admin', 'hr', 'accounting']);

router.get('/config', authenticate, canManage, payrollConfigController.getConfig);
router.post(
  '/config',
  authenticate,
  canManage,
  validate(createPayrollConfigDto),
  payrollConfigController.createConfig
);

router.post(
  '/generate',
  authenticate,
  canManage,
  validate(generatePayrollDto),
  payrollController.generate
);
router.get('/', authenticate, canManage, payrollController.getAll);
router.get('/my-payrolls', authenticate, payrollController.getMyPayrolls);
router.get('/:id', authenticate, canManage, payrollController.getById);
router.put('/:id/confirm', authenticate, canManage, payrollController.confirm);
router.patch('/detail/:id', authenticate, canManage, payrollController.updateDetail);
router.put('/detail/:id/sign', authenticate, payrollController.signPayslip);
router.put('/detail/:id/dispute', authenticate, payrollController.disputePayslip);
router.post(
  '/:id/notify-pending',
  authenticate,
  canManage,
  payrollController.notifyPendingSignatures
);
router.get('/:id/bank-file', authenticate, canManage, payrollController.generateBankFile);
router.put('/:id/mark-paid', authenticate, canManage, payrollController.markAsPaid);
router.delete('/:id', authenticate, canManage, payrollController.delete);

export default router;
