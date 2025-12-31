import api from '../../api/axios';

export const getAttendanceReport = async (startDate, endDate, department, employeeId) => {
    try {
        const response = await api.get('/reports/attendance', {
            params: { startDate, endDate, department, employeeId }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener reporte');
    }
};
