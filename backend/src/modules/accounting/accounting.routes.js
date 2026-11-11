/**
 * @file accounting.routes.js
 * @description Rutas HTTP para el módulo contable (Norma ERP).
 * Define endpoints protegidos con autenticación, RBAC y esquemas Zod de validación.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import express from 'express';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import { validate } from '../../core/middleware/validate.middleware.js';
import {
  createPeriodDto,
  createAccountDto,
  createCostCenterDto,
  createJournalEntryDto,
} from './accounting.dto.js';
import * as accController from './accounting.controller.js';

const router = express.Router();

router.use(authenticate, authorize(['accounting', 'admin']));

// Periodos Fiscales
router.get('/periods', accController.getPeriods);
router.post('/periods', validate(createPeriodDto), accController.createPeriod);
router.patch('/periods/:id/toggle', accController.togglePeriodStatus);
router.delete('/periods/:id', accController.deletePeriod);

// Catálogo de Cuentas
router.get('/accounts', accController.getAccounts);
router.post('/accounts', validate(createAccountDto), accController.createAccount);
router.put('/accounts/:id', accController.updateAccount);
router.delete('/accounts/:id', accController.deleteAccount);

// Centros de Costo
router.get('/cost-centers', accController.getCostCenters);
router.post('/cost-centers', validate(createCostCenterDto), accController.createCostCenter);
router.put('/cost-centers/:id', accController.updateCostCenter);
router.delete('/cost-centers/:id', accController.deleteCostCenter);

// Asientos / Diarios Contables
router.get('/journals', accController.getJournalEntries);
router.post('/journals', validate(createJournalEntryDto), accController.createJournalEntry);
router.patch('/journals/:id/post', accController.postJournalEntry);
router.delete('/journals/:id', accController.deleteJournalEntry);

// Reportes Financieros
router.get('/reports/trial-balance', accController.getTrialBalance);
router.get('/reports/general-ledger', accController.getGeneralLedger);

// Integración con otros módulos
router.post('/integrate/payroll', accController.integratePayroll);

export default router;
