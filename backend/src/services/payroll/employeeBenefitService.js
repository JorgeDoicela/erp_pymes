import prisma from '../../database/db.js';
import auditRepository from '../../repositories/audit/auditRepository.js';
import { financial } from '../../utils/financialUtils.js';

class EmployeeBenefitService {
    // SBU de referencia legal Ecuador
    SBU = 460.00;

    /**
     * Obtener listado de beneficios con paginación y filtros para el módulo administrativo.
     */
    async getBenefits({ page = 1, limit = 20, status, type, employeeId, search, tenantId }) {
        const skip = (page - 1) * limit;
        const where = {};

        if (status) {
            where.status = status;
        }

        if (type) {
            where.type = type;
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
            prisma.employeeBenefit.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            identityCard: true,
                            department: true,
                            position: true
                        }
                    }
                }
            }),
            prisma.employeeBenefit.count({ where })
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtener estadísticas globales y contadores de beneficios por estado.
     */
    async getStats(tenantId = null) {
        const baseWhere = tenantId ? { employee: { tenantId } } : {};

        const [totalCount, activeCount, processedCount, cancelledCount, activeSum] = await Promise.all([
            prisma.employeeBenefit.count({ where: baseWhere }),
            prisma.employeeBenefit.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
            prisma.employeeBenefit.count({ where: { ...baseWhere, status: 'PROCESSED' } }),
            prisma.employeeBenefit.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
            prisma.employeeBenefit.aggregate({
                where: { ...baseWhere, status: 'ACTIVE' },
                _sum: { amount: true }
            })
        ]);

        return {
            total: totalCount,
            active: activeCount,
            processed: processedCount,
            cancelled: cancelledCount,
            activeAmountTotal: activeSum._sum?.amount || 0
        };
    }

    /**
     * Obtener beneficios de un empleado específico.
     */
    async getByEmployee(employeeId, tenantId = null) {
        const where = { employeeId };
        if (tenantId) {
            where.employee = { tenantId };
        }

        const benefits = await prisma.employeeBenefit.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                        position: true
                    }
                }
            }
        });

        return benefits;
    }

    /**
     * Asignar beneficio individual a un empleado.
     */
    async createBenefit({ employeeId, name, amount, type = 'BONUS', frequency = 'ONE_TIME' }, tenantId = null, adminId = null) {
        if (!employeeId) throw new Error('El ID de empleado es requerido');
        if (!name || !name.trim()) throw new Error('El nombre o concepto del beneficio es requerido');

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error('El monto del beneficio debe ser un número positivo mayor a 0');
        }

        // Verificar que el empleado pertenezca al tenant si aplica
        const employee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                ...(tenantId ? { tenantId } : {})
            },
            select: { id: true, firstName: true, lastName: true }
        });

        if (!employee) {
            throw new Error('Empleado no encontrado o sin permisos');
        }

        const benefit = await prisma.employeeBenefit.create({
            data: {
                employeeId,
                name: name.trim(),
                amount: financial.round(financial.from(numAmount)),
                type: type || 'BONUS',
                frequency: frequency || 'ONE_TIME',
                status: 'ACTIVE'
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                        position: true
                    }
                }
            }
        });

        if (adminId) {
            await auditRepository.log({
                action: 'CREATE_BENEFIT',
                entity: 'EmployeeBenefit',
                entityId: benefit.id,
                userId: adminId,
                tenantId,
                details: {
                    employeeId,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    name: benefit.name,
                    amount: benefit.amount,
                    type: benefit.type,
                    frequency: benefit.frequency
                }
            }).catch(err => console.error('[Audit Error] createBenefit:', err));
        }

        return benefit;
    }

    /**
     * Asignación masiva de beneficios con cálculo de ley y contratos activos.
     */
    async bulkCreate({ employeeIds, name, amount, type = 'BONUS', frequency = 'ONE_TIME', isSpecialCalculation }, tenantId = null, adminId = null) {
        if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
            throw new Error('Debe seleccionar al menos un colaborador');
        }
        if (!name || !name.trim()) {
            throw new Error('El concepto del beneficio es requerido');
        }

        // Obtener empleados con sus contratos activos para determinar su salario real
        const employees = await prisma.employee.findMany({
            where: {
                id: { in: employeeIds },
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

        if (employees.length === 0) {
            throw new Error('No se encontraron colaboradores válidos para la asignación');
        }

        const benefitsData = [];

        for (const emp of employees) {
            let finalAmount = parseFloat(amount) || 0;
            const activeContract = emp.contracts[0];
            const baseSalary = activeContract
                ? financial.from(activeContract.salary)
                : (emp.salary ? financial.from(emp.salary.toString().replace(/[^0-9.]/g, '')) : financial.from(0));

            if (isSpecialCalculation === 'DECIMO_TERCERO') {
                // Décimo Tercero: 1 sueldo base completo (o proporción si se estipula)
                finalAmount = financial.round(baseSalary);
            } else if (isSpecialCalculation === 'DECIMO_CUARTO') {
                // Décimo Cuarto: 1 SBU completo vigente
                finalAmount = financial.round(financial.from(this.SBU));
            } else if (isSpecialCalculation === 'FONDO_RESERVA') {
                // Fondos de Reserva: 8.333% (1/12) del salario base mensual
                finalAmount = financial.round(financial.divide(baseSalary, 12));
            } else if (isSpecialCalculation === 'UTILIDADES' && (!amount || parseFloat(amount) === 0)) {
                // Participación de utilidades estimada si no se colocó monto fijo
                finalAmount = financial.round(financial.percentage(baseSalary, 10));
            }

            if (finalAmount > 0) {
                benefitsData.push({
                    employeeId: emp.id,
                    name: name.trim(),
                    amount: finalAmount,
                    type: type || 'BONUS',
                    frequency: frequency || 'ONE_TIME',
                    status: 'ACTIVE'
                });
            }
        }

        if (benefitsData.length === 0) {
            throw new Error('No fue posible calcular montos válidos para los colaboradores seleccionados');
        }

        await prisma.employeeBenefit.createMany({
            data: benefitsData
        });

        if (adminId) {
            await auditRepository.log({
                action: 'BULK_CREATE_BENEFITS',
                entity: 'EmployeeBenefit',
                userId: adminId,
                tenantId,
                details: {
                    count: benefitsData.length,
                    name,
                    type,
                    isSpecialCalculation,
                    totalAssignedAmount: benefitsData.reduce((acc, b) => acc + b.amount, 0)
                }
            }).catch(err => console.error('[Audit Error] bulkCreate:', err));
        }

        return {
            count: benefitsData.length,
            message: `${benefitsData.length} beneficios asignados exitosamente`
        };
    }

    /**
     * Actualizar beneficio existente (solo si está en estado ACTIVE).
     */
    async updateBenefit(id, { name, amount, type, frequency }, tenantId = null, adminId = null) {
        const benefit = await prisma.employeeBenefit.findFirst({
            where: {
                id,
                ...(tenantId ? { employee: { tenantId } } : {})
            }
        });

        if (!benefit) {
            throw new Error('Beneficio no encontrado o sin permisos');
        }

        if (benefit.status !== 'ACTIVE') {
            throw new Error(`No se puede modificar un beneficio en estado ${benefit.status}`);
        }

        const updateData = {};
        if (name && name.trim()) updateData.name = name.trim();
        if (amount !== undefined) {
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error('El monto debe ser mayor a 0');
            }
            updateData.amount = financial.round(financial.from(numAmount));
        }
        if (type) updateData.type = type;
        if (frequency) updateData.frequency = frequency;

        const updated = await prisma.employeeBenefit.update({
            where: { id },
            data: updateData,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                        position: true
                    }
                }
            }
        });

        if (adminId) {
            await auditRepository.log({
                action: 'UPDATE_BENEFIT',
                entity: 'EmployeeBenefit',
                entityId: id,
                userId: adminId,
                tenantId,
                details: { before: benefit, after: updated }
            }).catch(err => console.error('[Audit Error] updateBenefit:', err));
        }

        return updated;
    }

    /**
     * Cancelar o desactivar beneficio (solo si está ACTIVE).
     */
    async deactivate(id, tenantId = null, adminId = null) {
        const benefit = await prisma.employeeBenefit.findFirst({
            where: {
                id,
                ...(tenantId ? { employee: { tenantId } } : {})
            }
        });

        if (!benefit) {
            throw new Error('Beneficio no encontrado o sin permisos');
        }

        if (benefit.status === 'PROCESSED') {
            throw new Error('No se puede cancelar un beneficio que ya fue procesado y pagado en el rol de pagos');
        }

        const updated = await prisma.employeeBenefit.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        if (adminId) {
            await auditRepository.log({
                action: 'DEACTIVATE_BENEFIT',
                entity: 'EmployeeBenefit',
                entityId: id,
                userId: adminId,
                tenantId,
                details: { previousStatus: benefit.status, newStatus: 'CANCELLED' }
            }).catch(err => console.error('[Audit Error] deactivate:', err));
        }

        return updated;
    }
}

export default new EmployeeBenefitService();
