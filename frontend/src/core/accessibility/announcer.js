/**
 * @file announcer.js
 * @description Utilidad global para anunciar mensajes al lector de pantalla nativo (TalkBack/VoiceOver).
 * Emite eventos desacoplados sin modificar el DOM directamente ni interferir con la lógica de negocio.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export const announceToScreenReader = (message, priority = 'polite') => {
  if (typeof window === 'undefined' || !message) return;
  const cleaned = String(message).replace(/\s+/g, ' ').trim();
  if (!cleaned) return;

  try {
    window.dispatchEvent(
      new CustomEvent('norma:announce', {
        detail: {
          message: cleaned,
          priority: priority === 'assertive' ? 'assertive' : 'polite',
          timestamp: Date.now(),
        },
      })
    );
  } catch {
    // Modo defensivo sin bloquear la aplicación
  }
};

export default announceToScreenReader;
