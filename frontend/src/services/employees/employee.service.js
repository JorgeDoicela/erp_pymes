import api from '../../api/axios';

export const createEmployee = async (employeeData, token) => {
    // If using the interceptor to get token from storage, we might not need to pass it.
    // However, to keep compatibility with existing calls that pass token:
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    try {
        const response = await api.post('/employees', employeeData, config);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al crear empleado');
    }
};

export const getEmployees = async (token, searchTerm = '') => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    let url = '/employees?limit=1000'; // Increase limit to fetch all for lists
    if (searchTerm) {
        url += `&q=${encodeURIComponent(searchTerm)}`;
    }

    try {
        const response = await api.get(url, config);
        return response.data;
    } catch (error) {
        throw new Error('Error al obtener empleados');
    }
};

export const getEmployeeById = async (id, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.get(`/employees/${id}`, config);
        return response.data;
    } catch (error) {
        throw new Error('Error al obtener empleado');
    }
};

export const updateEmployee = async (id, employeeData, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.put(`/employees/${id}`, employeeData, config);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al actualizar empleado');
    }
};

export const getEmployeeHistory = async (id, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.get(`/employees/${id}/history`, config);
        return response.data;
    } catch (error) {
        throw new Error('Error al obtener historial');
    }
};

export const createContract = async (formData, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.post('/contracts', formData, config);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al crear contrato');
    }
};

export const getContracts = async (employeeId, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.get(`/contracts/employee/${employeeId}`, config);
        return response.data;
    } catch (error) {
        throw new Error('Error al obtener contratos');
    }
};

export const uploadDocument = async (formData, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    // Axios sets Content-Type to multipart/form-data automatically when body is FormData
    try {
        const response = await api.post('/documents', formData, config);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al subir documento');
    }
};

export const getDocuments = async (employeeId, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.get(`/documents/employee/${employeeId}`, config);
        return response.data;
    } catch (error) {
        throw new Error('Error al obtener documentos');
    }
};

export const deleteDocument = async (id, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.delete(`/documents/${id}`, config);
        return response.data;
    } catch (error) {
        throw new Error('Error al eliminar documento');
    }
};

export const getProfile = async (token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.get('/employees/profile', config);
        return response.data;
    } catch (error) {
        throw new Error('Error al obtener perfil');
    }
};

export const createSkill = async (skillData, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.post('/skills', skillData, config);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al agregar habilidad');
    }
};

export const deleteSkill = async (id, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.delete(`/skills/${id}`, config);
        return response.data;
    } catch (error) {
        throw new Error('Error al eliminar habilidad');
    }
};

// RNF-UI: Termination
export const terminateEmployee = async (id, exitData, token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await api.post(`/employees/${id}/terminate`, exitData, config);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al dar de baja empleado');
    }
};
