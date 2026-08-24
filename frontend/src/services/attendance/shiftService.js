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

const updateShift = async (id, data) => {
    try {
        const response = await api.put(`/shifts/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const deleteShift = async (id) => {
    try {
        const response = await api.delete(`/shifts/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const getAllSchedules = async () => {
    try {
        const response = await api.get('/shifts/schedules');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const deleteSchedule = async (id) => {
    try {
        const response = await api.delete(`/shifts/schedule/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export default {
    getShifts,
    createShift,
    updateShift,
    deleteShift,
    assignShifts,
    getAllSchedules,
    deleteSchedule
};
