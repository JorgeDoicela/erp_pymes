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

/**
 * GET /api/intelligence/alerts
 * Obtiene alertas proactivas del sistema
 */
export async function getProactiveAlerts(req, res) {
    try {
        const alerts = await intelligenceService.getProactiveAlerts();
        res.json({
            success: true,
            data: alerts,
        });
    } catch (error) {
        console.error('Error getting proactive alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener alertas proactivas',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/predictions
 * Obtiene análisis predictivo
 */
export async function getPredictiveAnalytics(req, res) {
    try {
        const predictions = await intelligenceService.getPredictiveAnalytics();
        res.json({
            success: true,
            data: predictions,
        });
    } catch (error) {
        console.error('Error getting predictive analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener análisis predictivo',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/employee-scoring
 * GET /api/intelligence/employee-scoring/:employeeId
 * Obtiene scoring de empleados
 */
export async function getEmployeeScoring(req, res) {
    try {
        const { employeeId } = req.params;
        const scoring = await intelligenceService.getEmployeeScoring(employeeId || null);
        res.json({
            success: true,
            data: scoring,
        });
    } catch (error) {
        console.error('Error getting employee scoring:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener scoring de empleados',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/organizational-health
 * Obtiene índice de salud organizacional
 */
export async function getOrganizationalHealth(req, res) {
    try {
        const health = await intelligenceService.getOrganizationalHealth();
        res.json({
            success: true,
            data: health,
        });
    } catch (error) {
        console.error('Error getting organizational health:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener salud organizacional',
            error: error.message,
        });
    }
}

/**
 * GET /api/intelligence/patterns
 * Obtiene análisis de patrones y anomalías
 */
export async function getPatternAnalysis(req, res) {
    try {
        const patterns = await intelligenceService.getPatternAnalysis();
        res.json({
            success: true,
            data: patterns,
        });
    } catch (error) {
        console.error('Error getting pattern analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener análisis de patrones',
            error: error.message,
        });
    }
}
