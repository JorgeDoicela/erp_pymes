import prisma from '../../database/db.js';
import auditRepository from '../../repositories/audit/auditRepository.js';
import { financial } from '../../utils/financialUtils.js';

class SalaryAdvanceService {
    /**
     * Solicitud de anticipo de sueldo / préstamo por parte del empleado.
     */
    async requestAdvance({ employeeId, amount, installments = 1, reason }) {
        const numAmount = Number(amount);
        const numInstallments = parseInt(installments, 10);

        if (!numAmount || numAmount <= 0) {
            throw new Error('El monto solicitado debe ser mayor a 0');
        }
        if (!numInstallments || numInstallments < 1 || numInstallments > 24) {
            throw new Error('El número de cuotas debe estar entre 1 y 24');
        }

        // Obtener contrato activo del empleado para validar límite
        const contract = await prisma.contract.findFirst({
            where: {
                employeeId,
                status: 'Active',
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }]
            },
            orderBy: { startDate: 'desc' }
        });

        if (!contract) {
            throw new Error('El empleado no posee un contrato activo vigente');
        }

        const baseSalary = financial.from(contract.salary);
        const requested = financial.from(numAmount);

        // Validación de políticas PyME: Un anticipo no debe comprometer más del 50% de la capacidad de pago mensual
        const monthlyDeduction = financial.divide(requested, numInstallments);
        const maxMonthlyQuota = financial.percentage(baseSalary, 50);

        if (monthlyDeduction.gt(maxMonthlyQuota)) {
            throw new Error(`La cuota mensual ($${financial.round(monthlyDeduction).toFixed(2)}) supera el límite del 50% de tu sueldo base mensual ($${financial.round(maxMonthlyQuota).toFixed(2)})`);
        }

        // Crear solicitud en estado PENDING
        const advance = await prisma.salaryAdvance.create({
            data: {
                employeeId,
                amount: financial.round(requested),
                installments: numInstallments,
                monthlyDeduction: financial.round(monthlyDeduction),
                reason: reason ? reason.trim() : null,
                status: 'PENDING'
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, identityCard: true, department: true }
                }
            }
        });

        return advance;
    }

    /**
     * Registro directo de anticipo / préstamo por parte del Administrador.
     */
    async createAdvanceByAdmin({ employeeId, amount, installments = 1, reason, autoApprove = true }, adminId = null, tenantId = null) {
        const numAmount = Number(amount);
        const numInstallments = parseInt(installments, 10);

        if (!employeeId) {
            throw new Error('El colaborador es requerido');
        }
        if (!numAmount || numAmount <= 0) {
            throw new Error('El monto debe ser un valor positivo mayor a 0');
        }
        if (!numInstallments || numInstallments < 1 || numInstallments > 24) {
            throw new Error('El número de cuotas debe estar entre 1 y 24');
        }

        // Verificar que el empleado pertenezca al tenant si aplica
        const employee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                ...(tenantId ? { tenantId } : {})
            },
            include: {
                contracts: {
                    where: {
                        status: 'Active',
                        OR: [{ endDate: null }, { endDate: { gte: new Date() } }]
                    },
                    orderBy: { startDate: 'desc' },
                    take: 1
                }
            }
        });

        if (!employee) {
            throw new Error('Colaborador no encontrado o sin permisos');
        }

        const activeContract = employee.contracts[0];
        const baseSalary = activeContract
            ? financial.from(activeContract.salary)
            : (employee.salary ? financial.from(employee.salary.toString().replace(/[^0-9.]/g, '')) : financial.from(0));

        const requested = financial.from(numAmount);
        const monthlyDeduction = financial.divide(requested, numInstallments);

        const status = autoApprove ? 'APPROVED' : 'PENDING';

        const advance = await prisma.salaryAdvance.create({
            data: {
                employeeId,
                amount: financial.round(requested),
                installments: numInstallments,
                monthlyDeduction: financial.round(monthlyDeduction),
                reason: reason ? reason.trim() : 'Concesión administrativa',
                status,
                approvedBy: autoApprove ? adminId : null,
                approvedAt: autoApprove ? new Date() : null
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true }
                }
            }
        });

        if (adminId) {
            await auditRepository.log({
                action: autoApprove ? 'ADMIN_CREATE_AND_APPROVE_ADVANCE' : 'ADMIN_CREATE_ADVANCE',
                entity: 'SalaryAdvance',
                entityId: advance.id,
                userId: adminId,
                tenantId,
                details: {
                    employeeId,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    amount: advance.amount,
                    installments: advance.installments,
                    monthlyDeduction: advance.monthlyDeduction,
                    status: advance.status
                }
            }).catch(err => console.error('[Audit Error] createAdvanceByAdmin:', err));
        }

        return advance;
    }

    /**
     * Obtener estadísticas globales y contadores de anticipos por estado.
     */
    async getStats(tenantId = null) {
        const baseWhere = tenantId ? { employee: { tenantId } } : {};

        const [
            totalCount,
            pendingCount,
            approvedCount,
            paidCount,
            rejectedCount,
            cancelledCount,
            approvedAdvances
        ] = await Promise.all([
            prisma.salaryAdvance.count({ where: baseWhere }),
            prisma.salaryAdvance.count({ where: { ...baseWhere, status: 'PENDING' } }),
            prisma.salaryAdvance.count({ where: { ...baseWhere, status: 'APPROVED' } }),
            prisma.salaryAdvance.count({ where: { ...baseWhere, status: 'PAID' } }),
            prisma.salaryAdvance.count({ where: { ...baseWhere, status: 'REJECTED' } }),
            prisma.salaryAdvance.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
            prisma.salaryAdvance.findMany({
                where: { ...baseWhere, status: 'APPROVED' },
                select: { amount: true, paidAmount: true, monthlyDeduction: true }
            })
        ]);

        const totalActiveBalance = approvedAdvances.reduce(
            (sum, a) => sum + Math.max(0, (a.amount || 0) - (a.paidAmount || 0)),
            0
        );

        const monthlyDeductionsTotal = approvedAdvances.reduce(
            (sum, a) => sum + (a.monthlyDeduction || 0),
            0
        );

        return {
            total: totalCount,
            pending: pendingCount,
            approved: approvedCount,
            paid: paidCount,
            rejected: rejectedCount,
            cancelled: cancelledCount,
            totalActiveBalance: financial.round(financial.from(totalActiveBalance)),
            monthlyDeductionsTotal: financial.round(financial.from(monthlyDeductionsTotal))
        };
    }

    /**
     * Obtener listado de anticipos con filtros para Administradores.
     */
    async getAdvances({ page = 1, limit = 20, status, employeeId, search, tenantId }) {
        const skip = (page - 1) * limit;
        const where = {};

        if (status) {
            where.status = status;
        }
        if (employeeId) {
            where.employeeId = employeeId;
        }

        const employeeWhere = tenantId ? { tenantId } : {};
        if (search) {
            const cleanSearch = search.trim();
            employeeWhere.OR = [
                { firstName: { contains: cleanSearch, mode: 'insensitive' } },
                { lastName: { contains: cleanSearch, mode: 'insensitive' } },
                { identityCard: { contains: cleanSearch, mode: 'insensitive' } },
                { department: { contains: cleanSearch, mode: 'insensitive' } },
                { position: { contains: cleanSearch, mode: 'insensitive' } }
            ];
        }

        if (Object.keys(employeeWhere).length > 0) {
            where.employee = employeeWhere;
        }

        const [data, total] = await Promise.all([
            prisma.salaryAdvance.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    employee: {
                        select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true }
                    }
                }
            }),
            prisma.salaryAdvance.count({ where })
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtener anticipos del empleado autenticado.
     */
    async getMyAdvances(employeeId) {
        return await prisma.salaryAdvance.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Aprobación de anticipo por el Administrador.
     */
    async approveAdvance(id, adminId, tenantId = null) {
        const advance = await prisma.salaryAdvance.findFirst({
            where: {
                id,
                ...(tenantId ? { employee: { tenantId } } : {})
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, email: true, department: true }
                }
            }
        });

        if (!advance) throw new Error('Solicitud de anticipo no encontrada o sin permisos');
        if (advance.status !== 'PENDING') {
            throw new Error(`La solicitud se encuentra en estado ${advance.status} y no puede ser aprobada`);
        }

        const updated = await prisma.salaryAdvance.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedBy: adminId,
                approvedAt: new Date()
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, email: true, department: true, position: true }
                }
            }
        });

        if (adminId) {
            await auditRepository.log({
                action: 'APPROVE_SALARY_ADVANCE',
                entity: 'SalaryAdvance',
                entityId: id,
                userId: adminId,
                tenantId,
                details: {
                    amount: advance.amount,
                    installments: advance.installments,
                    monthlyDeduction: advance.monthlyDeduction,
                    employeeId: advance.employeeId,
                    employeeName: `${advance.employee?.firstName} ${advance.employee?.lastName}`
                }
            }).catch(err => console.error('[Audit Error] approveAdvance:', err));
        }

        return updated;
    }

    /**
     * Rechazo de anticipo por el Administrador.
     */
    async rejectAdvance(id, rejectionReason, adminId, tenantId = null) {
        const advance = await prisma.salaryAdvance.findFirst({
            where: {
                id,
                ...(tenantId ? { employee: { tenantId } } : {})
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, email: true, department: true }
                }
            }
        });

        if (!advance) throw new Error('Solicitud de anticipo no encontrada o sin permisos');
        if (advance.status !== 'PENDING') {
            throw new Error(`La solicitud se encuentra en estado ${advance.status} y no puede ser rechazada`);
        }

        const updated = await prisma.salaryAdvance.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectionReason: rejectionReason ? rejectionReason.trim() : 'Solicitud no aprobada por administración'
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, email: true, department: true, position: true }
                }
            }
        });

        if (adminId) {
            await auditRepository.log({
                action: 'REJECT_SALARY_ADVANCE',
                entity: 'SalaryAdvance',
                entityId: id,
                userId: adminId,
                tenantId,
                details: {
                    amount: advance.amount,
                    rejectionReason: updated.rejectionReason,
                    employeeId: advance.employeeId,
                    employeeName: `${advance.employee?.firstName} ${advance.employee?.lastName}`
                }
            }).catch(err => console.error('[Audit Error] rejectAdvance:', err));
        }

        return updated;
    }

    /**
     * Cancelar solicitud pendiente por parte del empleado.
     */
    async cancelAdvance(id, employeeId) {
        const advance = await prisma.salaryAdvance.findUnique({ where: { id } });
        if (!advance) throw new Error('Solicitud no encontrada');
        if (advance.employeeId !== employeeId) throw new Error('No tienes autorización para cancelar esta solicitud');
        if (advance.status !== 'PENDING') throw new Error('Solo se pueden cancelar solicitudes pendientes');

        return await prisma.salaryAdvance.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }
}

export default new SalaryAdvanceService();
