import { Router } from 'express';
import {
    requestAdvance,
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
router.get('/', authenticate, authorize(['admin', 'hr']), getAdvances);
router.post('/:id/approve', authenticate, authorize(['admin', 'hr']), approveAdvance);
router.post('/:id/reject', authenticate, authorize(['admin', 'hr']), rejectAdvance);

export default router;
