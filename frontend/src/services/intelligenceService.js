import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Servicio de API para el Agente Inteligente
 */

/**
 * Obtiene el dashboard completo con todos los insights
 */
export async function getDashboard() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/intelligence/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Obtiene análisis de riesgo de rotación
 */
export async function getRetentionRisk() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/intelligence/retention-risk`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Obtiene insights de desempeño
 */
export async function getPerformanceInsights() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/intelligence/performance-insights`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Obtiene patrones de asistencia
 */
export async function getAttendancePatterns() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/intelligence/attendance-patterns`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Obtiene optimización de nómina
 */
export async function getPayrollOptimization() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/intelligence/payroll-optimization`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Obtiene matching inteligente para una vacante
 */
export async function getRecruitmentMatching(vacancyId) {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/intelligence/recruitment-matching/${vacancyId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Obtiene recomendaciones priorizadas
 */
export async function getRecommendations() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/intelligence/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

/**
 * Obtiene comparativa de departamentos
 */
export async function getDepartmentComparison() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/intelligence/departments`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}
