import api from '../api/axios';

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
    getEntityLogs
};

export default auditService;
