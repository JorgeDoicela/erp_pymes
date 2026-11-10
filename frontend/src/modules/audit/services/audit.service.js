/**
 * @file audit.service.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import api from '@/core/api/httpClient';

export const getAuditStats = async () => {
  const response = await api.get('/audit/stats');
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  const response = await api.get('/audit', { params });
  return response.data;
};

export const getEntityLogs = async (entityId) => {
  const response = await api.get(`/audit/${entityId}`);
  return response.data;
};

const auditService = {
  getAuditStats,
  getAuditLogs,
  getEntityLogs,
};

export default auditService;
