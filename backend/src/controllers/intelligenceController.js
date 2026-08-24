import * as intelligenceService from '../services/intelligenceService.js';
import rsiService from '../services/ai/rsiService.js';
import causalInferenceService from '../services/ai/causalInferenceService.js';
import federatedLearningService from '../services/ai/federatedLearningService.js';
import morlOptimizationService from '../services/ai/morlOptimizationService.js';

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
        const tenantId = req.tenantId || req.user?.tenantId;
        const dashboard = await intelligenceService.getIntelligenceDashboard(tenantId, forceRefresh);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const analysis = await intelligenceService.getRetentionRiskAnalysis(tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const insights = await intelligenceService.getPerformanceInsights(tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const patterns = await intelligenceService.getAttendancePatterns(tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const optimization = await intelligenceService.getPayrollOptimization(tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const matching = await intelligenceService.getRecruitmentMatching(vacancyId, tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const recommendations = await intelligenceService.getRecommendations(tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const comparison = await intelligenceService.getDepartmentComparison(tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const alerts = await intelligenceService.getProactiveAlerts(tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const predictions = await intelligenceService.getPredictiveAnalytics(tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const scoring = await intelligenceService.getEmployeeScoring(employeeId || null, tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const health = await intelligenceService.getOrganizationalHealth(tenantId);
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const patterns = await intelligenceService.getPatternAnalysis(tenantId);
        res.json({
            success: true,
            data: patterns,
        });
    } catch (error) {
        return handleError(res, error, 'Error al obtener análisis de patrones');
    }
}

/**
 * POST /api/intelligence/what-if-monte-carlo
 * GET /api/intelligence/what-if-monte-carlo
 * Ejecuta simulación Monte Carlo estocástica para escenarios What-If
 */
export async function runWhatIfMonteCarlo(req, res) {
    try {
        const params = req.method === 'POST' ? req.body : req.query;
        const tenantId = req.tenantId || req.user?.tenantId;
        const simulation = await intelligenceService.runWhatIfMonteCarlo({
            salaryIncreasePercent: Number(params.salaryIncreasePercent || 5),
            wellnessInvestment: Number(params.wellnessInvestment || 150),
            overtimeOptimization: Number(params.overtimeOptimization || 20),
            iterations: Number(params.iterations || 2000),
        }, tenantId);
        res.json({
            success: true,
            data: simulation,
        });
    } catch (error) {
        return handleError(res, error, 'Error al ejecutar simulación Monte Carlo');
    }
}

/**
 * GET /api/intelligence/export-academic
 * Exporta el dataset anonimizado apto para R / Python / SPSS (CSV o JSON)
 */
export async function exportAcademicDataset(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const format = (req.query.format || 'csv').toLowerCase();

        const result = await intelligenceService.generateAcademicDataset(tenantId, format);

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="hr_academic_dataset.json"');
            return res.json(result);
        } else {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="hr_academic_dataset.csv"');
            return res.send(result);
        }
    } catch (error) {
        return handleError(res, error, 'Error al exportar dataset académico');
    }
}

/**
 * GET /api/intelligence/rsi/metrics
 * Obtiene el estado, las épocas y el historial de automejora RSI
 */
export async function getRsiMetrics(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
        const metrics = await rsiService.getRsiMetrics(tenantId);
        return res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        return handleError(res, error, 'Error al obtener métricas del motor RSI');
    }
}

/**
 * POST /api/intelligence/rsi/calibrate
 * Dispara una época de calibración del motor RSI
 */
export async function calibrateRsiModel(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
        const calibration = await rsiService.runRecursiveCalibration(tenantId, 'MANUAL_TRIGGER');
        return res.json({
            success: true,
            message: 'Motor RSI calibrado exitosamente',
            data: calibration
        });
    } catch (error) {
        return handleError(res, error, 'Error al ejecutar calibración RSI');
    }
}

/**
 * POST /api/intelligence/rsi/simulate
 * Simula la resolución de un desenlace de empleado (Permanencia / Renuncia)
 */
export async function simulateRsiOutcome(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
        const { employeeId, actualOutcome } = req.body;
        const outcomeVal = actualOutcome !== undefined ? Number(actualOutcome) : 1;
        const result = await rsiService.simulateOutcomeEvent(tenantId, employeeId, outcomeVal);
        return res.json({
            success: true,
            message: 'Simulación de desenlace procesada con automejora RSI',
            data: result
        });
    } catch (error) {
        return handleError(res, error, 'Error al procesar simulación RSI');
    }
}

/**
 * POST /api/intelligence/causal/simulate
 * Ejecuta una simulación de intervención contrafactual do(T) mediante PSM e IPW
 */
export async function runCausalSimulation(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
        const { treatmentType, treatmentValue, targetDepartment, minTenureMonths, customTitle } = req.body;

        const simulation = await causalInferenceService.runCausalInterventionSimulation({
            tenantId,
            treatmentType: treatmentType || 'SALARY_INCREASE',
            treatmentValue: treatmentValue !== undefined ? Number(treatmentValue) : 10,
            targetDepartment: targetDepartment || 'ALL',
            minTenureMonths: minTenureMonths !== undefined ? Number(minTenureMonths) : 0,
            customTitle
        });

        return res.json({
            success: true,
            message: 'Simulación de Inferencia Causal procesada exitosamente',
            data: simulation
        });
    } catch (error) {
        return handleError(res, error, 'Error al ejecutar simulación de inferencia causal');
    }
}

/**
 * GET /api/intelligence/causal/history
 * Obtiene el historial de intervenciones causales simuladas para el tenant
 */
export async function getCausalHistory(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
        const history = await causalInferenceService.getInterventionHistory(tenantId);
        return res.json({
            success: true,
            data: history
        });
    } catch (error) {
        return handleError(res, error, 'Error al obtener historial de inferencia causal');
    }
}

/**
 * GET /api/intelligence/federated/status
 * Obtiene el presupuesto de privacidad DP (epsilon) y estado del tenant
 */
export async function getFederatedStatus(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
        const status = await federatedLearningService.getTenantPrivacyStatus(tenantId);
        return res.json({
            success: true,
            data: status
        });
    } catch (error) {
        return handleError(res, error, 'Error al obtener estado de privacidad federada');
    }
}

