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
