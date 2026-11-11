/**
 * @file system.controller.js
 * @description Controlador REST para configuración del sistema, geocodificación y monitoreo de salud (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { systemService } from './system.service.js';
import { auditRepository } from '../audit/index.js';

export const getHealth = async (req, res, next) => {
  try {
    const health = await systemService.checkHealth();
    const status = health.status === 'UP' ? 200 : 503;
    res.status(status).json(health);
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const settings = await systemService.getSettings(tenantId);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    res.json({ success: true, data: { ...settings, yourIp: ip } });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const updated = await systemService.updateSettings(req.body, tenantId);

    await auditRepository
      .log({
        tenantId: tenantId || null,
        entity: 'SystemSetting',
        entityId: updated.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        userId: req.user?.id || req.user?.employeeId,
        details: {
          biometricEnabled: updated.biometricEnabled,
          maintenanceMode: updated.maintenanceMode,
          globalRadius: updated.globalRadius,
          hasAllowedIPs: !!updated.allowedIPs,
        },
      })
      .catch((err) => console.error('[Audit Error] updateSettings:', err));

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Missing lat/lng' });
    }
    const data = await systemService.reverseGeocode(lat, lng);
    res.json(data || {});
  } catch (error) {
    next(error);
  }
};

export const getBiometricSetting = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId || req.query.tenantId || null;
    const settings = await systemService.getSettings(tenantId);
    res.json({ success: true, biometricEnabled: settings?.biometricEnabled ?? false });
  } catch {
    res.json({ success: true, biometricEnabled: false });
  }
};

export const getSmtpStatus = async (req, res, next) => {
  try {
    const status = await systemService.getSmtpStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

export const sendTestEmail = async (req, res, next) => {
  try {
    const { to } = req.body || {};
    const recipient = to || req.user?.email;
    const result = await systemService.sendTestEmail(recipient);
    res.json({ success: true, message: `Correo de prueba emitido a ${recipient}`, data: result });
  } catch (error) {
    next(error);
  }
};

export default {
  getHealth,
  getSettings,
  updateSettings,
  reverseGeocode,
  getBiometricSetting,
  getSmtpStatus,
  sendTestEmail,
};