/**
 * POST /api/intelligence/federated/round
 * Dispara una ronda global de entrenamiento federado (FedAvg + DP-SGD)
 */
export async function executeFederatedRound(req, res) {
    try {
        const { participatingTenantIds } = req.body || {};
        const roundResult = await federatedLearningService.executeFederatedRound(participatingTenantIds);
        return res.json({
            success: true,
            message: 'Ronda de Aprendizaje Federado procesada exitosamente',
            data: roundResult
        });
    } catch (error) {
        return handleError(res, error, 'Error al ejecutar ronda de entrenamiento federado');
    }
}

/**
 * GET /api/intelligence/federated/rounds-history
 * Obtiene el historial de rondas federadas globales y evolución del meta-modelo
 */
export async function getFederatedRoundsHistory(req, res) {
    try {
        const history = await federatedLearningService.getRoundsHistory();
        return res.json({
            success: true,
            data: history
        });
    } catch (error) {
        return handleError(res, error, 'Error al obtener historial de rondas federadas');
    }
}

/**
 * POST /api/intelligence/morl/optimize
 * Ejecuta una optimización multiobjetivo Q-Learning con Frontera de Pareto
 */
export async function runMorlOptimization(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
        const { budgetLimit, targetDepartment, customTitle } = req.body || {};

        const result = await morlOptimizationService.runMorlParetoOptimization({
            tenantId,
            budgetLimit: budgetLimit !== undefined ? Number(budgetLimit) : 15000,
            targetDepartment: targetDepartment || 'ALL',
            customTitle
        });

        return res.json({
            success: true,
            message: 'Optimización Multiobjetivo MORL calculada exitosamente',
            data: result
        });
    } catch (error) {
        return handleError(res, error, 'Error al ejecutar optimización multiobjetivo MORL');
    }
}

/**
 * GET /api/intelligence/morl/history
 * Obtiene el historial de corridas de optimización MORL
 */
export async function getMorlHistory(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
        const history = await morlOptimizationService.getMorlHistory(tenantId);
        return res.json({
            success: true,
            data: history
        });
    } catch (error) {
        return handleError(res, error, 'Error al obtener historial de optimización MORL');
    }
}

/**
 * GET /api/intelligence/rsi/cross-validation
 * Evalúa baseline vs modelo Weibull + RSI fuera de muestra mediante K-Fold Cross-Validation
 */
export async function getCrossValidationMetrics(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const dashboard = await intelligenceService.getIntelligenceDashboard(tenantId);
        const rawEmployees = dashboard.retention?.analysis || [];
        const cvResult = intelligenceService.evaluateBaselineVsAdvancedModel(rawEmployees);
        return res.json({
            success: true,
            data: cvResult
        });
    } catch (error) {
        return handleError(res, error, 'Error al calcular validación cruzada');
    }
}

/**
 * GET /api/intelligence/rsi/kolmogorov-smirnov
 * Ejecuta prueba de bondad de ajuste Kolmogorov-Smirnov con Bootstrap paramétrico
 */
