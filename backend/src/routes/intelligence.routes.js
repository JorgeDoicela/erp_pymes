import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as intelligenceController from '../controllers/intelligenceController.js';
import { ROLES } from '../config/roles.js';

const router = Router();

/**
 * Rutas de Inteligencia
 * Todas las rutas requieren autenticación y rol de administrador, RRHH o Contabilidad
 */

// Aplicar autenticación y autorización a todas las rutas
router.use(authenticate);
router.use(authorize([ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTING]));

// Dashboard principal con todos los insights
router.get('/dashboard', intelligenceController.getDashboard);

// Análisis de riesgo de rotación
router.get('/retention-risk', intelligenceController.getRetentionRisk);

// Insights de desempeño
router.get('/performance-insights', intelligenceController.getPerformanceInsights);

// Patrones de asistencia
router.get('/attendance-patterns', intelligenceController.getAttendancePatterns);

// Optimización de nómina
router.get('/payroll-optimization', intelligenceController.getPayrollOptimization);

// Matching inteligente de reclutamiento
router.get('/recruitment-matching/:vacancyId', intelligenceController.getRecruitmentMatching);

// Recomendaciones priorizadas
router.get('/recommendations', intelligenceController.getRecommendations);

// Comparativa de departamentos
router.get('/departments', intelligenceController.getDepartmentComparison);

// Alertas proactivas
router.get('/alerts', intelligenceController.getProactiveAlerts);

// Análisis predictivo
router.get('/predictions', intelligenceController.getPredictiveAnalytics);

// Scoring de empleados
router.get('/employee-scoring', intelligenceController.getEmployeeScoring);
router.get('/employee-scoring/:employeeId', intelligenceController.getEmployeeScoring);

// Salud organizacional
router.get('/organizational-health', intelligenceController.getOrganizationalHealth);

// Análisis de patrones
router.get('/patterns', intelligenceController.getPatternAnalysis);

// Simulación Monte Carlo What-If
router.post('/what-if-monte-carlo', intelligenceController.runWhatIfMonteCarlo);
router.get('/what-if-monte-carlo', intelligenceController.runWhatIfMonteCarlo);

// Exportación de Dataset Académico Anonimizado (CSV / JSON)
router.get('/export-academic', intelligenceController.exportAcademicDataset);

// Motor de Automejora Recursiva (RSI Engine) y Validación Científica
router.get('/rsi/metrics', intelligenceController.getRsiMetrics);
router.post('/rsi/calibrate', intelligenceController.calibrateRsiModel);
router.post('/rsi/simulate', intelligenceController.simulateRsiOutcome);
router.get('/rsi/cross-validation', intelligenceController.getCrossValidationMetrics);
router.get('/rsi/kolmogorov-smirnov', intelligenceController.getKolmogorovSmirnovAnalysis);
router.get('/rsi/multi-seed-sensitivity', intelligenceController.getMultiSeedSensitivity);

// Motor de Inferencia Causal Contrafactual (Causal AI)
router.post('/causal/simulate', intelligenceController.runCausalSimulation);
router.get('/causal/history', intelligenceController.getCausalHistory);

// Motor de Aprendizaje Federado Multi-Tenant (DP-SGD)
router.get('/federated/status', intelligenceController.getFederatedStatus);
router.post('/federated/round', intelligenceController.executeFederatedRound);
router.get('/federated/rounds-history', intelligenceController.getFederatedRoundsHistory);

// Motor de Aprendizaje por Refuerzo Multiobjetivo (MORL & Frontera de Pareto)
router.post('/morl/optimize', intelligenceController.runMorlOptimization);
router.get('/morl/history', intelligenceController.getMorlHistory);

// Asesor Estratégico Ejecutivo
router.post('/strategic-advice', intelligenceController.getStrategicAdvice);

// Arquitectura de Atención Temporal (Temporal Self-Attention - Vaswani et al. 2017)
router.get('/temporal-attention/summary', intelligenceController.getTemporalAttentionSummary);
router.get('/temporal-attention/:employeeId', intelligenceController.getTemporalAttentionByEmployee);
router.post('/temporal-attention/calibrate', intelligenceController.calibrateTemporalAttention);

// Arquitectura Tabular FT-Transformer (Gorishniy et al. NeurIPS 2021)
router.get('/ft-transformer/comparison', intelligenceController.getFTTransformerComparison);
router.post('/ft-transformer/train', intelligenceController.trainFTTransformer);
router.get('/ft-transformer/predict/:employeeId', intelligenceController.predictFTTransformer);

// Calidad de Datos por Empresa — Completitud para el motor de IA
router.get('/data-quality', intelligenceController.getDataQuality);

export default router;
