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
                    // Si hay solapamiento, verificar si los días de la semana chocan
                    // Por simplicidad, asumimos choque si hay solapamiento de fechas.
                    // Una mejora sería parsear daysOfWeek y comparar.
                    // RF dice: "Sistema valida no sobreposición de turnos"
                    throw new Error(`El empleado ya tiene un turno asignado en ese rango de fechas (${overlaps[0].shift.name}).`);
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
