import api from '../../api/axios';

const markAttendance = async (employeeId, type) => {
    try {
        const response = await api.post('/attendance/mark', { employeeId, type });
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
        // If 404 or other error, might just mean no status or invalid ID
        console.error("Error fetching status", error);
        return { success: false };
    }
};

export default {
    markAttendance,
    getStatus
};
