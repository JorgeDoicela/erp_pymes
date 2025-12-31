import api from '../api/axios';

export const getDashboardData = async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
};

export const getTurnoverReport = async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/analytics/turnover?${params.toString()}`);
    return response.data;
}

export const getPerformanceReport = async (startDate, endDate, department) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (department) params.append('department', department);
    const response = await api.get(`/analytics/performance?${params.toString()}`);
    return response.data;
};
