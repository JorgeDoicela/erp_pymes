import * as intelligenceService from '../services/intelligenceService.js';

/**
 * Controlador de Inteligencia
 * Maneja los endpoints del agente inteligente de gestión
 */

/**
 * GET /api/intelligence/dashboard
 * Obtiene el dashboard completo con todos los insights
 */
export async function getDashboard(req, res) {
    try {
        const dashboard = await intelligenceService.getIntelligenceDashboard();
        res.json({
            success: true,
            data: dashboard,
        });
    } catch (error) {
        console.error('Error getting intelligence dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el dashboard de inteligencia',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/retention-risk
 * Obtiene análisis de riesgo de rotación
 */
export async function getRetentionRisk(req, res) {
    try {
        const analysis = await intelligenceService.getRetentionRiskAnalysis();
        res.json({
            success: true,
            data: analysis,
        });
    } catch (error) {
        console.error('Error getting retention risk analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener análisis de riesgo de rotación',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/performance-insights
 * Obtiene insights de desempeño
 */
export async function getPerformanceInsights(req, res) {
    try {
        const insights = await intelligenceService.getPerformanceInsights();
        res.json({
            success: true,
            data: insights,
        });
    } catch (error) {
        console.error('Error getting performance insights:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener insights de desempeño',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/attendance-patterns
 * Obtiene patrones de asistencia
 */
export async function getAttendancePatterns(req, res) {
    try {
        const patterns = await intelligenceService.getAttendancePatterns();
        res.json({
            success: true,
            data: patterns,
        });
    } catch (error) {
        console.error('Error getting attendance patterns:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener patrones de asistencia',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/payroll-optimization
 * Obtiene optimización de nómina
 */
export async function getPayrollOptimization(req, res) {
    try {
        const optimization = await intelligenceService.getPayrollOptimization();
        res.json({
            success: true,
            data: optimization,
        });
    } catch (error) {
        console.error('Error getting payroll optimization:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener optimización de nómina',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/recruitment-matching/:vacancyId
 * Obtiene matching inteligente para una vacante
 */
export async function getRecruitmentMatching(req, res) {
    try {
        const { vacancyId } = req.params;
        const matching = await intelligenceService.getRecruitmentMatching(vacancyId);
        res.json({
            success: true,
            data: matching,
        });
    } catch (error) {
        console.error('Error getting recruitment matching:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener matching de candidatos',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/recommendations
 * Obtiene recomendaciones priorizadas
 */
export async function getRecommendations(req, res) {
    try {
        const recommendations = await intelligenceService.getRecommendations();
        res.json({
            success: true,
            data: recommendations,
        });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recomendaciones',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/departments
 * Obtiene comparativa de departamentos
 */
export async function getDepartmentComparison(req, res) {
    try {
        const comparison = await intelligenceService.getDepartmentComparison();
        res.json({
            success: true,
            data: comparison,
        });
    } catch (error) {
        console.error('Error getting department comparison:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener comparativa de departamentos',
            error: error.message,
        });
    }
}
