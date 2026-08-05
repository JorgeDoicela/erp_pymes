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

        // Validación de políticas PyME: Un anticipo de 1 cuota no debe superar el 60% del sueldo base mensual.
        // Préstamos multicuota no deben requerir cuota mensual superior al 40% del sueldo base.
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
     * Obtener listado de anticipos con filtros para Administradores.
     */
    async getAdvances({ page = 1, limit = 20, status, employeeId, search }) {
        const skip = (page - 1) * limit;
        const where = {};

        if (status) {
            where.status = status;
        }
        if (employeeId) {
            where.employeeId = employeeId;
        }
        if (search) {
            where.employee = {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { identityCard: { contains: search, mode: 'insensitive' } }
                ]
            };
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
    async approveAdvance(id, adminId) {
        const advance = await prisma.salaryAdvance.findUnique({
            where: { id },
            include: { employee: true }
        });

        if (!advance) throw new Error('Solicitud de anticipo no encontrada');
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
            include: { employee: true }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'SalaryAdvance',
                entityId: id,
                action: 'APPROVE',
                performedBy: adminId,
                details: `Aprobado anticipo de $${advance.amount} (${advance.installments} cuotas) para ${advance.employee.firstName} ${advance.employee.lastName}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return updated;
    }

    /**
     * Rechazo de anticipo por el Administrador.
     */
    async rejectAdvance(id, rejectionReason, adminId) {
        const advance = await prisma.salaryAdvance.findUnique({
            where: { id },
            include: { employee: true }
        });

        if (!advance) throw new Error('Solicitud de anticipo no encontrada');
        if (advance.status !== 'PENDING') {
            throw new Error(`La solicitud se encuentra en estado ${advance.status} y no puede ser rechazada`);
        }

        const updated = await prisma.salaryAdvance.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectionReason: rejectionReason ? rejectionReason.trim() : 'Solicitud no aprobada por administración'
            },
            include: { employee: true }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'SalaryAdvance',
                entityId: id,
                action: 'REJECT',
                performedBy: adminId,
                details: `Rechazado anticipo de $${advance.amount} para ${advance.employee.firstName} ${advance.employee.lastName}. Motivo: ${updated.rejectionReason}`
            }).catch(err => console.error('Audit Log Error:', err));
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
