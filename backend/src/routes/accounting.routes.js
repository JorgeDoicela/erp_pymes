import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as accController from '../controllers/accounting/accounting.controller.js';

const router = express.Router();

// Tdoso los endpoints contables requerirán usuario activo y rol Admin
router.use(authenticate, authorize(['admin']));

// Periodos Fiscales
router.get('/periods', accController.getPeriods);
router.post('/periods', accController.createPeriod);
router.patch('/periods/:id/toggle', accController.togglePeriodStatus);
router.delete('/periods/:id', accController.deletePeriod);

// Catálogo de Cuentas
router.get('/accounts', accController.getAccounts);
router.post('/accounts', accController.createAccount);
router.put('/accounts/:id', accController.updateAccount);
router.delete('/accounts/:id', accController.deleteAccount);

// Centros de Costo
router.get('/cost-centers', accController.getCostCenters);
router.post('/cost-centers', accController.createCostCenter);
router.put('/cost-centers/:id', accController.updateCostCenter);
router.delete('/cost-centers/:id', accController.deleteCostCenter);

// Asientos / Diarios Contables
router.get('/journals', accController.getJournalEntries);
router.post('/journals', accController.createJournalEntry);
router.patch('/journals/:id/post', accController.postJournalEntry);
router.delete('/journals/:id', accController.deleteJournalEntry);

// Reportes Financieros
router.get('/reports/trial-balance', accController.getTrialBalance);
router.get('/reports/general-ledger', accController.getGeneralLedger);

// Integración
router.post('/integrate/payroll', accController.integratePayroll);

export default router;
