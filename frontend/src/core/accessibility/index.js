/**
 * @file index.js
 * @description Punto de entrada público del módulo de accesibilidad y voz de Norma ERP
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export { AccessibilityProvider, useAccessibility } from './AccessibilityContext.jsx';
export { default as AccessibilityFloatingPlayer } from './AccessibilityFloatingPlayer.jsx';
export { default as AccessibilitySettingsCard } from './AccessibilitySettingsCard.jsx';
export { default as ScreenReaderAnnouncer } from './ScreenReaderAnnouncer.jsx';
export { announceToScreenReader } from './announcer.js';
