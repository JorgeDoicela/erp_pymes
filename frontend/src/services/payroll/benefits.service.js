import api from '../../api/axios';

export const getBenefits = async (params = {}) => {
    try {
        const response = await api.get('/benefits', { params });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener la lista de beneficios');
    }
};

export const getBenefitStats = async () => {
    try {
        const response = await api.get('/benefits/stats');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener estadísticas de beneficios');
    }
};

export const getEmployeeBenefits = async (employeeId) => {
    try {
        const response = await api.get(`/benefits/employee/${employeeId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener beneficios del colaborador');
    }
};

export const createBenefit = async (data) => {
    try {
        const response = await api.post('/benefits', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al registrar beneficio');
    }
};

export const bulkCreateBenefit = async (data) => {
    try {
        const response = await api.post('/benefits/bulk', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al realizar asignación masiva');
    }
};

export const updateBenefit = async (id, data) => {
    try {
        const response = await api.put(`/benefits/${id}`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al actualizar beneficio');
    }
};

export const deactivateBenefit = async (id) => {
    try {
        const response = await api.put(`/benefits/${id}/deactivate`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cancelar beneficio');
    }
};
