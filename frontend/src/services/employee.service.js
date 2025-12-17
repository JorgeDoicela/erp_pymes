const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const createEmployee = async (employeeData, token) => {
    const response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(employeeData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear empleado');
    }

    return await response.json();
};

export const getEmployees = async (token, searchTerm = '') => {
    let url = `${API_URL}/employees`;
    if (searchTerm) {
        url += `?q=${encodeURIComponent(searchTerm)}`;
    }

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al obtener empleados');
    }

    return await response.json();
};

export const getEmployeeById = async (id, token) => {
    const response = await fetch(`${API_URL}/employees/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al obtener empleado');
    }

    return await response.json();
};

export const updateEmployee = async (id, employeeData, token) => {
    const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(employeeData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar empleado');
    }

    return await response.json();
};

export const getEmployeeHistory = async (id, token) => {
    const response = await fetch(`${API_URL}/employees/${id}/history`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al obtener historial');
    }

    return await response.json();
    return await response.json();
};

export const createContract = async (formData, token) => {
    const response = await fetch(`${API_URL}/contracts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear contrato');
    }

    return await response.json();
};

export const getContracts = async (employeeId, token) => {
    const response = await fetch(`${API_URL}/contracts/employee/${employeeId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al obtener contratos');
    }

    return await response.json();
    return await response.json();
};

export const uploadDocument = async (formData, token) => {
    const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir documento');
    }

    return await response.json();
};

export const getDocuments = async (employeeId, token) => {
    const response = await fetch(`${API_URL}/documents/employee/${employeeId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al obtener documentos');
    }

    return await response.json();
};

export const deleteDocument = async (id, token) => {
    const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Error al eliminar documento');
    }

    return await response.json();
};