export async function getKolmogorovSmirnovAnalysis(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const dashboard = await intelligenceService.getIntelligenceDashboard(tenantId);
        const analysis = dashboard.retention?.analysis || [];
        const tenures = analysis.map(emp => {
            const hire = emp.hireDate ? new Date(emp.hireDate) : new Date();
            return Math.max(1, (new Date() - hire) / (1000 * 60 * 60 * 24 * 30.4375));
        });
        const ksResult = intelligenceService.calculateKolmogorovSmirnovTest(tenures);
        return res.json({
            success: true,
            data: ksResult
        });
    } catch (error) {
        return handleError(res, error, 'Error al ejecutar prueba Kolmogorov-Smirnov');
    }
}

/**
 * GET /api/intelligence/rsi/multi-seed-sensitivity
 * Ejecuta simulación Monte Carlo con 5 semillas estocásticas para sensibilidad multi-semilla
 */
export async function getMultiSeedSensitivity(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const result = await intelligenceService.runMultiSeedMonteCarloSensitivity(
            [42, 100, 500, 1000, 2026],
            2000,
            tenantId
        );
        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return handleError(res, error, 'Error al calcular sensibilidad multi-semilla Monte Carlo');
    }
}

/**
 * POST /api/intelligence/strategic-advice
 * Genera asesoría estratégica ejecutiva con datos reales del tenant
 */
export async function getStrategicAdvice(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const { queryType, customPrompt } = req.body || {};
        const advice = await intelligenceService.generateStrategicAdvisorAdvice(tenantId, queryType, customPrompt);
        return res.json({
            success: true,
            data: advice
        });
    } catch (error) {
        return handleError(res, error, 'Error al generar asesoría estratégica');
    }
}

// ==================== CONTROLADORES TEMPORAL ATTENTION (VASWANI 2017) ====================

/**
 * GET /api/intelligence/temporal-attention/summary
 * Obtiene el resumen corporativo de atención temporal sobre secuencias de 12 meses
 */
export async function getTemporalAttentionSummary(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const summary = await intelligenceService.getTemporalAttentionSummary(tenantId);
        return res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        return handleError(res, error, 'Error al calcular atención temporal corporativa');
    }
}

/**
 * GET /api/intelligence/temporal-attention/:employeeId
 * Obtiene el mapa de atención temporal de 12 meses para un colaborador individual
 */
export async function getTemporalAttentionByEmployee(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const { employeeId } = req.params;
        const result = await intelligenceService.getTemporalAttentionByEmployee(employeeId, tenantId);
        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return handleError(res, error, 'Error al calcular atención temporal del colaborador');
    }
}

/**
 * POST /api/intelligence/temporal-attention/calibrate
 * Ejecuta una calibración manual de las matrices de proyección Q/K/V
 */
export async function calibrateTemporalAttention(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const result = await intelligenceService.calibrateTemporalAttention(tenantId);
        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return handleError(res, error, 'Error al calibrar matrices de proyección de atención');
    }
}

// ==================== CONTROLADORES FT-TRANSFORMER (GORISHNIY 2021) ====================

/**
 * GET /api/intelligence/ft-transformer/comparison
 * Comparativa 5-Fold Cross Validation: FT-Transformer vs Weibull vs Heurístico
 */
export async function getFTTransformerComparison(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const comparison = await intelligenceService.getFTTransformerComparison(tenantId);
        return res.json({
            success: true,
            data: comparison
        });
    } catch (error) {
        return handleError(res, error, 'Error al evaluar comparativa FT-Transformer');
    }
}

/**
 * POST /api/intelligence/ft-transformer/train
 * Ejecuta un ciclo de entrenamiento y calibración de pesos FT-Transformer
 */
export async function trainFTTransformer(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const result = await intelligenceService.trainFTTransformerModel(tenantId);
        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return handleError(res, error, 'Error al entrenar modelo FT-Transformer');
    }
}

/**
 * GET /api/intelligence/ft-transformer/predict/:employeeId
 * Forward Pass del FT-Transformer con Feature Tokenizer y Token Interaction Map
 */
export async function predictFTTransformer(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const { employeeId } = req.params;
        const prediction = await intelligenceService.getFTTransformerPrediction(employeeId, tenantId);
        return res.json({
            success: true,
            data: prediction
        });
    } catch (error) {
        return handleError(res, error, 'Error al predecir con FT-Transformer');
    }
}
/**
 * GET /api/intelligence/data-quality
 * Reporte de completitud de datos de la empresa.
 * Indica qué empleados carecen de evaluaciones, asistencia o salario,
 * y el % de datos disponibles para el motor de IA.
 */
export async function getDataQuality(req, res) {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const report = await intelligenceService.getDataQualityReport(tenantId);
        return res.json({
            success: true,
            data: report
        });
    } catch (error) {
        return handleError(res, error, 'Error al obtener reporte de calidad de datos');
    }
}
