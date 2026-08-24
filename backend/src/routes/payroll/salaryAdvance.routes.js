import { Router } from 'express';
import {
    requestAdvance,
    createByAdmin,
    getStats,
    getAdvances,
    getMyAdvances,
    approveAdvance,
    rejectAdvance,
    cancelAdvance
} from '../../controllers/payroll/salaryAdvanceController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Solicitud del empleado y consulta propia
router.post('/request', authenticate, requestAdvance);
router.get('/my', authenticate, getMyAdvances);
router.delete('/:id/cancel', authenticate, cancelAdvance);

// Administración y Aprobaciones
router.get('/', authenticate, authorize(['admin', 'hr', 'accounting']), getAdvances);
router.get('/stats', authenticate, authorize(['admin', 'hr', 'accounting']), getStats);
router.post('/admin-create', authenticate, authorize(['admin', 'hr', 'accounting']), createByAdmin);
router.post('/:id/approve', authenticate, authorize(['admin', 'hr', 'accounting']), approveAdvance);
router.post('/:id/reject', authenticate, authorize(['admin', 'hr', 'accounting']), rejectAdvance);

export default router;
