import api from '../api/axios';

export const createVacancy = async (data) => {
    const response = await api.post('/recruitment', data);
    return response.data;
};

export const getVacancies = async () => {
    const response = await api.get('/recruitment');
    return response.data;
};

export const updateVacancyStatus = async (id, status) => {
    const response = await api.put(`/recruitment/${id}/status`, { status });
    return response.data;
};

export const getPublicVacancies = async () => {
    const response = await api.get('/recruitment/public');
    return response.data;
};
