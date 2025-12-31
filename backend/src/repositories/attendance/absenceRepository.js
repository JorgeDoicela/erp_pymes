import prisma from '../../database/db.js';

export const absenceRepository = {
    async createRequest(data) {
        return prisma.absenceRequest.create({ data });
    },

    async getAllRequests(filter = {}) {
        return prisma.absenceRequest.findMany({
            where: filter,
            include: { employee: true }, // Incluir datos del empleado para el admin
            orderBy: { createdAt: 'desc' }
        });
    },

    async getRequestById(id) {
        return prisma.absenceRequest.findUnique({ where: { id } });
    },

    async updateStatus(id, status, adminComment) {
        return prisma.absenceRequest.update({
            where: { id },
            data: { status, adminComment }
        });
    },

    async getByEmployee(employeeId) {
        return prisma.absenceRequest.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' }
        });
    }
};
