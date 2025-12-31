import api from '../../api/axios';

const getShifts = async () => {
    try {
        const response = await api.get('/shifts');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const createShift = async (data) => {
    try {
        const response = await api.post('/shifts', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const assignShifts = async (payload) => {
    try {
        const response = await api.post('/shifts/assign', payload);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export default {
    getShifts,
    createShift,
    assignShifts
};
