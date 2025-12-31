import api from '../../api/axios';

export const getPayrollConfig = async () => {
    try {
        const response = await api.get('/payroll/config');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener configuración');
    }
};

export const savePayrollConfig = async (configData) => {
    try {
        const response = await api.post('/payroll/config', configData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al guardar configuración');
    }
};

export const generatePayroll = async (month, year) => {
    try {
        const response = await api.post('/payroll/generate', { month, year });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al generar nómina');
    }
};

export const getPayrolls = async () => {
    try {
        const response = await api.get('/payroll');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener nóminas');
    }
};

export const getMyPayrolls = async () => {
    try {
        const response = await api.get('/payroll/my-payrolls');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener mis roles de pago');
    }
};

export const getPayrollById = async (id) => {
    try {
        const response = await api.get(`/payroll/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener detalle');
    }
};

export const confirmPayroll = async (id) => {
    try {
        const response = await api.put(`/payroll/${id}/confirm`, { confirmed: true });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al confirmar nómina');
    }
};

export const downloadBankFile = async (id) => {
    try {
        const response = await api.get(`/payroll/${id}/bank-file`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'transferencias_bancarias.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        return { success: true };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al generar archivo');
    }
};

export const markPayrollAsPaid = async (id) => {
    try {
        const response = await api.put(`/payroll/${id}/mark-paid`, { paid: true });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al marcar como pagado');
    }
};
