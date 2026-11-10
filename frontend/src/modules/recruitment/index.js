/**
 * @file index.js
 * @description Módulo de Reclutamiento, Vacantes y Postulaciones de Candidatos
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

// Páginas
export { default as RecruitmentDashboard } from './pages/RecruitmentDashboard.jsx';
export { default as CreateJobVacancy } from './pages/CreateJobVacancy.jsx';
export { default as CareersPage } from './pages/CareersPage.jsx';
export { default as JobApplication } from './pages/JobApplication.jsx';
export { default as VacancyDetails } from './pages/VacancyDetails.jsx';
export { default as ApplicationDetails } from './pages/ApplicationDetails.jsx';

// Componentes
export * from './components';

// Servicios
export { default as recruitmentService } from './services/recruitment.service.js';
