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

            const [
                totalTenants, 
                activeTenants, 
                trialTenants, 
                suspendedTenants, 
                expiringTrialsCount, 
                totalEmployees,
                essentialCount,
                growthCount,
                enterpriseCount,
                expiringTrialsList
            ] = await Promise.all([
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
                prisma.employee.count({ where: { isActive: true } }),
                prisma.tenant.count({ where: { plan: 'ESSENTIAL' } }),
                prisma.tenant.count({ where: { plan: 'GROWTH' } }),
                prisma.tenant.count({ where: { plan: 'ENTERPRISE' } }),
                prisma.tenant.findMany({
                    where: {
                        subscriptionStatus: 'TRIAL',
                        trialEndsAt: { lte: sevenDaysFromNow }
                    },
                    take: 5,
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        trialEndsAt: true,
                        plan: true,
                        _count: { select: { employees: true } }
                    },
                    orderBy: { trialEndsAt: 'asc' }
                })
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

            const calculatedMRR = Math.round(estimatedMRR * 100) / 100;
            const arpu = activeTenants > 0 ? Math.round((calculatedMRR / activeTenants) * 100) / 100 : 0;

            return res.json({
                success: true,
                data: {
                    totalTenants,
                    activeTenants,
                    trialTenants,
                    suspendedTenants,
                    expiringTrialsCount,
                    totalEmployees,
                    estimatedMRR: calculatedMRR,
                    arpu,
                    currency: 'USD',
                    systemHealth: 'OPERATIONAL',
                    planDistribution: {
                        ESSENTIAL: essentialCount,
                        GROWTH: growthCount,
                        ENTERPRISE: enterpriseCount
                    },
                    expiringTrials: expiringTrialsList.map(t => ({
                        id: t.id,
                        name: t.name,
                        slug: t.slug,
                        trialEndsAt: t.trialEndsAt,
                        plan: t.plan,
                        employeeCount: t._count.employees
                    }))
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

export const getTenantsList = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const tenants = await prisma.tenant.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    plan: true,
                    subscriptionStatus: true
                },
                orderBy: { name: 'asc' }
            });
            return res.json({
                success: true,
                data: tenants
            });
        }, true);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Auditoría Global Plataforma (SaaS Control Plane)
 */
