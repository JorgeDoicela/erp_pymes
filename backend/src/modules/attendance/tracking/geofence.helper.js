/**
 * @file geofence.helper.js
 * @description Motor de cálculo geodésico Haversine, validación de geocercas (perímetro e hitos de salida automática) y detección anti-VPN.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import axios from 'axios';
import { decryptCoordinate } from '../../../core/security/encryption.js';
import { isIpAllowed } from '../../../core/utils/ipUtils.js';

const vpnCache = new Map();
const VPN_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Calcula la distancia geodésica en metros entre dos coordenadas (fórmula de Haversine)
 * @param {number} lat1 - Latitud punto 1
 * @param {number} lon1 - Longitud punto 1
 * @param {number} lat2 - Latitud punto 2
 * @param {number} lon2 - Longitud punto 2
 * @returns {number} Distancia en metros
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const earthRadiusMeters = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
};

/**
 * Extrae y desencripta la configuración activa de geocerca para un colaborador
 * @param {Object} employee - Entidad empleado
 * @param {Object|null} systemSettings - Configuración del tenant
 * @returns {Object} Configuración normalizada de geocerca
 */
export const resolveEmployeeGeofenceConfig = (employee, systemSettings = null) => {
  const useGlobalGeofence = Boolean(
    systemSettings?.globalLatitude && systemSettings?.globalLongitude
  );
  const rawLat = employee?.workLatitude || systemSettings?.globalLatitude;
  const rawLng = employee?.workLongitude || systemSettings?.globalLongitude;
  const targetLat = decryptCoordinate(rawLat);
  const targetLng = decryptCoordinate(rawLng);
  const radius = Number(employee?.geofenceRadius || systemSettings?.globalRadius || 200);
  const enabled = Boolean(
    (employee?.enforceGeofence || useGlobalGeofence) && targetLat !== null && targetLng !== null
  );

  return {
    enabled,
    enforceGeofence: Boolean(employee?.enforceGeofence || useGlobalGeofence),
    targetLat,
    targetLng,
    radius,
  };
};

/**
 * Valida consentimiento LOPDP y perímetro de geocerca según modo (manual vs salida automática al cruzar radio)
 * @param {Object} params - Parámetros de validación
 * @returns {Object} Ubicación normalizada y distancia medida
 */
export const validateAttendanceGeofence = ({
  employee,
  systemSettings,
  location,
  type,
  isSupervisorOverride = false,
  autoGeofence = false,
}) => {
  const geofence = resolveEmployeeGeofenceConfig(employee, systemSettings);
  let effectiveLocation = location;

  if (!employee.trackingConsent) {
    if (geofence.enforceGeofence && !isSupervisorOverride) {
      throw new Error(
        'No ha otorgado el consentimiento obligatorio para el tratamiento de datos de ubicación. Por favor acepte los términos de privacidad en su perfil para marcar asistencia.'
      );
    }
    if (!isSupervisorOverride) {
      effectiveLocation = null;
    }
  }

  if (geofence.enforceGeofence || effectiveLocation) {
    const hasCoords = Boolean(
      effectiveLocation &&
      typeof effectiveLocation.latitude === 'number' &&
      typeof effectiveLocation.longitude === 'number'
    );

    if (geofence.enforceGeofence && !hasCoords) {
      throw new Error('La ubicación es requerida para marcar asistencia.');
    }

    if (geofence.targetLat !== null && geofence.targetLng !== null && hasCoords) {
      const distance = calculateHaversineDistance(
        effectiveLocation.latitude,
        effectiveLocation.longitude,
        geofence.targetLat,
        geofence.targetLng
      );

      // En auto-salida por cruce de perímetro (EXIT + autoGeofence), el disparo ocurre justamente al superar el radio permitido
      const isAutoPerimeterExit = Boolean(autoGeofence && type === 'EXIT');

      if (!isAutoPerimeterExit && distance > geofence.radius) {
        throw new Error(
          `Ubicación no permitida. Estás a ${Math.round(distance)}m del sitio de trabajo permitido (Límite: ${geofence.radius}m).`
        );
      }

      return { effectiveLocation, distance, geofence };
    }
  }

  return { effectiveLocation, distance: null, geofence };
};

/**
 * Detecta conexiones tras VPN, Proxy o Hosting con caché en memoria por IP
 * @param {string|null} ip - Dirección IP del cliente
 * @returns {Promise<boolean>}
 */
