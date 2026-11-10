/**
 * @file analytics.service.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import api from '@/core/api/httpClient';

export const getDashboardData = async () => {
  const response = await api.get('/analytics/dashboard');
  return response.data;
};

export const getTurnoverReport = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await api.get(`/analytics/turnover?${params.toString()}`);
  return response.data;
};

export const getPerformanceReport = async (startDate, endDate, department) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (department) params.append('department', department);
  const response = await api.get(`/analytics/performance?${params.toString()}`);
  return response.data;
};

export const getPayrollCostReport = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await api.get(`/analytics/payroll-costs?${params.toString()}`);
  return response.data;
};

export const getSatisfactionReport = async () => {
  const response = await api.get('/analytics/satisfaction');
  return response.data;
};

export const generateCustomReport = async (config) => {
  const response = await api.post('/analytics/custom-report', config);
  return response.data;
};
