import api from '../../api/axios';

export const createBenefit = async (data) => {
    try {
        const response = await api.post('/benefits', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al crear beneficio');
    }
};

export const bulkCreateBenefit = async (data) => {
    try {
        const response = await api.post('/benefits/bulk', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al crear beneficios masivos');
    }
};

export const getEmployeeBenefits = async (employeeId) => {
    try {
        const response = await api.get(`/benefits/employee/${employeeId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener beneficios');
    }
};

export const deactivateBenefit = async (id) => {
    try {
        const response = await api.put(`/benefits/${id}/deactivate`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al desactivar beneficio');
    }
};
