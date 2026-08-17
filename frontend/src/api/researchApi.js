import api from './axios';

/**
 * API Client para el Módulo Público de Investigación Científica
 */

export const submitResearchSurvey = async (surveyData) => {
    const res = await api.post('/research/submit', surveyData);
    return res.data;
};

export const getResearchResults = async (params = {}) => {
    const res = await api.get('/research/results', { params });
    return res.data;
};

export const seedSyntheticResponses = async (seedData) => {
    const res = await api.post('/research/seed', seedData);
    return res.data;
};

export const deleteSyntheticResponses = async (params = {}) => {
    const res = await api.delete('/research/responses/synthetic', { params });
    return res.data;
};

export const getExportCsvUrl = (includeSynthetic = true) => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    return `${baseUrl}/research/export/csv?includeSynthetic=${includeSynthetic}`;
};
