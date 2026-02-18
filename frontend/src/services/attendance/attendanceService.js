import api from '../../api/axios';

const markAttendance = async (employeeId, type, location = null) => {
    try {
        const response = await api.post('/attendance/mark', { employeeId, type, location });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const getStatus = async (employeeId) => {
    try {
        const response = await api.get(`/attendance/status/${employeeId}`);
        return response.data;
    } catch (error) {
        // Return the backend error message so the UI can display it
        const message = error.response?.data?.message || error.response?.data?.error || 'Error al buscar empleado.';
        return { success: false, message };
    }
};

export default {
    markAttendance,
    getStatus
};
