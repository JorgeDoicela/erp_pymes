/**
 * @file export.routes.js
 * @description Norma ERP - Enrutador de Exportación de Datos
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import express from 'express';
import exportController from './export.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Admin Exports
router.get(
  '/employees/excel',
  authenticate,
  authorize(['admin']),
  exportController.exportEmployees
);
router.get(
  '/payroll/:id/csv',
  authenticate,
  authorize(['admin']),
  exportController.exportPayrollCSV
);

// Shared/Employee Exports
router.get('/paystub/:id/pdf', authenticate, exportController.exportPayStubPDF);

export default router;