export const isVPNDetected = async (ip) => {
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    return false;
  }

  const cached = vpnCache.get(ip);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }

  try {
    const response = await axios.get(
      `http://ip-api.com/json/${ip}?fields=status,message,proxy,hosting`,
      { timeout: 2000 }
    );

    if (response.data.status === 'success') {
      const isVPN = response.data.proxy === true || response.data.hosting === true;
      vpnCache.set(ip, { result: isVPN, expiresAt: Date.now() + VPN_CACHE_TTL_MS });
      return isVPN;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Valida políticas de seguridad de red (Anti-VPN y lista blanca de IPs del tenant)
 * @param {string|null} ip - Dirección IP del cliente
 * @param {Object|null} systemSettings - Configuración del tenant
 */
export const validateNetworkPolicy = async (ip, systemSettings) => {
  if (ip) {
    const isVPN = await isVPNDetected(ip);
    if (isVPN) {
      throw new Error(
        'Conexión vía VPN/Proxy detectada. No está permitido marcar asistencia usando este tipo de conexiones.'
      );
    }
  }

  if (systemSettings?.ipRestrictionEnabled && systemSettings?.allowedIPs) {
    if (!ip || !isIpAllowed(ip, systemSettings.allowedIPs)) {
      throw new Error(
        `Conexión no permitida desde esta red (${ip || 'IP desconocida'}). Contacte al administrador.`
      );
    }
  }
};

export const computeEntryLateness = (checkInDate, activeSchedule) => {
  const shiftStartTime = activeSchedule?.shift?.startTime || '08:00';
  const tolerance = activeSchedule?.shift?.toleranceMinutes ?? 15;
  const limitParams = new Date(checkInDate);
  const [sh, sm] = shiftStartTime.split(':').map(Number);
  limitParams.setHours(sh, sm + tolerance, 0, 0);
  return checkInDate > limitParams;
};

export const computeExitMetrics = (now, existingRecord, activeSchedule) => {
  const checkInTime = new Date(existingRecord.checkIn);
  let diffMs = now - checkInTime;

  if (existingRecord.breakStart) {
    const breakEnd = existingRecord.breakEnd ? new Date(existingRecord.breakEnd) : now;
    const breakDuration = breakEnd - new Date(existingRecord.breakStart);
    if (breakDuration > 0) diffMs -= breakDuration;
  }

  const workedHours = Math.max(0, parseFloat((diffMs / 3600000).toFixed(2)));
  const exitMetrics = { workedHours };

  if (activeSchedule?.shift?.endTime) {
    const [eh, em] = activeSchedule.shift.endTime.split(':').map(Number);
    const shiftEndTime = new Date(now);
    shiftEndTime.setHours(eh, em, 0, 0);

    let expectedHours = 8;
    let entryDelayHours = 0;

    if (activeSchedule.shift.startTime) {
      const [sh, sm] = activeSchedule.shift.startTime.split(':').map(Number);
      const shiftStartTime = new Date(checkInTime);
      shiftStartTime.setHours(sh, sm, 0, 0);
      if (checkInTime > shiftStartTime) entryDelayHours = (checkInTime - shiftStartTime) / 3600000;

      let shiftSpanHours = eh + em / 60 - (sh + sm / 60);
      if (shiftSpanHours < 0) shiftSpanHours += 24;
      const breakMinutes =
        activeSchedule.shift.breakMinutes !== undefined
          ? Number(activeSchedule.shift.breakMinutes)
          : existingRecord.breakStart
            ? 60
            : 0;
      expectedHours = Math.max(0, shiftSpanHours - breakMinutes / 60);
    }

    if (now > shiftEndTime) {
      const extraAfterShiftEnd = (now - shiftEndTime) / 3600000;
      const netExcessOverExpected = Math.max(0, workedHours - expectedHours);
      const netExcessAfterDelay = Math.max(0, extraAfterShiftEnd - entryDelayHours);
      const effectiveOvertime = parseFloat(
        Math.min(extraAfterShiftEnd, netExcessOverExpected, netExcessAfterDelay).toFixed(2)
      );
      if (effectiveOvertime > 0) exitMetrics.overtimeHours = effectiveOvertime;
    } else if (now < shiftEndTime) {
      if (Math.floor((shiftEndTime - now) / 60000) >= 1) exitMetrics.isEarlyDeparture = true;
    }
  }

  return exitMetrics;
};

export const decryptLocationPair = (latCipher, lngCipher) => {
  if (!latCipher || !lngCipher) return null;
  const lat = decryptCoordinate(latCipher);
  const lng = decryptCoordinate(lngCipher);
  return lat !== null && lng !== null ? { lat, lng } : null;
};
