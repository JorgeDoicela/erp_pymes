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

export const getPayrollCostReport = async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/analytics/payroll-costs?${params.toString()}`);
    return response.data;
};

export const getSatisfactionReport = async () => {
    const response = await api.get('/analytics/satisfaction');
    return response.data;
};

export const generateCustomReport = async (config) => {
    const response = await api.post('/analytics/custom-report', config);
    return response.data;
};
