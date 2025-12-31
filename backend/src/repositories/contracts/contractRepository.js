import prisma from '../../database/db.js';

class ContractRepository {
    async create(data) {
        return await prisma.contract.create({
            data
        });
    }

    async findByEmployeeId(employeeId) {
        return await prisma.contract.findMany({
            where: { employeeId },
            orderBy: { startDate: 'desc' } // Most recent first
        });
    }

    async findById(id) {
        return await prisma.contract.findUnique({
            where: { id }
        });
    }

    async update(id, data) {
        return await prisma.contract.update({
            where: { id },
            data
        });
    }
}

export default new ContractRepository();
