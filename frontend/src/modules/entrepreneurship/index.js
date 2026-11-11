/**
 * @file index.js
 * @description Módulo de Emprendimiento, Incubadora y Gestión de Proyectos
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export { default as EntrepreneurshipDashboard } from './pages/Dashboard.jsx';
export { default as EntrepreneurshipForm } from './pages/ProjectForm.jsx';
export { default as EntrepreneurshipDetails } from './pages/ProjectDetails.jsx';
export { default as AnalyticsView } from './pages/AnalyticsView.jsx';
export { default as CapTableManager } from './pages/CapTableManager.jsx';
export { default as DiscoveryLog } from './pages/DiscoveryLog.jsx';
export { default as GrowthMetrics } from './pages/GrowthMetrics.jsx';
export { default as KanbanRoadmap } from './pages/KanbanRoadmap.jsx';
export { default as PitchOptimizer } from './pages/PitchOptimizer.jsx';

export { default as entrepreneurshipService } from './services/entrepreneurship.service.js';
export * from './services/entrepreneurship.service.js';
