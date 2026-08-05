import api from '../../api/axios';

export const getComplianceAlerts = async () => {
    try {
        const response = await api.get('/compliance/alerts');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener alertas de cumplimiento');
    }
};

export const getStatutoryProvisions = async (month, year) => {
    try {
        const response = await api.get('/compliance/provisions', { params: { month, year } });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener provisiones sociales');
    }
};
