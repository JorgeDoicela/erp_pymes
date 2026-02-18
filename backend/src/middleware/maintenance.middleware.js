import systemService from '../services/system/systemService.js';
import jwt from 'jsonwebtoken';

/**
 * RNF-17: Middleware de Mantenimiento
 */
export const maintenanceMiddleware = async (req, res, next) => {
    // Always allowed routes
    // NOTE: req.path includes the full path since this middleware is mounted at root
    const publicRoutes = [
        '/api/system/health',
        '/api/auth/login',
        '/system/health', // Fallback
        '/auth/login'     // Fallback
    ];

    // Check if path matches allowed routes
    if (publicRoutes.some(route => req.path.includes(route)) || req.path.includes('/system/settings')) {
        return next();
    }

    try {
        const settings = await systemService.getSettings();

        // If settings load fails or maintenance mode is false, proceed
        if (!settings?.maintenanceMode) {
            return next();
        }

        // Check if user is authenticated and is admin
        // Optimization: Verify token here since this middleware runs before auth middleware
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const secret = process.env.JWT_SECRET || 'secret_key_change_me';
                const decoded = jwt.verify(token, secret);

                // Case-insensitive role check
                const role = decoded.role ? decoded.role.toLowerCase() : '';
                if (role === 'admin' || role === 'superadmin') {
                    // Allow admin to proceed
                    return next();
                }
            } catch (error) {
                // Token invalid or expired, continue to block
                console.log('Maintenance bypass failed:', error.message);
            }
        }

        return res.status(503).json({
            success: false,
            message: settings.maintenanceMessage || 'El sistema se encuentra en mantenimiento programado. Por favor, intente más tarde.',
            maintenance: true
        });

    } catch (error) {
        // If setting check fails, we prefer to keep system available
        console.error('Maintenance check failed:', error);
        next();
    }
};

//arreglado