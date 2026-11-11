/**
 * @file compliance.service.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import api from '@core/api/httpClient';

export const getComplianceAlerts = async () => {
  try {
    const response = await api.get('/compliance/alerts');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener alertas de cumplimiento');
  }
};

export const getStatutoryProvisions = async (month, year) => {
  try {
    const response = await api.get('/compliance/provisions', { params: { month, year } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener provisiones sociales');
  }
};
