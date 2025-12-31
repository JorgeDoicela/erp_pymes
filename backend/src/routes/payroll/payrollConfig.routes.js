import { Router } from 'express';
import payrollConfigController from '../../controllers/payroll/payrollConfigController.js';
import payrollController from '../../controllers/payroll/payrollController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Get current configuration
router.get('/config', authenticate, authorize(['admin', 'hr']), payrollConfigController.getConfig);

// Create/Update configuration (creates new version)
router.post('/config', authenticate, authorize(['admin', 'hr']), payrollConfigController.createConfig);

// Payroll Generation & Management
router.post('/generate', authenticate, authorize(['admin', 'hr']), payrollController.generate);
router.get('/', authenticate, authorize(['admin', 'hr']), payrollController.getAll);
router.get('/my-payrolls', authenticate, payrollController.getMyPayrolls); // Open to all authenticated
router.get('/:id', authenticate, authorize(['admin', 'hr']), payrollController.getById);
router.put('/:id/confirm', authenticate, authorize(['admin', 'hr']), payrollController.confirm);
router.get('/:id/bank-file', authenticate, authorize(['admin', 'hr']), payrollController.generateBankFile);
router.put('/:id/mark-paid', authenticate, authorize(['admin', 'hr']), payrollController.markAsPaid);

export default router;
