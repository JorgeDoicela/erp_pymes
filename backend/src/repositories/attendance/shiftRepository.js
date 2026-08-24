import prisma from '../../database/db.js';

export const shiftRepository = {
    // --- SHIFTS ---
    async createShift(data, tenantId = null) {
        return prisma.shift.create({
            data: {
                ...data,
                ...(tenantId ? { tenantId } : {})
            }
        });
    },

    async getAllShifts(tenantId = null) {
        return prisma.shift.findMany({
            where: tenantId ? { tenantId } : {}
        });
    },

    async getShiftById(id) {
        return prisma.shift.findUnique({ where: { id } });
    },

    async updateShift(id, data, tenantId = null) {
        return prisma.shift.update({
            where: { id },
            data
        });
    },

    async deleteShift(id, tenantId = null) {
        return prisma.shift.delete({
            where: { id }
        });
    },

    // --- SCHEDULES ---
    async createSchedule(data) {
        return prisma.employeeSchedule.create({ data });
    },

    async getAllSchedules(tenantId = null) {
        return prisma.employeeSchedule.findMany({
            where: {
                isActive: true,
                ...(tenantId ? { employee: { tenantId } } : {})
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        department: true,
                        position: true
                    }
                },
                shift: true
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    async deleteSchedule(id) {
        return prisma.employeeSchedule.update({
            where: { id },
            data: { isActive: false }
        });
    },

    // Buscar horarios de un empleado que se solapen con un rango de fechas
    // y que estén activos
    async findOverlappingSchedules(employeeId, startDate, endDate) {
        const where = {
            employeeId,
            isActive: true,
            // (StartA <= EndB) and (EndA >= StartB)
            // Nuestra logica: Si nuevo rango es S2-E2.
            // Solapamiento si: S1 <= E2 AND (E1 es null OR E1 >= S2)
            AND: [
                { startDate: { lte: endDate || new Date(2100, 0, 1) } }, // endDate puede ser null (indefinido) -> infinito
                {
                    OR: [
                        { endDate: null }, // Si el existente es indefinido, solapa seguro a menos que S1 > E2 (ya cubierto arriba?)
                        { endDate: { gte: startDate } }
                    ]
                }
            ]
        };

        return prisma.employeeSchedule.findMany({
            where,
            include: { shift: true }
        });
    },

    async findOverlappingSchedulesForMany(employeeIds, startDate, endDate) {
        const where = {
            employeeId: { in: employeeIds },
            isActive: true,
            AND: [
                { startDate: { lte: endDate || new Date(2100, 0, 1) } },
                {
                    OR: [
                        { endDate: null },
                        { endDate: { gte: startDate } }
                    ]
                }
            ]
        };

        return prisma.employeeSchedule.findMany({
            where,
            include: { shift: true }
        });
    },

    async getSchedulesByEmployee(employeeId) {
        return prisma.employeeSchedule.findMany({
            where: { employeeId, isActive: true },
            include: { shift: true }
        });
    }
};
