import { shiftRepository } from '../../repositories/attendance/shiftRepository.js';

export const shiftService = {
    async createShift(data, tenantId = null) {
        return shiftRepository.createShift(data, tenantId);
    },

    async getAllShifts(tenantId = null) {
        return shiftRepository.getAllShifts(tenantId);
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

        // Cargar todos los solapamientos de la lista de empleados en 1 sola consulta
        const allOverlaps = await shiftRepository.findOverlappingSchedulesForMany(employeeIds, start, end);
        const overlapsByEmployee = new Map();
        allOverlaps.forEach(ov => {
            if (!overlapsByEmployee.has(ov.employeeId)) overlapsByEmployee.set(ov.employeeId, []);
            overlapsByEmployee.get(ov.employeeId).push(ov);
        });

        const newDays = Array.isArray(daysOfWeek) ? daysOfWeek : JSON.parse(daysOfWeek);

        for (const empId of employeeIds) {
            try {
                const overlaps = overlapsByEmployee.get(empId) || [];

                if (overlaps.length > 0) {
                    const actualConflicts = overlaps.filter(existing => {
                        try {
                            const existingDays = typeof existing.daysOfWeek === 'string'
                                ? JSON.parse(existing.daysOfWeek)
                                : existing.daysOfWeek;

                            const hasCommonDay = newDays.some(day => existingDays.includes(day));
                            return hasCommonDay;
                        } catch (e) {
                            return true;
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
                    daysOfWeek: JSON.stringify(daysOfWeek),
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
