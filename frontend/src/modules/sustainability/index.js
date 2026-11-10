/**
 * @file index.js
 * @description Registro público del Bounded Context de Sostenibilidad ODS 8 en el Frontend
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export { default as SustainabilityDashboard } from './pages/SustainabilityDashboard.jsx';
export { default as SustainabilityAIAdvisor } from './components/SustainabilityAIAdvisor.jsx';
export { default as SustainabilityKPIGrid } from './components/SustainabilityKPIGrid.jsx';
export { default as SustainabilityKPICard } from './components/SustainabilityKPICard.jsx';
export { default as LegalCitationDrawer } from './components/LegalCitationDrawer.jsx';
export { default as FineTuningExportModal } from './components/FineTuningExportModal.jsx';
export * from './services/sustainability.service.js';
export * from './hooks/useSustainabilityMetrics.js';
export * from './hooks/useSustainabilityAdvisor.js';
