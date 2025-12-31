import api from '../api/axios';

// Public Public
export const getPublicVacancies = async () => {
    const response = await api.get('/recruitment/public');
    return response.data;
};

// Admin Vacancies
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

// Admin Applications
export const getApplicationsByVacancy = async (id) => {
    const response = await api.get(`/recruitment/${id}/applications`);
    return response.data;
};

export const getApplicationDetails = async (id) => {
    const response = await api.get(`/recruitment/applications/${id}`);
    return response.data;
};

export const updateApplicationStatus = async (id, status) => {
    const response = await api.put(`/recruitment/applications/${id}/status`, { status });
    return response.data;
};

export const addApplicationNote = async (id, content) => {
    const response = await api.post(`/recruitment/applications/${id}/notes`, { content });
    return response.data;
};
