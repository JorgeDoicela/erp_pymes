/**
 * @file geolocationUtils.js
 * @description Utilidades de geolocalización de navegador, cálculo geodésico Haversine y persistencia local de auto-marcado.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

const STORAGE_PREFIX = 'norma:auto-geofence:';

export const computeClientHaversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const readAutoGeofencePrefs = (employeeId) => {
  if (!employeeId || typeof window === 'undefined') {
    return { autoEntryEnabled: false, autoExitEnabled: false };
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${employeeId}`) || 'null');
    return {
      autoEntryEnabled: Boolean(parsed?.autoEntryEnabled),
      autoExitEnabled: Boolean(parsed?.autoExitEnabled),
    };
  } catch {
    return { autoEntryEnabled: false, autoExitEnabled: false };
  }
};

export const writeAutoGeofencePrefs = (employeeId, prefs) => {
  if (!employeeId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${employeeId}`, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
};

export const readStoredSessionUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const requestNavigatorLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada por su navegador'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Permiso de ubicación denegado'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'Ubicación no disponible'
              : err.code === err.TIMEOUT
                ? 'Tiempo de espera agotado al obtener ubicación'
                : 'Error obteniendo ubicación';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
