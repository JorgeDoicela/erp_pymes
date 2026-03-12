import api from '../api/axios';

const entrepreneurshipService = {
    // Proyectos
    getProjects: async (filters = {}) => {
        const response = await api.get('/entrepreneurship', { params: filters });
        return response.data;
    },
    createProject: async (data) => {
        const response = await api.post('/entrepreneurship', data);
        return response.data;
    },
    getProjectDetails: async (id) => {
        const response = await api.get(`/entrepreneurship/${id}`);
        return response.data;
    },
    updateProject: async (id, data) => {
        const response = await api.patch(`/entrepreneurship/${id}`, data);
        return response.data;
    },
    deleteProject: async (id) => {
        const response = await api.delete(`/entrepreneurship/${id}`);
        return response.data;
    },

    // Hitos (Milestones)
    addMilestone: async (data) => {
        const response = await api.post('/entrepreneurship/milestones', data);
        return response.data;
    },
    updateMilestone: async (id, data) => {
        const response = await api.patch(`/entrepreneurship/milestones/${id}`, data);
        return response.data;
    },

    // Actualizaciones (Updates)
    addUpdate: async (data) => {
        const response = await api.post('/entrepreneurship/updates', data);
        return response.data;
    },

    // Analytics (BI)
    getAnalytics: (id) => api.get(`/entrepreneurship/${id}/analytics`),

    // Gestión de Capital (Equity)
    getCapTable: (id) => api.get(`/entrepreneurship/${id}/captable`),
    addEquity: (data) => api.post('/entrepreneurship/equity', data),
    updateEquity: (id, data) => api.patch(`/entrepreneurship/equity/${id}`, data),
    deleteEquity: (id) => api.delete(`/entrepreneurship/equity/${id}`),

    getFunding: (id) => api.get(`/entrepreneurship/${id}/funding`),
    addFunding: (data) => api.post('/entrepreneurship/funding', data),
    updateFunding: (id, data) => api.patch(`/entrepreneurship/funding/${id}`, data),
    deleteFunding: (id) => api.delete(`/entrepreneurship/funding/${id}`),

    // Validación y Clientes
    getInterviews: (id) => api.get(`/entrepreneurship/${id}/interviews`),
    addInterview: (data) => api.post('/entrepreneurship/interviews', data),
    updateInterview: (id, data) => api.patch(`/entrepreneurship/interviews/${id}`, data),
    deleteInterview: (id) => api.delete(`/entrepreneurship/interviews/${id}`),
    updateMarket: (data) => api.post('/entrepreneurship/market', data)
};

export default entrepreneurshipService;
