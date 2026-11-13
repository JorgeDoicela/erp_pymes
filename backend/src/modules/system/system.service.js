/**
 * @file system.service.js
 * @description Norma ERP - Servicio de Configuración de Sistema y Salud
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { systemRepository } from './system.repository.js';
import { encryptCoordinate, decryptCoordinate } from '../../core/security/encryption.js';
import { validateAllowedIps } from '../../core/utils/ipUtils.js';
import { ValidationError } from '../../core/errors/appError.js';

const buildDefaultSettings = (tenantId = null) => ({
  ...(tenantId ? { tenantId } : { id: 'default', tenantId: null }),
  maintenanceMode: false,
  biometricEnabled: false,
  ipRestrictionEnabled: false,
  allowedIPs: null,
  globalLatitude: null,
  globalLongitude: null,
  globalRadius: 200,
  maintenanceMessage: 'El sistema estará en mantenimiento brevemente.',
});

export class SystemService {
  async getSettings(tenantId = null) {
    try {
      let settings = null;
      if (tenantId) {
        settings = await systemRepository.findByTenantId(tenantId);
        if (!settings) {
          settings = await systemRepository.create(buildDefaultSettings(tenantId));
        }
      } else {
        settings = await systemRepository.findGlobalDefault();
        if (!settings) {
          settings = await systemRepository.upsertDefault(buildDefaultSettings(null));
        }
      }

      return {
        ...settings,
        globalLatitude: decryptCoordinate(settings.globalLatitude),
        globalLongitude: decryptCoordinate(settings.globalLongitude),
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return buildDefaultSettings(tenantId);
    }
  }

  async updateSettings(data, tenantId = null) {
    const updateData = { ...data };
    if (data.globalLatitude !== undefined) {
      updateData.globalLatitude = encryptCoordinate(data.globalLatitude);
    }
    if (data.globalLongitude !== undefined) {
      updateData.globalLongitude = encryptCoordinate(data.globalLongitude);
    }
    if (data.allowedIPs !== undefined) {
      try {
        updateData.allowedIPs = validateAllowedIps(data.allowedIPs);
      } catch (err) {
        throw new ValidationError(err.message);
      }
    }

    let settings;
    if (tenantId) {
      const existing = await systemRepository.findByTenantId(tenantId);
      const effectiveAllowedIPs =
        updateData.allowedIPs !== undefined ? updateData.allowedIPs : existing?.allowedIPs;
      const effectiveIpEnabled =
        updateData.ipRestrictionEnabled !== undefined
          ? Boolean(updateData.ipRestrictionEnabled)
          : Boolean(existing?.ipRestrictionEnabled);

      if (effectiveIpEnabled && !effectiveAllowedIPs) {
        throw new ValidationError(
          'Debe registrar al menos una dirección IP o rango CIDR válido antes de activar la restricción por IP.'
        );
      }

      if (existing) {
        settings = await systemRepository.updateById(existing.id, updateData);
      } else {
        settings = await systemRepository.create({
          ...buildDefaultSettings(tenantId),
          ...updateData,
        });
      }
    } else {
      settings = await systemRepository.upsertById('default', updateData, {
        ...buildDefaultSettings(null),
        ...updateData,
      });
    }

    return {
      ...settings,
      globalLatitude: decryptCoordinate(settings.globalLatitude),
      globalLongitude: decryptCoordinate(settings.globalLongitude),
    };
  }

  async checkHealth() {
    try {
      await systemRepository.checkDatabaseConnection();
      return {
        status: 'UP',
        database: 'CONNECTED',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        status: 'DOWN',
        database: 'DISCONNECTED',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      if (!lat || !lng) throw new Error('Coordinates missing');

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NormaERP-HR/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim responded with status ${response.status}`);
      }

      const data = await response.json();

      let placeName = 'Ubicación Desconocida';
      if (data && data.address) {
        const addr = data.address;
        const main = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood;
        const city = addr.city || addr.town || addr.village || addr.county;
        if (main && city) placeName = `${main}, ${city}`;
        else if (main) placeName = main;
        else if (city) placeName = city;
        else placeName = data.display_name.split(',')[0];
      } else if (data && data.display_name) {
        placeName = data.display_name.split(',')[0];
      }

      return {
        placeName,
        details: data?.address || null,
      };
    } catch (error) {
      console.warn('[System Service] Reverse geocoding failed:', error.message);
      return {
        placeName: `${lat}, ${lng}`,
        details: null,
      };
    }
  }

  async getSmtpStatus() {
    const { emailService } = await import('../notifications/index.js');
    return emailService.verifyConnection();
  }

  async sendTestEmail(recipientEmail) {
    const { emailService } = await import('../notifications/index.js');
    const targetEmail = recipientEmail || process.env.EMAIL_USER || 'admin@normaerp.com';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #ffffff;">
        <h2 style="color: #111827; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Comprobación de Servidor SMTP · Norma ERP</h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.5;">Este es un correo de prueba emitido automáticamente para validar la conectividad del servidor SMTP, el pool de conexiones y la entregabilidad del sistema.</p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; margin: 16px 0; font-size: 12px; color: #4b5563; font-family: monospace;">
          <div><strong>Estado:</strong> Conexión Verificada</div>
          <div><strong>Fecha y Hora:</strong> ${new Date().toISOString()}</div>
          <div><strong>Destinatario:</strong> ${targetEmail}</div>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">Si has recibido este mensaje, el servicio de correo transaccional de Norma ERP se encuentra operando correctamente.</p>
      </div>
    `;

    return emailService.sendEmail({
      to: targetEmail,
      subject: 'Prueba de Conectividad SMTP · Norma ERP',
      html,
    });
  }
}

export const systemService = new SystemService();
export default systemService;
