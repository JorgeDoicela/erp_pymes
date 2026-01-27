import express from 'express';
import exportController from '../../controllers/export/exportController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Admin Exports
router.get('/employees/excel', authenticate, authorize(['admin']), exportController.exportEmployees);
router.get('/payroll/:id/csv', authenticate, authorize(['admin']), exportController.exportPayrollCSV);

// Shared/Employee Exports
router.get('/paystub/:id/pdf', authenticate, exportController.exportPayStubPDF);

export default router;
