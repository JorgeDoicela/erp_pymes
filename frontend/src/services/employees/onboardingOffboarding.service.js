import api from '../../api/axios';

// --- EXPEDIENTE DIGITAL ---
export const getAllExpedientsSummary = async () => {
    try {
        const response = await api.get('/onboarding-offboarding/expedients/summary');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar directorio de expedientes');
    }
};

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

export const deleteExpedientDocument = async (documentId) => {
    try {
        const response = await api.delete(`/onboarding-offboarding/expedient/document/${documentId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al eliminar documento');
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

export const getMyAssets = async () => {
    try {
        const response = await api.get('/onboarding-offboarding/assets/my');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar tus activos y equipos en custodia');
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
        throw new Error(error.response?.data?.message || 'Error al registrar devolución de activo');
    }
};

export const updateAsset = async (assetId, data) => {
    try {
        const response = await api.put(`/onboarding-offboarding/assets/${assetId}`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al actualizar información del activo');
    }
};

export const deleteAsset = async (assetId) => {
    try {
        const response = await api.delete(`/onboarding-offboarding/assets/${assetId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al eliminar registro del activo');
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
