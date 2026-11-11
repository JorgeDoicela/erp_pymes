/**
 * @file asyncHandler.js
 * @description Wrapper de manejo asíncrono para rutas Express (Norma ERP Core Utils).
 * Elimina la necesidad de bloques try-catch repetitivos delegando los errores a next().
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

/**
 * Envoltorio para funciones de middleware/controlador asíncronas
 * @param {Function} fn - Función asíncrona (req, res, next)
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
