import api from '../api/axios';

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
