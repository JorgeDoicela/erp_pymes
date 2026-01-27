import { Router } from 'express';
import systemService from '../../services/system/systemService.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Public Health Check
router.get('/health', async (req, res) => {
    const health = await systemService.checkHealth();
    const status = health.status === 'UP' ? 200 : 503;
    res.status(status).json(health);
});

// System Settings (Admin Only)
router.get('/settings', authenticate, authorize(['admin']), async (req, res) => {
    const settings = await systemService.getSettings();
    res.json({ success: true, data: settings });
});

router.put('/settings', authenticate, authorize(['admin']), async (req, res) => {
    const updated = await systemService.updateSettings(req.body);
    res.json({ success: true, data: updated });
});

export default router;
