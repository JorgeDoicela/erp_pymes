import systemService from '../services/system/systemService.js';

/**
 * RNF-17: Middleware de Mantenimiento
 */
export const maintenanceMiddleware = async (req, res, next) => {
    // Always allowed routes
    const publicRoutes = ['/system/health', '/auth/login'];
    if (publicRoutes.includes(req.path) || req.path.startsWith('/system/settings')) {
        return next();
    }

    try {
        const settings = await systemService.getSettings();

        if (settings?.maintenanceMode) {
            // If user is authenticated and is admin, allow
            if (req.user && req.user.role === 'admin') {
                return next();
            }

            return res.status(503).json({
                success: false,
                message: settings.maintenanceMessage || 'El sistema se encuentra en mantenimiento programado. Por favor, intente más tarde.',
                maintenance: true
            });
        }

        next();
    } catch (error) {
        // If setting check fails, we prefer to keep system available
        console.error('Maintenance check failed:', error);
        next();
    }
};
