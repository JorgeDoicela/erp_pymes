/**
 * @file index.js
 * @description Módulo de Evaluación del Desempeño 360°, Metas y Objetivos
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

// Páginas
export { default as EvaluationDashboard } from './pages/EvaluationDashboard.jsx';
export { default as CreateEvaluation } from './pages/CreateEvaluation.jsx';
export { default as AssignEvaluation } from './pages/AssignEvaluation.jsx';
export { default as MyEvaluations } from './pages/MyEvaluations.jsx';
export { default as TakeEvaluation } from './pages/TakeEvaluation.jsx';
export { default as EvaluationResults } from './pages/EvaluationResults.jsx';
export { default as MyGoals } from './pages/MyGoals.jsx';

// Componentes
export { default as EvaluationDetailModal } from './components/EvaluationDetailModal.jsx';

// Servicios
export { default as evaluationService } from './services/evaluation.service.js';
export * from './services/evaluation.service.js';
export { default as goalsService } from './services/goals.service.js';
export * from './services/goals.service.js';
