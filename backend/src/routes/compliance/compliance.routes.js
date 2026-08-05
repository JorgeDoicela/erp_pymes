import { Router } from 'express';
import { getComplianceAlerts, getStatutoryProvisions } from '../../controllers/compliance/complianceController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/alerts', authenticate, authorize(['admin', 'hr']), getComplianceAlerts);
router.get('/provisions', authenticate, authorize(['admin', 'hr']), getStatutoryProvisions);

export default router;
