import api from '../../api/axios';

const markAttendance = async (employeeId, type, location = null) => {
    try {
        const response = await api.post('/attendance/mark', { employeeId, type, location });
        return response.data;
    } catch (error) {
        // Return object with success: false and the actual message for consistency
        const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Error desconocido';
        return { success: false, message };
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

export const clockIn = (employeeId, location) => markAttendance(employeeId, 'IN', location);
export const clockOut = (employeeId, location) => markAttendance(employeeId, 'OUT', location);

export { markAttendance, getStatus };

export default {
    markAttendance,
    getStatus,
    clockIn,
    clockOut
};
