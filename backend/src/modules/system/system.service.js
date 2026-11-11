/**
 * @file system.service.js
 * @description Norma ERP - Servicio de Configuración de Sistema y Salud
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { systemRepository } from './system.repository.js';
import { encryptCoordinate, decryptCoordinate } from '../../core/security/encryption.js';

export class SystemService {
  async getSettings(tenantId = null) {
    try {
      let settings = null;
      if (tenantId) {
        settings = await systemRepository.findByTenantId(tenantId);
      }

      if (!settings) {
        settings = await systemRepository.findFirst();
      }

      if (!settings) {
        settings = await systemRepository.upsertDefault({
          id: 'default',
          tenantId: tenantId || null,
          maintenanceMode: false,
          biometricEnabled: false,
          allowedIPs: null,
          globalLatitude: null,
          globalLongitude: null,
          globalRadius: 200,
          maintenanceMessage: 'El sistema estará en mantenimiento brevemente.',
        });
      }

      return {
        ...settings,
        globalLatitude: decryptCoordinate(settings.globalLatitude),
        globalLongitude: decryptCoordinate(settings.globalLongitude),
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {
        id: 'default',
        tenantId: tenantId || null,
        maintenanceMode: false,
        biometricEnabled: false,
        allowedIPs: null,
        globalLatitude: null,
        globalLongitude: null,
        globalRadius: 200,
        maintenanceMessage: 'El sistema estará en mantenimiento brevemente.',
      };
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

    let settings;
    if (tenantId) {
      const existing = await systemRepository.findByTenantId(tenantId);
      if (existing) {
        settings = await systemRepository.updateById(existing.id, updateData);
      } else {
        settings = await systemRepository.create({
          tenantId,
          maintenanceMode: false,
          biometricEnabled: false,
          allowedIPs: null,
          globalLatitude: null,
          globalLongitude: null,
          globalRadius: 200,
          maintenanceMessage: 'El sistema estará en mantenimiento brevemente.',
          ...updateData,
        });
      }
    } else {
      settings = await systemRepository.upsertById('default', updateData, {
        id: 'default',
        maintenanceMode: false,
        biometricEnabled: false,
        allowedIPs: null,
        globalLatitude: null,
        globalLongitude: null,
        globalRadius: 200,
        maintenanceMessage: 'El sistema estará en mantenimiento brevemente.',
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
}

export const systemService = new SystemService();
export default systemService;
