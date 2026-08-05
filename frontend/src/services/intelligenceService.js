/**
 * Servicio de API para el Agente Inteligente
 * Usa el cliente HTTP centralizado (intelligenceClient) que gestiona
 * automáticamente el token y los errores de autenticación.
 */

import intelligenceClient from '../api/intelligenceClient.js';

/**
 * Obtiene el dashboard completo con todos los insights
 */
export async function getDashboard(refresh = false) {
    const url = refresh ? '/dashboard?refresh=true' : '/dashboard';
    const response = await intelligenceClient.get(url);
    return response.data;
}

/**
 * Obtiene análisis de riesgo de rotación
 */
export async function getRetentionRisk() {
    const response = await intelligenceClient.get('/retention-risk');
    return response.data;
}

/**
 * Obtiene insights de desempeño
 */
export async function getPerformanceInsights() {
    const response = await intelligenceClient.get('/performance-insights');
    return response.data;
}

/**
 * Obtiene patrones de asistencia
 */
export async function getAttendancePatterns() {
    const response = await intelligenceClient.get('/attendance-patterns');
    return response.data;
}

/**
 * Obtiene optimización de nómina
 */
export async function getPayrollOptimization() {
    const response = await intelligenceClient.get('/payroll-optimization');
    return response.data;
}

/**
 * Obtiene matching inteligente para una vacante
 */
export async function getRecruitmentMatching(vacancyId) {
    const response = await intelligenceClient.get(`/recruitment-matching/${vacancyId}`);
    return response.data;
}

/**
 * Obtiene recomendaciones priorizadas
 */
export async function getRecommendations() {
    const response = await intelligenceClient.get('/recommendations');
    return response.data;
}

/**
 * Obtiene comparativa de departamentos
 */
export async function getDepartmentComparison() {
    const response = await intelligenceClient.get('/departments');
    return response.data;
}

/**
 * Obtiene alertas proactivas del sistema
 */
export async function getProactiveAlerts() {
    const response = await intelligenceClient.get('/alerts');
    return response.data;
}

/**
 * Obtiene análisis predictivo
 */
export async function getPredictiveAnalytics() {
    const response = await intelligenceClient.get('/predictions');
    return response.data;
}

/**
 * Obtiene scoring de empleados (todos o uno específico)
 */
export async function getEmployeeScoring(employeeId = null) {
    const url = employeeId ? `/employee-scoring/${employeeId}` : '/employee-scoring';
    const response = await intelligenceClient.get(url);
    return response.data;
}

/**
 * Obtiene índice de salud organizacional
 */
export async function getOrganizationalHealth() {
    const response = await intelligenceClient.get('/organizational-health');
    return response.data;
}

/**
 * Obtiene análisis de patrones y anomalías
 */
export async function getPatternAnalysis() {
    const response = await intelligenceClient.get('/patterns');
    return response.data;
}
