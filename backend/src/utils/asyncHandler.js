/**
 * @file asyncHandler.js
 * @description Utilidad de orden superior para envolver middlewares y controladores asíncronos en Express.
 * Elimina la necesidad de bloques try/catch repetitivos delegando los rechazos directamente al middleware global de errores.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

/**
 * Envoltorio para controladores y middlewares asíncronos de Express.
 * @param {Function} fn - Función asíncrona (req, res, next)
 * @returns {import('express').RequestHandler} Middleware estándar con captura automática de promesas
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