export const getGlobalAuditLogs = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const { page = 1, limit = 20, tenantId, entity, search } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const where = {};
            if (tenantId) where.tenantId = tenantId;
            if (entity) where.entity = entity;
            if (search) {
                where.OR = [
                    { action: { contains: search, mode: 'insensitive' } },
                    { performedBy: { contains: search, mode: 'insensitive' } },
                    { details: { contains: search, mode: 'insensitive' } }
                ];
            }

            const [logs, total] = await Promise.all([
                prisma.auditLog.findMany({
                    where,
                    skip,
                    take: parseInt(limit),
                    orderBy: { timestamp: 'desc' },
                    include: {
                        tenant: { select: { id: true, name: true, slug: true } }
                    }
                }),
                prisma.auditLog.count({ where })
            ]);

            return res.json({
                success: true,
                data: logs,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            });
        }, true);
    } catch (error) {
        console.error('[SUPERADMIN AUDIT LOGS ERROR]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Alta Directa de Tenant desde Backoffice SuperAdmin
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const createTenantBySuperAdmin = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const {
                companyName,
                slug: slugRaw,
                ruc,
                plan = 'ESSENTIAL',
                maxEmployees = 50,
                adminFirstName,
                adminLastName,
                adminEmail,
                adminPassword
            } = req.body;

            if (!companyName || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre de empresa, datos del administrador (nombre, correo y contraseña) son requeridos.'
                });
            }

            const slug = (slugRaw || companyName)
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 50);

            const existingTenant = await prisma.tenant.findFirst({
                where: { OR: [{ slug }, ...(ruc ? [{ ruc }] : [])] }
            });
            if (existingTenant) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una empresa con ese slug o RUC.'
                });
            }

            const existingUser = await prisma.employee.findUnique({
                where: { email: adminEmail }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico ya está registrado por otro usuario.'
                });
            }

            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

            const result = await prisma.$transaction(async (tx) => {
                const tenant = await tx.tenant.create({
                    data: {
                        name: companyName,
                        slug,
                        ruc: ruc || null,
                        plan,
                        subscriptionStatus: 'TRIAL',
                        maxEmployees: parseInt(maxEmployees),
                        trialEndsAt,
                        isActive: true
                    }
                });

                const admin = await tx.employee.create({
                    data: {
                        tenantId: tenant.id,
                        firstName: adminFirstName,
                        lastName: adminLastName,
                        email: adminEmail,
                        password: hashedPassword,
                        role: 'admin',
                        department: 'Dirección General',
                        position: 'Administrador Principal',
                        salary: '0',
                        identityCard: ruc || `ADMIN-${Date.now()}`,
                        phone: '0999999999',
                        address: 'Oficina Principal',
                        birthDate: new Date('1990-01-01'),
                        hireDate: new Date(),
                        civilStatus: 'SOLTERO',
                        contractType: 'INDEFINIDO'
                    }
                });

                await tx.auditLog.create({
                    data: {
                        tenantId: tenant.id,
                        entity: 'TENANT',
                        entityId: tenant.id,
                        action: 'SUPERADMIN_CREATE_TENANT',
                        performedBy: req.user?.email || 'SUPERADMIN',
                        details: `Empresa '${tenant.name}' creada desde Backoffice SuperAdmin por ${req.user?.email}`
                    }
                });

                return { tenant, admin };
            });

            return res.status(201).json({
                success: true,
                message: `Empresa '${result.tenant.name}' creada exitosamente con trial de 14 días.`,
                data: result
            });
        }, true);
    } catch (error) {
        console.error('[SUPERADMIN CREATE TENANT ERROR]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Modo Soporte / Impersonación Auditada
 */
export const impersonateTenant = async (req, res) => {
    try {
        return runWithTenant(null, async () => {
            const { id } = req.params;
            const tenant = await prisma.tenant.findUnique({
                where: { id },
                include: {
                    employees: {
                        where: { role: 'admin', isActive: true },
                        take: 1
                    }
                }
            });

            if (!tenant) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

            const adminUser = tenant.employees[0];
            if (!adminUser) {
                return res.status(400).json({ success: false, message: 'La empresa no tiene un administrador activo para impersonar.' });
            }

            // Generar token JWT temporal de soporte auditado
            const JWT_SECRET = process.env.JWT_SECRET || 'emplifi_secret_jwt_key_2026_super_secure';
            const token = jwt.sign(
                {
                    id: adminUser.id,
                    email: adminUser.email,
                    role: adminUser.role,
                    tenantId: tenant.id,
                    isImpersonated: true,
                    impersonatedBy: req.user?.email
                },
                JWT_SECRET,
                { expiresIn: '2h' }
            );

            // Registrar Log Inmutable de Auditoría
            await prisma.auditLog.create({
                data: {
                    tenantId: tenant.id,
                    entity: 'SUPPORT_SESSION',
                    entityId: tenant.id,
                    action: 'SUPERADMIN_IMPERSONATE_TENANT',
                    performedBy: req.user?.email || 'SUPERADMIN',
                    details: `Modo soporte iniciado por SuperAdmin '${req.user?.email}' en la empresa '${tenant.name}'`
                }
            });

            return res.json({
                success: true,
                message: `Modo soporte iniciado para la empresa '${tenant.name}'`,
                data: {
                    token,
                    user: {
                        id: adminUser.id,
                        firstName: adminUser.firstName,
                        lastName: adminUser.lastName,
                        email: adminUser.email,
                        role: adminUser.role,
                        tenantId: tenant.id
                    },
                    tenant: {
                        id: tenant.id,
                        name: tenant.name,
                        slug: tenant.slug
                    }
                }
            });
        }, true);
    } catch (error) {
        console.error('[SUPERADMIN IMPERSONATE ERROR]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


