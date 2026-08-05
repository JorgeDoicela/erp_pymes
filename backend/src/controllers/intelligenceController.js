import * as intelligenceService from '../services/intelligenceService.js';

/**
 * Controlador de Inteligencia
 * Maneja los endpoints del agente inteligente de gestión
 */

/**
 * Helper centralizado de respuesta de error
 * Clasifica los errores por tipo para retornar el HTTP status correcto
 */
function handleError(res, error, defaultMessage) {
    console.error(`[Intelligence] ${defaultMessage}:`, error.message);

    // Errores de negocio conocidos — no son fallos del servidor
    if (error.message?.includes('no encontrada') || error.message?.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message?.includes('no autorizado') || error.message?.includes('unauthorized')) {
        return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message?.includes('inválido') || error.message?.includes('invalid')) {
        return res.status(400).json({ success: false, message: error.message });
    }

    // Error interno genuino
    return res.status(500).json({
        success: false,
        message: defaultMessage,
        // Solo exponer detalles del error en desarrollo
        ...(process.env.NODE_ENV !== 'production' && { detail: error.message }),
    });
}

/**
 * GET /api/intelligence/dashboard
 * Obtiene el dashboard completo con todos los insights
 */
export async function getDashboard(req, res) {
    try {
        const forceRefresh = req.query.refresh === 'true';
        const dashboard = await intelligenceService.getIntelligenceDashboard(forceRefresh);
        res.json({
            success: true,
            data: dashboard,
        });
    } catch (error) {
        return handleError(res, error, 'Error al obtener el dashboard de inteligencia');
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
        return handleError(res, error, 'Error al obtener análisis de riesgo de rotación');
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
        return handleError(res, error, 'Error al obtener insights de desempeño');
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
        return handleError(res, error, 'Error al obtener patrones de asistencia');
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
        return handleError(res, error, 'Error al obtener optimización de nómina');
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
        return handleError(res, error, 'Error al obtener matching de candidatos');
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
        return handleError(res, error, 'Error al obtener recomendaciones');
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
        return handleError(res, error, 'Error al obtener comparativa de departamentos');
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
        return handleError(res, error, 'Error al obtener alertas proactivas');
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
        return handleError(res, error, 'Error al obtener análisis predictivo');
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
        return handleError(res, error, 'Error al obtener scoring de empleados');
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
        return handleError(res, error, 'Error al obtener salud organizacional');
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
        return handleError(res, error, 'Error al obtener análisis de patrones');
    }
}
