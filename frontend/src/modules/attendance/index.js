/**
 * @file index.js
 * @description Módulo de Asistencia, Marcaciones Biométricas WebAuthn, Turnos y Ausencias
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

// Páginas
export { default as ShiftManagement } from './pages/ShiftManagement.jsx';
export { default as AttendancePage } from './pages/AttendancePage.jsx';
export { default as AdminAbsences } from './pages/AdminAbsences.jsx';
export { default as EmployeeAttendance } from './pages/EmployeeAttendance.jsx';
export { default as EmployeeAbsences } from './pages/EmployeeAbsences.jsx';

// Componentes
export { default as DigitalMarker } from './components/DigitalMarker.jsx';
export { default as BiometricSettings } from './components/BiometricSettings.jsx';
export * from './components';

// Servicios
export * as attendanceService from './services/attendanceService.js';
export * as absenceService from './services/absenceService.js';
export * as shiftService from './services/shiftService.js';

// Hooks
export * from './hooks/useBiometricAuth.js';
