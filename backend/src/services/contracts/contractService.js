import contractRepository from '../../repositories/contracts/contractRepository.js';
import employeeRepository from '../../repositories/employees/employeeRepository.js';
import prisma from '../../database/db.js';

class ContractService {
    async createContract(data) {
        // Validate end date > start date
        if (data.startDate && data.endDate) {
            if (new Date(data.endDate) <= new Date(data.startDate)) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
            }
        }

        // Verify employee exists
        const employee = await employeeRepository.findById(data.employeeId);
        if (!employee) {
            throw new Error('Empleado no encontrado');
        }

        // 1. Validar solapamiento de fechas
        const newStart = new Date(data.startDate);
        const newEnd = data.endDate ? new Date(data.endDate) : null;

        const overlapping = await prisma.contract.findFirst({
            where: {
                employeeId: data.employeeId,
                status: 'Active',
                OR: [
                    // Caso 1: Un contrato existente cubre la nueva fecha de inicio
                    {
                        startDate: { lte: newStart },
                        OR: [
                            { endDate: null },
                            { endDate: { gte: newStart } }
                        ]
                    },
                    // Caso 2: El nuevo contrato cubre el inicio de un contrato existente
                    newEnd ? {
                        startDate: { lte: newEnd, gte: newStart }
                    } : {
                        // Si el nuevo es indefinido (null), se solapa con cualquier contrato que empiece después
                        startDate: { gte: newStart }
                    }
                ]
            }
        });

        if (overlapping) {
            throw new Error('El empleado ya tiene un contrato activo en este rango de fechas. Cierre el contrato anterior primero.');
        }

        return await contractRepository.create(data);
    }

    async getContractsByEmployee(employeeId) {
        return await contractRepository.findByEmployeeId(employeeId);
    }

    async getExpiringContracts(days = 30, tenantId = null) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        // Find contracts expiring between now and futureDate
        // Also ensure they are active
        return await prisma.contract.findMany({
            where: {
                status: 'Active',
                endDate: {
                    gte: today,
                    lte: futureDate
                },
                ...(tenantId ? { employee: { tenantId } } : {})
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                        position: true,
                        email: true
                    }
                }
            },
            orderBy: {
                endDate: 'asc'
            }
        });
    }

    async renewContract(contractId, data, tenantId = null) {
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { employee: true }
        });
        if (!contract) throw new Error('Contrato no encontrado');
        if (tenantId && contract.employee.tenantId !== tenantId) {
            throw new Error('No autorizado para modificar contratos de otra empresa');
        }

        const { newEndDate, newSalary, newType = 'Indefinido', notes } = data;
        const isIndefinite = newType === 'Indefinido' || !newEndDate;

        const updatedContract = await prisma.contract.update({
            where: { id: contractId },
            data: {
                endDate: isIndefinite ? null : new Date(newEndDate),
                type: newType,
                salary: newSalary ? parseFloat(newSalary) : contract.salary,
                clauses: notes ? `${contract.clauses || ''}\n[Renovado ${new Date().toISOString().split('T')[0]}]: ${notes}` : contract.clauses,
                status: 'Active'
            }
        });

        await prisma.employee.update({
            where: { id: contract.employeeId },
            data: {
                contractType: newType
            }
        });

        return updatedContract;
    }
}

export default new ContractService();
