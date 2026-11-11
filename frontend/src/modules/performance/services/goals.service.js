/**
 * @file goals.service.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import api from '@/core/api/httpClient';

export const getMyGoals = async () => {
  const response = await api.get('/goals');
  return response.data;
};

export const createGoal = async (data) => {
  const response = await api.post('/goals', data);
  return response.data;
};

export const updateGoalProgress = async (id, data) => {
  const response = await api.put(`/goals/${id}/progress`, data);
  return response.data;
};

export const deleteGoal = async (id) => {
  const response = await api.delete(`/goals/${id}`);
  return response.data;
};

const goalsService = {
  getMyGoals,
  createGoal,
  updateGoalProgress,
  deleteGoal,
};

export default goalsService;
