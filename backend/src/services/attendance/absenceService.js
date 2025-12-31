import { absenceRepository } from '../../repositories/attendance/absenceRepository.js';

export const absenceService = {
    async createRequest({ employeeId, type, startDate, endDate, reason, file }) {
        const data = {
            employeeId,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            status: 'PENDING',
            evidenceUrl: file ? file.filename : null // Guardamos solo el nombre del archivo
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

        // 2. Actualizar estado
        const updated = await absenceRepository.updateStatus(id, status, adminComment);

        // TODO: Si es APPROVED, aquí podríamos generar automáticamente los registros 
        // de Attendance con status 'JUSTIFIED' para ese rango de fechas.
        // Por ahora lo dejaremos solo como actualización de estado.

        return updated;
    }
};
