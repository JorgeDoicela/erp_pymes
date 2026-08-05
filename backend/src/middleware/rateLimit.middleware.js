// In-memory sliding window rate limiter
const requestCounts = new Map();

/**
 * Limitador de tasa de peticiones (Rate Limiter) liviano para endpoints sensibles.
 * @param {number} windowMs - Ventana de tiempo en milisegundos (ej: 15 minutos = 15 * 60 * 1000)
 * @param {number} maxRequests - Límite de peticiones permitidas por IP en la ventana
 */
export const rateLimit = ({ windowMs = 15 * 60 * 1000, maxRequests = 10 } = {}) => {
    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
        const now = Date.now();

        if (!requestCounts.has(ip)) {
            requestCounts.set(ip, []);
        }

        const timestamps = requestCounts.get(ip).filter(ts => now - ts < windowMs);
        timestamps.push(now);
        requestCounts.set(ip, timestamps);

        if (timestamps.length > maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Demasiadas peticiones realizadas. Por favor espera unos minutos antes de intentar de nuevo.',
                code: 'TOO_MANY_REQUESTS'
            });
        }

        next();
    };
};
