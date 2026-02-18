import systemService from '../services/system/systemService.js';
import jwt from 'jsonwebtoken';

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
            // Check if user is authenticated and is admin
            // Optimization: Verify token here since this middleware runs before auth middleware
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const token = authHeader.split(' ')[1];
                    const secret = process.env.JWT_SECRET || 'secret_key_change_me';
                    const decoded = jwt.verify(token, secret);

                    if (decoded.role === 'admin') {
                        // Allow admin to proceed
                        return next();
                    }
                } catch (error) {
                    // Token invalid or expired, continue to block
                }
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
