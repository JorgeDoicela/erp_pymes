import prisma from '../database/db.js';
import { runWithTenant } from '../database/tenantContext.js';
import { isSuperAdminRole } from '../config/roles.js';

/**
 * Middleware para validar e inyectar el contexto de Tenant en las peticiones HTTP.
 * Asegura que el usuario solo opere sobre los datos de su propia empresa (multi-tenancy)
 * y que la suscripción de la empresa esté activa.
 */
export const requireTenant = async (req, res, next) => {
    try {
        const isSuperAdmin = isSuperAdminRole(req.user?.role);

        // Seguridad: Para usuarios autenticados normales, forzar req.user.tenantId. 
        // Solo SuperAdmin o peticiones no autenticadas (ej. biometric) pueden usar x-tenant-id.
        const tenantId = req.user 
            ? (isSuperAdmin ? (req.headers['x-tenant-id'] || req.user.tenantId) : req.user.tenantId)
            : req.headers['x-tenant-id'];

        if (!tenantId) {
            if (isSuperAdmin) {
                // SuperAdmin sin tenant específico en peticiones de escritura se bloquea
                if (req.method !== 'GET') {
                    return res.status(403).json({
                        success: false,
                        message: 'Modo Supervisión: El SuperAdministrador solo tiene permisos de lectura y auditoría sobre los módulos de las empresas.',
                        code: 'SUPERADMIN_READ_ONLY_SUPERVISION'
                    });
                }
                // SuperAdmin sin tenant específico navega en modo global de lectura
                return runWithTenant(null, () => next(), true);
            }
            return res.status(400).json({
                success: false,
                message: 'Contexto de empresa (Tenant) no encontrado en la sesión o petición.',
                code: 'TENANT_ID_REQUIRED'
            });
        }

        // Seguridad Multi-Tenant: SuperAdmin solo tiene permisos de lectura (GET) sobre endpoints operacionales de empresas
        if (isSuperAdmin && req.method !== 'GET') {
            return res.status(403).json({
                success: false,
                message: 'Modo Supervisión: El SuperAdministrador solo tiene acceso de lectura y auditoría sobre las operaciones internas de la empresa.',
                code: 'SUPERADMIN_READ_ONLY_SUPERVISION'
            });
        }

        // Buscar Tenant en base de datos (usando findFirst para evitar recursión de middleware si aplica)
        const tenant = await prisma.tenant.findFirst({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                subscriptionStatus: true,
                maxEmployees: true,
                isActive: true,
                subscriptionEndsAt: true,
                trialEndsAt: true,
            }
        });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la empresa asociada a esta cuenta de usuario.',
                code: 'TENANT_NOT_FOUND'
            });
        }

        if (!isSuperAdmin) {
            // Validar Estado de Suscripción Específico para usuarios normales
            if (tenant.subscriptionStatus === 'SUSPENDED') {
                return res.status(402).json({
                    success: false,
                    message: `La suscripción de la empresa '${tenant.name}' se encuentra suspendida por falta de pago o pago pendiente. Por favor contacta al Administrador de tu empresa o a Soporte para reactivar el servicio.`,
                    code: 'SUBSCRIPTION_SUSPENDED'
                });
            }

            if (tenant.subscriptionStatus === 'CANCELLED') {
                return res.status(403).json({
                    success: false,
                    message: `La cuenta de la empresa '${tenant.name}' ha sido cancelada.`,
                    code: 'SUBSCRIPTION_CANCELLED'
                });
            }

            // Validar vencimiento de Prueba Gratuita (Trial)
            const now = new Date();
            const expirationDate = tenant.subscriptionEndsAt || tenant.trialEndsAt;

            if (tenant.subscriptionStatus === 'TRIAL' && expirationDate && new Date(expirationDate) < now) {
                prisma.tenant.update({
                    where: { id: tenant.id },
                    data: { subscriptionStatus: 'SUSPENDED', isActive: false }
                }).catch(err => console.error('Error auto-suspending tenant:', err));

                return res.status(402).json({
                    success: false,
                    message: `El período de prueba gratuita de 14 días para la empresa '${tenant.name}' ha finalizado. Por favor actualiza la suscripción para continuar.`,
                    code: 'TRIAL_EXPIRED'
                });
            }

            // Validar si la empresa fue marcada inactiva explícitamente
            if (!tenant.isActive) {
                return res.status(403).json({
                    success: false,
                    message: `La empresa '${tenant.name}' se encuentra desactivada en la plataforma. Por favor contacta a soporte técnico.`,
                    code: 'TENANT_INACTIVE'
                });
            }
        }

        // Inyectar en req
        req.tenantId = tenant.id;
        req.tenant = tenant;

        // Envolver en el contexto asíncrono para Prisma Middleware
        return runWithTenant(tenant.id, () => next(), isSuperAdmin);
    } catch (error) {
        console.error('[TENANT MIDDLEWARE ERROR]:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar el contexto de la empresa: ' + error.message
        });
    }
};

/**
 * Middleware opcional de Feature Flags por Plan (ESSENTIAL, GROWTH, ENTERPRISE)
 */
export const requirePlan = (requiredPlan) => {
    const PLAN_LEVELS = {
        'ESSENTIAL': 1,
        'GROWTH': 2,
        'ENTERPRISE': 3
    };

    return (req, res, next) => {
        const currentPlan = req.tenant?.plan || 'ESSENTIAL';
        const currentLevel = PLAN_LEVELS[currentPlan] || 1;
        const requiredLevel = PLAN_LEVELS[requiredPlan] || 1;

        if (currentLevel < requiredLevel) {
            return res.status(403).json({
                success: false,
                message: `Esta funcionalidad requiere el plan ${requiredPlan} o superior. Tu plan actual es ${currentPlan}.`,
                code: 'FEATURE_NOT_IN_PLAN',
                requiredPlan,
                currentPlan
            });
        }

        next();
    };
};
