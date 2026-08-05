import { Router } from 'express';
import {
    getEmployeeExpedient,
    uploadExpedientDocument,
    verifyExpedientDocument,
    deliverAsset,
    returnAsset,
    getEmployeeAssets,
    getAllAssets,
    simulateSettlement,
    startOffboarding,
    updateChecklistStep,
    getOffboardings
} from '../../controllers/employees/onboardingOffboardingController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// --- Expediente Digital ---
router.get('/expedient/my', authenticate, (req, res, next) => {
    req.params.id = req.user.employeeId || req.user.id;
    getEmployeeExpedient(req, res, next);
});
router.get('/expedient/:id', authenticate, authorize(['admin', 'hr']), getEmployeeExpedient);
router.post('/expedient/upload', authenticate, uploadExpedientDocument);
router.put('/expedient/verify/:id', authenticate, authorize(['admin', 'hr']), verifyExpedientDocument);

// --- Activos y EPPs ---
router.get('/assets', authenticate, authorize(['admin', 'hr']), getAllAssets);
router.get('/assets/employee/:employeeId', authenticate, getEmployeeAssets);
router.post('/assets/deliver', authenticate, authorize(['admin', 'hr']), deliverAsset);
router.put('/assets/return/:id', authenticate, authorize(['admin', 'hr']), returnAsset);

// --- Offboarding & Finiquito ---
router.post('/offboarding/simulate', authenticate, authorize(['admin', 'hr']), simulateSettlement);
router.post('/offboarding/start', authenticate, authorize(['admin', 'hr']), startOffboarding);
router.put('/offboarding/:id/checklist', authenticate, authorize(['admin', 'hr']), updateChecklistStep);
router.get('/offboarding', authenticate, authorize(['admin', 'hr']), getOffboardings);

export default router;
