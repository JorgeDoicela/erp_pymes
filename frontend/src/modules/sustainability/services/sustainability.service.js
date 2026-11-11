/**
 * @file sustainability.service.js
 * @description Servicio de integración frontend para el dominio de Sostenibilidad ODS 8 y Asistente RAG Ecuatoriano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import api from '@core/api/httpClient';

/**
 * Obtiene el panel consolidado de métricas del ODS 8
 */
export const getOds8Metrics = async () => {
  const response = await api.get('/sustainability/ods8');
  return response.data;
};

/**
 * Envía una consulta al Asistente RAG con marco legal de Ecuador
 * @param {Object} payload { query, conversationHistory, odsTargetFilter }
 */
export const queryAdvisor = async (payload) => {
  const response = await api.post('/sustainability/advisor/query', payload);
  return response.data;
};

/**
 * Descarga o genera el dataset de Fine-Tuning en formato JSONL para el modelo grande
 * @param {Object} options { targetModel, includeTenantData, categories }
 */
export const exportFineTuningDataset = async (options = {}) => {
  const response = await api.post('/sustainability/fine-tuning/export', options);
  return response.data;
};
