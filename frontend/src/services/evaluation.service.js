import api from '../api/axios';

export const getPerformanceStats = async () => {
    const response = await api.get('/performance/stats');
    return response.data;
};

export const getEmployeeEvaluations = async (params = {}) => {
    const response = await api.get('/performance/evaluations', { params });
    return response.data;
};

export const createEvaluationTemplate = async (data) => {
    const response = await api.post('/performance/templates', data);
    return response.data;
};

export const getEvaluationTemplates = async () => {
    const response = await api.get('/performance/templates');
    return response.data;
};

export const assignEvaluation = async (data) => {
    const response = await api.post('/performance/assignments', data);
    return response.data;
};

export const getMyPendingEvaluations = async () => {
    const response = await api.get('/performance/my-pending');
    return response.data;
};

export const submitAssessment = async (data) => {
    const response = await api.post('/performance/submit', data);
    return response.data;
};

export const getEvaluationResults = async (id) => {
    const response = await api.get(`/performance/results/${id}`);
    return response.data;
};

export const getMyResultsList = async () => {
    const response = await api.get('/performance/my-results');
    return response.data;
};
