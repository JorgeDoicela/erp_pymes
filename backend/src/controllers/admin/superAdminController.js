import prisma from '../../database/db.js';
import { runWithTenant } from '../../database/tenantContext.js';

/**
 * SuperAdmin Controller - Backoffice de la Plataforma EMPLIFI
 * Exclusivo para los dueños del software. No sujeto a restricciones de tenant individual.
 */
export const getPlatformMetrics = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const [totalTenants, activeTenants, trialTenants, suspendedTenants, totalEmployees] = await Promise.all([
                prisma.tenant.count(),
                prisma.tenant.count({ where: { subscriptionStatus: 'ACTIVE', isActive: true } }),
                prisma.tenant.count({ where: { subscriptionStatus: 'TRIAL', isActive: true } }),
                prisma.tenant.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
                prisma.employee.count({ where: { isActive: true } })
            ]);

            // Cálculo aproximado de Ingreso Mensual Recurrente (MRR)
            const activeTenantDetails = await prisma.tenant.findMany({
                where: { subscriptionStatus: 'ACTIVE', isActive: true },
                select: { plan: true, _count: { select: { employees: true } } }
            });

            const PLAN_PRICE_PER_EMPLOYEE = {
                'ESSENTIAL': 1.50,
                'GROWTH': 3.00,
                'ENTERPRISE': 5.00
            };

            let estimatedMRR = 0;
            activeTenantDetails.forEach(t => {
                const empCount = t._count.employees || 1;
                const price = PLAN_PRICE_PER_EMPLOYEE[t.plan] || 1.50;
                estimatedMRR += empCount * price;
            });

            return res.json({
                success: true,
                data: {
                    totalTenants,
                    activeTenants,
                    trialTenants,
                    suspendedTenants,
                    totalEmployees,
                    estimatedMRR: Math.round(estimatedMRR * 100) / 100,
                    currency: 'USD'
                }
            });
        }, true);
    } catch (error) {
        console.error('[SUPERADMIN METRICS ERROR]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllTenants = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const { page = 1, limit = 20, q, status, plan } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const where = {};
            if (status) where.subscriptionStatus = status;
            if (plan) where.plan = plan;

            if (q) {
                where.OR = [
                    { name: { contains: q, mode: 'insensitive' } },
                    { slug: { contains: q, mode: 'insensitive' } },
                    { ruc: { contains: q } }
                ];
            }

            const [tenants, total] = await Promise.all([
                prisma.tenant.findMany({
                    where,
                    skip,
                    take: parseInt(limit),
                    orderBy: { createdAt: 'desc' },
                    include: {
                        _count: {
                            select: { employees: true }
                        },
                        employees: {
                            where: { role: 'admin' },
                            take: 1,
                            select: { firstName: true, lastName: true, email: true, phone: true }
                        }
                    }
                }),
                prisma.tenant.count({ where })
            ]);

            return res.json({
                success: true,
                data: tenants.map(t => ({
                    id: t.id,
                    name: t.name,
                    slug: t.slug,
                    ruc: t.ruc,
                    plan: t.plan,
                    subscriptionStatus: t.subscriptionStatus,
                    maxEmployees: t.maxEmployees,
                    employeeCount: t._count.employees,
                    trialEndsAt: t.trialEndsAt,
                    subscriptionEndsAt: t.subscriptionEndsAt,
                    createdAt: t.createdAt,
                    admin: t.employees[0] || null
                })),
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            });
        }, true);
    } catch (error) {
        console.error('[SUPERADMIN GET ALL TENANTS ERROR]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTenantStatus = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const { id } = req.params;
            const { subscriptionStatus, extendDays } = req.body;

            const tenant = await prisma.tenant.findUnique({ where: { id } });
            if (!tenant) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

            const updateData = {};

            if (subscriptionStatus) {
                updateData.subscriptionStatus = subscriptionStatus;
                if (subscriptionStatus === 'ACTIVE') {
                    updateData.isActive = true;
                } else if (subscriptionStatus === 'CANCELLED') {
                    updateData.isActive = false;
                }
            }

            if (extendDays && typeof extendDays === 'number') {
                const currentEnd = tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : new Date();
                const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()) + extendDays * 24 * 60 * 60 * 1000);
                updateData.subscriptionEndsAt = newEnd;
            }

            const updated = await prisma.tenant.update({
                where: { id },
                data: updateData
            });

            return res.json({
                success: true,
                message: `Estado de la empresa '${updated.name}' actualizado a ${updated.subscriptionStatus}`,
                data: updated
            });
        }, true);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTenantPlan = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const { id } = req.params;
            const { plan, maxEmployees } = req.body;

            const updateData = {};
            if (plan) updateData.plan = plan;
            if (maxEmployees !== undefined) updateData.maxEmployees = maxEmployees;

            const updated = await prisma.tenant.update({
                where: { id },
                data: updateData
            });

            return res.json({
                success: true,
                message: `Plan de la empresa '${updated.name}' actualizado a ${updated.plan}`,
                data: updated
            });
        }, true);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
