import { Router } from 'express';
import {
    getAllExpedientsSummary,
    getEmployeeExpedient,
    uploadExpedientDocument,
    verifyExpedientDocument,
    deleteExpedientDocument,
    deliverAsset,
    updateAsset,
    returnAsset,
    deleteAsset,
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
router.get('/expedients/summary', authenticate, authorize(['admin', 'hr', 'superadmin', 'accounting']), getAllExpedientsSummary);
router.get('/expedient/my', authenticate, (req, res, next) => {
    req.params.id = req.user.employeeId || req.user.id;
    getEmployeeExpedient(req, res, next);
});
router.get('/expedient/:id', authenticate, authorize(['admin', 'hr', 'superadmin', 'accounting']), getEmployeeExpedient);
router.post('/expedient/upload', authenticate, uploadExpedientDocument);
router.put('/expedient/verify/:id', authenticate, authorize(['admin', 'hr', 'superadmin']), verifyExpedientDocument);
router.delete('/expedient/document/:id', authenticate, authorize(['admin', 'hr', 'superadmin']), deleteExpedientDocument);

// --- Activos y EPPs ---
router.get('/assets', authenticate, authorize(['admin', 'hr', 'superadmin', 'accounting']), getAllAssets);
router.get('/assets/my', authenticate, (req, res, next) => {
    req.params.employeeId = req.user.employeeId || req.user.id;
    getEmployeeAssets(req, res, next);
});
router.get('/assets/employee/:employeeId', authenticate, getEmployeeAssets);
router.post('/assets/deliver', authenticate, authorize(['admin', 'hr', 'superadmin']), deliverAsset);
router.put('/assets/:id', authenticate, authorize(['admin', 'hr', 'superadmin']), updateAsset);
router.put('/assets/return/:id', authenticate, authorize(['admin', 'hr', 'superadmin']), returnAsset);
router.delete('/assets/:id', authenticate, authorize(['admin', 'hr', 'superadmin']), deleteAsset);

// --- Offboarding & Finiquito ---
router.post('/offboarding/simulate', authenticate, authorize(['admin', 'hr']), simulateSettlement);
router.post('/offboarding/start', authenticate, authorize(['admin', 'hr']), startOffboarding);
router.put('/offboarding/:id/checklist', authenticate, authorize(['admin', 'hr']), updateChecklistStep);
router.get('/offboarding', authenticate, authorize(['admin', 'hr']), getOffboardings);

export default router;
