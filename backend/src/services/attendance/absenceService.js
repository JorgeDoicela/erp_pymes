import { absenceRepository } from '../../repositories/attendance/absenceRepository.js';
import prisma from '../../database/db.js';

export const absenceService = {
    async createRequest({ employeeId, type, startDate, endDate, reason, file }) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const cleanStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const cleanEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const daysRequested = Math.max(1, Math.round((cleanEnd - cleanStart) / (1000 * 60 * 60 * 24)) + 1);

        if (end < start) {
            throw new Error('La fecha de fin de la ausencia no puede ser anterior a la fecha de inicio');
        }

        // Detección de solapamiento de ausencias
        const existingOverlap = await prisma.absenceRequest.findFirst({
            where: {
                employeeId,
                status: { in: ['PENDING', 'APPROVED'] },
                startDate: { lte: end },
                endDate: { gte: start }
            }
        });

        if (existingOverlap) {
            throw new Error('El empleado ya cuenta con una solicitud de ausencia en este rango de fechas.');
        }

        // Validación de Vacaciones (Robust comparison)
        const cleanType = type.trim();

        if (['Vacaciones', 'VACATION', 'vacaciones'].some(t => t.toLowerCase() === cleanType.toLowerCase())) {
            const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
            if (!employee) throw new Error('Empleado no encontrado');

            if (employee.vacationDays < daysRequested) {
                throw new Error(`Saldo insuficiente. Tienes ${employee.vacationDays} días, solicitaste ${daysRequested}.`);
            }
        }

        const data = {
            employeeId,
            type,
            startDate: start,
            endDate: end,
            reason,
            status: 'PENDING',
            evidenceUrl: file ? file.filename : null
        };

        return absenceRepository.createRequest(data);
    },

    async getAllRequests(filter) {
        return absenceRepository.getAllRequests(filter);
    },

    async getEmployeeRequests(employeeId) {
        return absenceRepository.getByEmployee(employeeId);
    },

    async updateRequestStatus(id, status, adminComment) {
        // 1. Validar que exista
        const request = await absenceRepository.getRequestById(id);
        if (!request) throw new Error('Solicitud no encontrada');

        if (request.status === status) {
            return request;
        }

        const requestType = request.type.trim();
        const isVacation = ['Vacaciones', 'VACATION', 'vacaciones'].includes(requestType);

        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        const cleanStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const cleanEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const days = Math.max(1, Math.round((cleanEnd - cleanStart) / (1000 * 60 * 60 * 24)) + 1);

        // Aprobar vacaciones -> Restar días
        if (status === 'APPROVED' && isVacation && request.status !== 'APPROVED') {
            return prisma.$transaction(async (tx) => {
                const employee = await tx.employee.findUnique({ where: { id: request.employeeId } });

                if (employee.vacationDays < days) {
                    throw new Error(`No se puede aprobar: Saldo insuficiente (${employee.vacationDays} días).`);
                }

                await tx.employee.update({
                    where: { id: request.employeeId },
                    data: { vacationDays: { decrement: days } }
                });

                return tx.absenceRequest.update({
                    where: { id },
                    data: { status, adminComment }
                });
            });
        }

        // Revertir aprobación previa de vacaciones -> Reintegrar días
        if (request.status === 'APPROVED' && ['REJECTED', 'CANCELLED'].includes(status) && isVacation) {
            return prisma.$transaction(async (tx) => {
                await tx.employee.update({
                    where: { id: request.employeeId },
                    data: { vacationDays: { increment: days } }
                });

                return tx.absenceRequest.update({
                    where: { id },
                    data: { status, adminComment }
                });
            });
        }

        // Flujo normal
        return absenceRepository.updateStatus(id, status, adminComment);
    }
};
