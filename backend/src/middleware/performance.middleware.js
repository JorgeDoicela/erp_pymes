
/**
 * Middleware para monitoreo de tiempos de respuesta (RNF-13)
 * Mide el tiempo que tarda cada petición y alerta si excede los umbrales definidos.
 */
export const performanceMiddleware = (req, res, next) => {
    const start = process.hrtime();

    res.on('finish', () => { // Usar 'finish' para cuando se ha enviado la respuesta
        const diff = process.hrtime(start);
        const durationInMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2); // Convertir a ms

        const url = req.originalUrl;
        const method = req.method;

        // Definir umbrales (SLA) según el tipo de operación (RNF-13)
        let threshold = 2000; // Default: Carga de páginas principales (2s)
        let type = 'General';

        if (url.includes('/attendance')) {
            threshold = 1000; // Registro de asistencia (1s)
            type = 'Asistencia';
        } else if (url.includes('/reports') || url.includes('/analytics')) {
            threshold = 5000; // Generación de reportes (5s)
            type = 'Reportes';
        } else if (method === 'GET' && (url.includes('search') || url.includes('?q='))) {
            threshold = 3000; // Búsquedas y filtros (3s)
            type = 'Búsqueda';
        }

        const duration = parseFloat(durationInMs);

        // Log básico de rendimiento
        // En producción esto iría a un sistema de logs como ELK o Datadog
        const logMsg = `[PERFORMANCE] ${method} ${url} - ${duration}ms (${type})`;

        if (duration > threshold) {
            console.warn(`⚠️ ALERTA DE RENDIMIENTO (SLA ${threshold}ms excedido): ${logMsg}`);
        } else {
            console.log(logMsg);
        }
    });

    next();
};
