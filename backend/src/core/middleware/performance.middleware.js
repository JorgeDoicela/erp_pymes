/**
 * @file performance.middleware.js
 * @description Monitoreo de tiempos de respuesta y cumplimiento de SLAs (RNF-13) (Norma ERP Core Middleware).
 * Mide la latencia de peticiones y alerta si exceden los umbrales definidos por ruta.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

/**
 * Middleware para monitoreo de tiempos de respuesta (RNF-13)
 * Mide el tiempo que tarda cada petición y alerta si excede los umbrales definidos.
 */
export const performanceMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

    const url = req.originalUrl;
    const method = req.method;

    // Umbrales SLA según RNF-13
    let threshold = 2000;
    let type = 'General';

    if (url.includes('/attendance')) {
      threshold = 1000;
      type = 'Asistencia';
    } else if (
      url.includes('/advisor') ||
      url.includes('/intelligence') ||
      url.includes('/fine-tuning') ||
      url.includes('/eval/benchmark')
    ) {
      threshold = 15000;
      type = 'Inferencia IA / RAG';
    } else if (url.includes('/reports') || url.includes('/analytics')) {
      threshold = 5000;
      type = 'Reportes';
    } else if (method === 'GET' && (url.includes('search') || url.includes('?q='))) {
      threshold = 3000;
      type = 'Búsqueda';
    }

    const duration = parseFloat(durationInMs);
    const logMsg = `[PERFORMANCE] ${method} ${url} - ${duration}ms (${type})`;

    if (duration > threshold) {
      console.warn(`ALERTA DE RENDIMIENTO (SLA ${threshold}ms excedido): ${logMsg}`);
    } else {
      console.log(logMsg);
    }
  });

  next();
};

export default performanceMiddleware;
