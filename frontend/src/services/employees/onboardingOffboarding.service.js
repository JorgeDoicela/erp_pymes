import api from '../../api/axios';

// --- EXPEDIENTE DIGITAL ---
export const getMyExpedient = async () => {
    try {
        const response = await api.get('/onboarding-offboarding/expedient/my');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener tu expediente digital');
    }
};

export const getEmployeeExpedient = async (employeeId) => {
    try {
        const response = await api.get(`/onboarding-offboarding/expedient/${employeeId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener expediente del empleado');
    }
};

export const uploadExpedientDocument = async (data) => {
    try {
        const response = await api.post('/onboarding-offboarding/expedient/upload', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar documento');
    }
};

export const verifyExpedientDocument = async (documentId, status, notes) => {
    try {
        const response = await api.put(`/onboarding-offboarding/expedient/verify/${documentId}`, { status, notes });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al verificar documento');
    }
};

// --- EQUIPOS Y EPPS ---
export const getAllAssets = async (params = {}) => {
    try {
        const response = await api.get('/onboarding-offboarding/assets', { params });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar inventario de activos/EPPs');
    }
};

export const getEmployeeAssets = async (employeeId) => {
    try {
        const response = await api.get(`/onboarding-offboarding/assets/employee/${employeeId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar activos del empleado');
    }
};

export const deliverAsset = async (data) => {
    try {
        const response = await api.post('/onboarding-offboarding/assets/deliver', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al registrar entrega de activo/EPP');
    }
};

export const returnAsset = async (assetId, data) => {
    try {
        const response = await api.put(`/onboarding-offboarding/assets/return/${assetId}`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al registrar devolución');
    }
};

// --- OFFBOARDING & SIMULADOR FINIQUITO ---
export const simulateSettlement = async (data) => {
    try {
        const response = await api.post('/onboarding-offboarding/offboarding/simulate', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al simular liquidación');
    }
};

export const startOffboarding = async (data) => {
    try {
        const response = await api.post('/onboarding-offboarding/offboarding/start', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al iniciar proceso de salida');
    }
};

export const updateChecklistStep = async (offboardingId, taskId, completed) => {
    try {
        const response = await api.put(`/onboarding-offboarding/offboarding/${offboardingId}/checklist`, { taskId, completed });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al actualizar tarea de salida');
    }
};

export const getOffboardings = async (params = {}) => {
    try {
        const response = await api.get('/onboarding-offboarding/offboarding', { params });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar lista de salidas');
    }
};
