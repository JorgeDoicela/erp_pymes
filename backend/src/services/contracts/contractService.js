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

    async getExpiringContracts(days = 30) {
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
                }
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
}

export default new ContractService();
