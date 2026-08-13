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

/**
 * Ejecuta simulación Monte Carlo estocástica para escenarios What-If
 */
export async function runWhatIfMonteCarlo(params) {
    const response = await intelligenceClient.post('/what-if-monte-carlo', params);
    return response.data;
}

/**
 * Exporta el dataset académico anonimizado en CSV o JSON y activa la descarga directa
 */
export async function exportAcademicDataset(format = 'csv') {
    const response = await intelligenceClient.get(`/export-academic?format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
    });

    if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `hr_academic_dataset_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } else {
        const jsonStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `hr_academic_dataset_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
    return true;
}

/**
 * Obtiene métricas e historial de automejora del motor RSI
 */
export async function getRsiMetrics() {
    const response = await intelligenceClient.get('/rsi/metrics');
    return response.data;
}

/**
 * Dispara una calibración manual del motor RSI
 */
export async function calibrateRsiModel() {
    const response = await intelligenceClient.post('/rsi/calibrate');
    return response.data;
}

/**
 * Simula la resolución de un desenlace de empleado (Permanencia / Renuncia)
 */
export async function simulateRsiOutcome(data) {
    const response = await intelligenceClient.post('/rsi/simulate', data);
    return response.data;
}

/**
 * Ejecuta una simulación de intervención contrafactual (Causal AI)
 */
export async function runCausalSimulation(data) {
    const response = await intelligenceClient.post('/causal/simulate', data);
    return response.data;
}

/**
 * Obtiene el historial de intervenciones causales simuladas
 */
export async function getCausalHistory() {
    const response = await intelligenceClient.get('/causal/history');
    return response.data;
}

/**
 * Ejecuta una optimización multiobjetivo por refuerzo MORL (Frontera de Pareto)
 */
export async function runMorlOptimization(data) {
    const response = await intelligenceClient.post('/morl/optimize', data);
    return response.data;
}

/**
 * Obtiene el historial de optimizaciones MORL Pareto
 */
export async function getMorlHistory() {
    const response = await intelligenceClient.get('/morl/history');
    return response.data;
}




