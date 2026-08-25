import { Router } from 'express';
import systemService from '../../services/system/systemService.js';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.middleware.js';
import auditRepository from '../../repositories/audit/auditRepository.js';

const router = Router();

// Public Health Check
router.get('/health', async (req, res) => {
    const health = await systemService.checkHealth();
    const status = health.status === 'UP' ? 200 : 503;
    res.status(status).json(health);
});

// System Settings (Admin Only)
router.get('/settings', authenticate, authorize(['admin']), async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const settings = await systemService.getSettings(tenantId);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    res.json({ success: true, data: { ...settings, yourIp: ip } });
});

router.put('/settings', authenticate, authorize(['admin']), async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const updated = await systemService.updateSettings(req.body, tenantId);

    // Audit Log
    await auditRepository.log({
        tenantId: tenantId || null,
        entity: 'SystemSetting',
        entityId: updated.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        userId: req.user?.id || req.user?.employeeId,
        details: {
            biometricEnabled: updated.biometricEnabled,
            maintenanceMode: updated.maintenanceMode,
            globalRadius: updated.globalRadius,
            hasAllowedIPs: !!updated.allowedIPs
        }
    }).catch(err => console.error('[Audit Error] updateSettings:', err));

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

// Endpoint biometría con detección multi-tenant y soporte público
router.get('/biometric-setting', optionalAuth, async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId || req.query.tenantId || null;
        const settings = await systemService.getSettings(tenantId);
        res.json({ success: true, biometricEnabled: settings?.biometricEnabled ?? false });
    } catch (error) {
        res.json({ success: true, biometricEnabled: false });
    }
});

export default router;
