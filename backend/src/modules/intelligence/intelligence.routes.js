/**
 * @file intelligence.routes.js
 * @description Norma ERP - Enrutador de Inteligencia Artificial y People Analytics
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import * as intelligenceController from './intelligence.controller.js';
import { ROLES } from '../../config/roles.js';

const router = Router();

router.use(authenticate);
router.use(authorize([ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTING]));

router.get('/dashboard', intelligenceController.getDashboard);
router.get('/retention-risk', intelligenceController.getRetentionRisk);
router.get('/performance-insights', intelligenceController.getPerformanceInsights);
router.get('/attendance-patterns', intelligenceController.getAttendancePatterns);
router.get('/payroll-optimization', intelligenceController.getPayrollOptimization);
router.get('/recruitment-matching/:vacancyId', intelligenceController.getRecruitmentMatching);
router.get('/recommendations', intelligenceController.getRecommendations);
router.get('/departments', intelligenceController.getDepartmentComparison);
router.get('/alerts', intelligenceController.getProactiveAlerts);
router.get('/predictions', intelligenceController.getPredictiveAnalytics);
router.get('/employee-scoring', intelligenceController.getEmployeeScoring);
router.get('/employee-scoring/:employeeId', intelligenceController.getEmployeeScoring);
router.get('/organizational-health', intelligenceController.getOrganizationalHealth);
router.get('/patterns', intelligenceController.getPatternAnalysis);
router.post('/what-if-monte-carlo', intelligenceController.runWhatIfMonteCarlo);
router.get('/what-if-monte-carlo', intelligenceController.runWhatIfMonteCarlo);
router.get('/export-academic', intelligenceController.exportAcademicDataset);

// Motor RSI y Validación Científica
router.get('/rsi/metrics', intelligenceController.getRsiMetrics);
router.post('/rsi/calibrate', intelligenceController.calibrateRsiModel);
router.post('/rsi/simulate', intelligenceController.simulateRsiOutcome);
router.get('/rsi/cross-validation', intelligenceController.getCrossValidationMetrics);
router.get('/rsi/kolmogorov-smirnov', intelligenceController.getKolmogorovSmirnovAnalysis);
router.get('/rsi/multi-seed-sensitivity', intelligenceController.getMultiSeedSensitivity);

// Inferencia Causal Contrafactual
router.post('/causal/simulate', intelligenceController.runCausalSimulation);
router.get('/causal/history', intelligenceController.getCausalHistory);

// Aprendizaje Federado Multi-Tenant (DP-SGD)
router.get('/federated/status', intelligenceController.getFederatedStatus);
router.post('/federated/round', intelligenceController.executeFederatedRound);
router.get('/federated/rounds-history', intelligenceController.getFederatedRoundsHistory);

// Aprendizaje por Refuerzo Multiobjetivo (MORL & Frontera de Pareto)
router.post('/morl/optimize', intelligenceController.runMorlOptimization);
router.get('/morl/history', intelligenceController.getMorlHistory);

// Asesor Estratégico Ejecutivo
router.post('/strategic-advice', intelligenceController.getStrategicAdvice);

// Atención Temporal (Temporal Self-Attention)
router.get('/temporal-attention/summary', intelligenceController.getTemporalAttentionSummary);
router.get(
  '/temporal-attention/:employeeId',
  intelligenceController.getTemporalAttentionByEmployee
);
router.post('/temporal-attention/calibrate', intelligenceController.calibrateTemporalAttention);

// Arquitectura Tabular FT-Transformer
router.get('/ft-transformer/comparison', intelligenceController.getFTTransformerComparison);
router.post('/ft-transformer/train', intelligenceController.trainFTTransformer);
router.get('/ft-transformer/predict/:employeeId', intelligenceController.predictFTTransformer);

// Calidad de Datos
router.get('/data-quality', intelligenceController.getDataQuality);

export default router;

