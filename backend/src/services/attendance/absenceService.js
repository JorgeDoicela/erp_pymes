import { absenceRepository } from '../../repositories/attendance/absenceRepository.js';
import prisma from '../../database/db.js';

export const absenceService = {
    async createRequest({ employeeId, type, startDate, endDate, reason, file }) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Validación de Vacaciones (Robust comparison)
        const cleanType = type.trim();
        console.log(`[DEBUG] createRequest: Type='${type}', Clean='${cleanType}'`);

        if (cleanType === 'Vacaciones') {
            const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
            if (!employee) throw new Error('Empleado no encontrado');

            console.log(`[DEBUG] Solicito Vacaciones. Balance actual: ${employee.vacationDays}. Días pedidos: ${daysRequested}`);

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

        // Si ya estaba aprobado no hacemos nada (o podríamos manejar reversión si rechazamos)
        if (request.status === 'APPROVED' && status === 'APPROVED') {
            return request;
        }

        // Transacción para aprobar vacaciones
        const requestType = request.type.trim();
        console.log(`[DEBUG] updateRequestStatus: Status=${status}, Type='${request.type}', Clean='${requestType}'`);

        if (status === 'APPROVED' && requestType === 'Vacaciones') {
            return prisma.$transaction(async (tx) => {
                const start = new Date(request.startDate);
                const end = new Date(request.endDate);
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                // Verificar saldo nuevamente por seguridad
                const employee = await tx.employee.findUnique({ where: { id: request.employeeId } });

                console.log(`[DEBUG] Aprobando Vacaciones. Balance: ${employee.vacationDays}. Descontando: ${days}`);

                if (employee.vacationDays < days) {
                    throw new Error(`No se puede aprobar: Saldo insuficiente (${employee.vacationDays} días).`);
                }

                // Restar días
                await tx.employee.update({
                    where: { id: request.employeeId },
                    data: { vacationDays: { decrement: days } }
                });

                // Actualizar solicitud
                return tx.absenceRequest.update({
                    where: { id },
                    data: { status, adminComment }
                });
            });
        }

        // Flujo normal (sin transacción compleja)
        return absenceRepository.updateStatus(id, status, adminComment);
    }
};
