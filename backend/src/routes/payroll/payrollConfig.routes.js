import { Router } from 'express';
import payrollConfigController from '../../controllers/payroll/payrollConfigController.js';
import payrollController from '../../controllers/payroll/payrollController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Get current configuration
router.get('/config', authenticate, authorize(['admin', 'hr', 'accounting']), payrollConfigController.getConfig);

// Create/Update configuration (creates new version)
router.post('/config', authenticate, authorize(['admin', 'hr', 'accounting']), payrollConfigController.createConfig);

// Payroll Generation & Management
router.post('/generate', authenticate, authorize(['admin', 'hr', 'accounting']), payrollController.generate);
router.get('/', authenticate, authorize(['admin', 'hr', 'accounting']), payrollController.getAll);
router.get('/my-payrolls', authenticate, payrollController.getMyPayrolls); // Open to all authenticated
router.get('/:id', authenticate, authorize(['admin', 'hr', 'accounting']), payrollController.getById);
router.put('/:id/confirm', authenticate, authorize(['admin', 'hr', 'accounting']), payrollController.confirm);
router.patch('/detail/:id', authenticate, authorize(['admin', 'hr', 'accounting']), payrollController.updateDetail);
router.put('/detail/:id/sign', authenticate, payrollController.signPayslip); // Abierto a colaborador dueño del rol
router.put('/detail/:id/dispute', authenticate, payrollController.disputePayslip); // Abierto a colaborador dueño del rol
router.post('/:id/notify-pending', authenticate, authorize(['admin', 'hr', 'accounting']), payrollController.notifyPendingSignatures);
router.get('/:id/bank-file', authenticate, authorize(['admin', 'hr', 'accounting']), payrollController.generateBankFile);
router.put('/:id/mark-paid', authenticate, authorize(['admin', 'hr', 'accounting']), payrollController.markAsPaid);
router.delete('/:id', authenticate, authorize(['admin', 'hr', 'accounting']), payrollController.delete);

export default router;
