import prisma from '../database/db.js';

class DocumentRepository {
    async create(data) {
        return await prisma.document.create({
            data
        });
    }

    async findByEmployeeId(employeeId) {
        return await prisma.document.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id) {
        return await prisma.document.findUnique({
            where: { id }
        });
    }

    async delete(id) {
        return await prisma.document.delete({
            where: { id }
        });
    }
}

export default new DocumentRepository();
