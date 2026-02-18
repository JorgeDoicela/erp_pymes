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

// Geocoding Proxy (to avoid CORS on frontend)
router.get('/geocode', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'Missing lat/lng' });
        }
        const data = await systemService.reverseGeocode(lat, lng);
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Public endpoint - biometric setting (no auth needed for attendance page)
router.get('/biometric-setting', async (req, res) => {
    try {
        const settings = await systemService.getSettings();
        res.json({ success: true, biometricEnabled: settings?.biometricEnabled ?? false });
    } catch (error) {
        res.json({ success: true, biometricEnabled: false });
    }
});

export default router;
