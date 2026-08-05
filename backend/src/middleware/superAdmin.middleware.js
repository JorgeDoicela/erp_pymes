import prisma from '../database/db.js';

/**
 * Middleware para validar permisos de SuperAdministrador (Dueño de la Plataforma EMPLIFI).
 */
export const requireSuperAdmin = async (req, res, next) => {
    try {
        const userRole = (req.user?.role || '').toLowerCase();
        const isSuperAdminRole = userRole === 'superadmin';
        const isSuperAdminEmail = req.user?.email === 'admin@emplifi.com';

        if (isSuperAdminRole || isSuperAdminEmail) {
            return next();
        }

        // Validación de respaldo en BD para tokens de sesión antiguos sin email o rol superadmin
        if (req.user?.id) {
            const user = await prisma.employee.findUnique({
                where: { id: req.user.id },
                select: { email: true, role: true }
            });

            if (user && (user.email === 'admin@emplifi.com' || user.role === 'superadmin' || user.role === 'SUPERADMIN')) {
                req.user.email = user.email;
                req.user.role = 'superadmin';
                return next();
            }
        }

        return res.status(403).json({
            success: false,
            message: 'Acceso denegado: Se requieren privilegios de SuperAdministrador de la plataforma.',
            code: 'SUPERADMIN_REQUIRED'
        });
    } catch (error) {
        console.error('[SUPERADMIN MIDDLEWARE ERROR]:', error);
        return res.status(500).json({ success: false, message: 'Error interno de autorización' });
    }
};
