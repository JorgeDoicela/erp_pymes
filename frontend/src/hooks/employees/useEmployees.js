import { useState, useEffect, useCallback } from 'react';
import { getEmployees, createEmployee } from '../../services/employees/employee.service';

export const useEmployees = (token) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch employees logic
    const fetchEmployees = useCallback(async (searchTerm = '') => {
        setLoading(true);
        setError('');
        try {
            const data = await getEmployees(token, searchTerm);
            setEmployees(data.data || []);
        } catch (err) {
            setError(err.message || 'Error al cargar empleados');
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Register employee logic
    const registerEmployee = async (employeeData) => {
        setLoading(true);
        setError('');
        try {
            const result = await createEmployee(employeeData, token);
            return result;
        } catch (err) {
            setError(err.message || 'Error al registrar empleado');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        employees,
        loading,
        error,
        fetchEmployees,
        registerEmployee
    };
};
