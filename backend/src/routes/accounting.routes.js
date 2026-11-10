/**
 * @file accounting.routes.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createPeriodDto,
  createAccountDto,
  createCostCenterDto,
  createJournalEntryDto,
} from '../dto/accounting/accounting.dto.js';
import * as accController from '../controllers/accounting/accounting.controller.js';

const router = express.Router();

// Todos los endpoints contables requerirán usuario activo y rol Contabilidad o Administrador
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

// Integración
router.post('/integrate/payroll', accController.integratePayroll);

export default router;
