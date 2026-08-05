import api from '../../api/axios';

export const requestAdvance = async (data) => {
    try {
        const response = await api.post('/salary-advances/request', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al solicitar anticipo');
    }
};

export const getMyAdvances = async () => {
    try {
        const response = await api.get('/salary-advances/my');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener mis anticipos');
    }
};

export const getAdvances = async (params = {}) => {
    try {
        const response = await api.get('/salary-advances', { params });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar lista de anticipos');
    }
};

export const approveAdvance = async (id) => {
    try {
        const response = await api.post(`/salary-advances/${id}/approve`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al aprobar anticipo');
    }
};

export const rejectAdvance = async (id, rejectionReason) => {
    try {
        const response = await api.post(`/salary-advances/${id}/reject`, { rejectionReason });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al rechazar anticipo');
    }
};

export const cancelAdvance = async (id) => {
    try {
        const response = await api.delete(`/salary-advances/${id}/cancel`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cancelar solicitud');
    }
};
