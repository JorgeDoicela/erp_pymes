/**
 * @file attendanceService.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import api from '@core/api/httpClient';

const markAttendance = async (employeeId, type, location = null, options = {}) => {
  try {
    const payload = { employeeId, type, location };
    if (options?.autoGeofence) {
      payload.autoGeofence = true;
    }
    const response = await api.post('/attendance/mark', payload);
    return response.data;
  } catch (error) {
    // Return object with success: false and the actual message for consistency
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Error desconocido';
    return { success: false, message };
  }
};

const getStatus = async (employeeId) => {
  try {
    const response = await api.get(`/attendance/status/${employeeId}`);
    return response.data;
  } catch (error) {
    // Return the backend error message so the UI can display it
    const message =
      error.response?.data?.message || error.response?.data?.error || 'Error al buscar empleado.';
    return { success: false, message };
  }
};

export { markAttendance, getStatus };

export default {
  markAttendance,
  getStatus,
};
