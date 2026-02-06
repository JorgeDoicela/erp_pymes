import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as intelligenceController from '../controllers/intelligenceController.js';

const router = Router();

/**
 * Rutas de Inteligencia
 * Todas las rutas requieren autenticación y rol de administrador
 */

// Aplicar autenticación y autorización a todas las rutas
router.use(authenticate);
router.use(authorize(['admin']));

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

export default router;
