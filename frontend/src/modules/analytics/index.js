/**
 * @file index.js
 * @description Módulo de Inteligencia Predictiva, Analítica Avanzada y Optimización (AIG/AI)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

// Páginas
export { default as AnalyticsDashboard } from './pages/AnalyticsDashboard.jsx';
export { default as RsiOptimizationDashboard } from './pages/RsiOptimizationDashboard.jsx';
export { default as CausalInferenceDashboard } from './pages/CausalInferenceDashboard.jsx';
export { default as FederatedLearningDashboard } from './pages/FederatedLearningDashboard.jsx';
export { default as MorlParetoDashboard } from './pages/MorlParetoDashboard.jsx';
export { default as TemporalAttentionDashboard } from './pages/TemporalAttentionDashboard.jsx';
export { default as FTTransformerDashboard } from './pages/FTTransformerDashboard.jsx';
export { default as IntelligentDashboard } from './pages/IntelligentDashboard.jsx';

// Componentes
export { default as AdvancedBusinessAnalytics } from './components/AdvancedBusinessAnalytics.jsx';
export { default as AlertsPanel } from './components/AlertsPanel.jsx';
export { default as DepartmentComparison } from './components/DepartmentComparison.jsx';
export { default as EmployeeScoreCard } from './components/EmployeeScoreCard.jsx';
export { default as ExecutiveKPIBanner } from './components/ExecutiveKPIBanner.jsx';
export { default as ExecutiveReportModal } from './components/ExecutiveReportModal.jsx';
export { default as HealthMeter } from './components/HealthMeter.jsx';
export { default as IntelligentInsightCard } from './components/IntelligentInsightCard.jsx';
export { default as MethodologyModal } from './components/MethodologyModal.jsx';
export { default as PredictiveTrendChart } from './components/PredictiveTrendChart.jsx';
export { default as RecommendationsList } from './components/RecommendationsList.jsx';
export { default as RiskScoreIndicator } from './components/RiskScoreIndicator.jsx';
export { default as StrategicAIAdvisor } from './components/StrategicAIAdvisor.jsx';
export { default as WhatIfScenarioSimulator } from './components/WhatIfScenarioSimulator.jsx';
export { default as AnalyticsMethodologyModal } from './components/AnalyticsMethodologyModal.jsx';

// Servicios y API
export * as analyticsService from './services/analytics.service.js';
export * as intelligenceService from './services/intelligenceService.js';
export { default as intelligenceClient } from './api/intelligenceClient.js';

// Hooks
export * from './hooks/useAIG.js';
