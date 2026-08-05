import prisma from '../../database/db.js';
import { runWithTenant } from '../../database/tenantContext.js';

/**
 * SuperAdmin Controller - Backoffice de la Plataforma EMPLIFI
 * Exclusivo para los dueños del software. No sujeto a restricciones de tenant individual.
 */
export const getPlatformMetrics = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const [totalTenants, activeTenants, trialTenants, suspendedTenants, expiringTrialsCount, totalEmployees] = await Promise.all([
                prisma.tenant.count(),
                prisma.tenant.count({ where: { subscriptionStatus: 'ACTIVE', isActive: true } }),
                prisma.tenant.count({ where: { subscriptionStatus: 'TRIAL', isActive: true } }),
                prisma.tenant.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
                prisma.tenant.count({
                    where: {
                        subscriptionStatus: 'TRIAL',
                        trialEndsAt: { lte: sevenDaysFromNow }
                    }
                }),
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
                    expiringTrialsCount,
                    totalEmployees,
                    estimatedMRR: Math.round(estimatedMRR * 100) / 100,
                    currency: 'USD',
                    systemHealth: 'OPERATIONAL'
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
            const { page = 1, limit = 10, q, status, plan } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const where = {};
            if (status) {
                if (status === 'EXPIRING') {
                    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    where.subscriptionStatus = 'TRIAL';
                    where.trialEndsAt = { lte: sevenDaysFromNow };
                } else {
                    where.subscriptionStatus = status;
                }
            }
            if (plan) where.plan = plan;

            if (q && typeof q === 'string' && q.trim()) {
                const search = q.trim();
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                    { ruc: { contains: search } },
                    {
                        employees: {
                            some: {
                                role: 'admin',
                                OR: [
                                    { email: { contains: search, mode: 'insensitive' } },
                                    { firstName: { contains: search, mode: 'insensitive' } },
                                    { lastName: { contains: search, mode: 'insensitive' } }
                                ]
                            }
                        }
                    }
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

export const getTenantDetail = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const { id } = req.params;
            const tenant = await prisma.tenant.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            employees: true,
                            payrolls: true,
                            jobVacancies: true,
                            announcements: true
                        }
                    },
                    employees: {
                        where: { role: 'admin' },
                        take: 1,
                        select: { id: true, firstName: true, lastName: true, email: true, phone: true, hireDate: true }
                    },
                    systemSettings: true
                }
            });

            if (!tenant) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

            const [contractCount, attendanceCount] = await Promise.all([
                prisma.contract.count({ where: { employee: { tenantId: id } } }),
                prisma.attendance.count({ where: { employee: { tenantId: id } } })
            ]);

            return res.json({
                success: true,
                data: {
                    ...tenant,
                    admin: tenant.employees[0] || null,
                    employeeCount: tenant._count.employees,
                    payrollCount: tenant._count.payrolls,
                    vacancyCount: tenant._count.jobVacancies,
                    announcementCount: tenant._count.announcements,
                    contractCount,
                    attendanceCount
                }
            });
        }, true);
    } catch (error) {
        console.error('[SUPERADMIN GET TENANT DETAIL ERROR]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const ALLOWED_STATUSES = ['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'];
const ALLOWED_PLANS = ['ESSENTIAL', 'GROWTH', 'ENTERPRISE'];

export const updateTenantStatus = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const { id } = req.params;
            const { subscriptionStatus, extendDays } = req.body;

            if (subscriptionStatus && !ALLOWED_STATUSES.includes(subscriptionStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Estado de suscripción inválido. Estados permitidos: ${ALLOWED_STATUSES.join(', ')}`
                });
            }

            const tenant = await prisma.tenant.findUnique({ where: { id } });
            if (!tenant) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

            const updateData = {};

            if (subscriptionStatus) {
                updateData.subscriptionStatus = subscriptionStatus;
                if (subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIAL') {
                    updateData.isActive = true;
                } else if (subscriptionStatus === 'CANCELLED' || subscriptionStatus === 'SUSPENDED') {
                    updateData.isActive = false;
                }
            }

            if (extendDays && typeof extendDays === 'number' && extendDays > 0) {
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

            if (plan && !ALLOWED_PLANS.includes(plan)) {
                return res.status(400).json({
                    success: false,
                    message: `Plan inválido. Planes permitidos: ${ALLOWED_PLANS.join(', ')}`
                });
            }

            const updateData = {};
            if (plan) updateData.plan = plan;
            if (maxEmployees !== undefined && typeof maxEmployees === 'number' && maxEmployees > 0) {
                updateData.maxEmployees = maxEmployees;
            }

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
