import { shiftRepository } from '../../repositories/attendance/shiftRepository.js';

export const shiftService = {
    async createShift(data) {
        return shiftRepository.createShift(data);
    },

    async getAllShifts() {
        return shiftRepository.getAllShifts();
    },

    async assignShiftToEmployees({ employeeIds, shiftId, startDate, endDate, daysOfWeek }) {
        // Validar que el turno exista
        const shift = await shiftRepository.getShiftById(shiftId);
        if (!shift) throw new Error('El turno especificado no existe.');

        const results = {
            success: [],
            errors: []
        };

        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;

        for (const empId of employeeIds) {
            try {
                // Validar solapamiento
                const overlaps = await shiftRepository.findOverlappingSchedules(empId, start, end);

                if (overlaps.length > 0) {
                    // Validacion granular: Verificar si los dias especificos chocan
                    const newDays = Array.isArray(daysOfWeek) ? daysOfWeek : JSON.parse(daysOfWeek);

                    const actualConflicts = overlaps.filter(existing => {
                        try {
                            const existingDays = typeof existing.daysOfWeek === 'string'
                                ? JSON.parse(existing.daysOfWeek)
                                : existing.daysOfWeek;

                            // Verificar interseccion
                            const hasCommonDay = newDays.some(day => existingDays.includes(day));
                            return hasCommonDay;
                        } catch (e) {
                            return true; // Si falla el parseo, asumimos conflicto por seguridad
                        }
                    });

                    if (actualConflicts.length > 0) {
                        throw new Error(`El empleado ya tiene un turno asignado los mismos días (${actualConflicts[0].shift.name}).`);
                    }
                }

                const assignment = await shiftRepository.createSchedule({
                    employeeId: empId,
                    shiftId,
                    startDate: start,
                    endDate: end,
                    daysOfWeek: JSON.stringify(daysOfWeek), // e.g. ["Monday", "Wednesday"]
                });

                results.success.push({ employeeId: empId, assignmentId: assignment.id });

            } catch (error) {
                results.errors.push({ employeeId: empId, message: error.message });
            }
        }

        return results;
    },

    async getEmployeeSchedule(employeeId) {
        return shiftRepository.getSchedulesByEmployee(employeeId);
    }
};
