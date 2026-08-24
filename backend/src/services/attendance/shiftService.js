import { shiftRepository } from '../../repositories/attendance/shiftRepository.js';

export const shiftService = {
    async createShift(data, tenantId = null) {
        if (!data.name || !data.startTime || !data.endTime) {
            throw new Error('Nombre, hora de inicio y hora de fin son requeridos.');
        }
        return shiftRepository.createShift({
            name: data.name.trim(),
            startTime: data.startTime,
            endTime: data.endTime,
            breakMinutes: parseInt(data.breakMinutes, 10) || 60,
            toleranceMinutes: parseInt(data.toleranceMinutes, 10) || 15
        }, tenantId);
    },

    async updateShift(id, data, tenantId = null) {
        const existing = await shiftRepository.getShiftById(id);
        if (!existing) throw new Error('Turno no encontrado.');

        return shiftRepository.updateShift(id, {
            name: data.name ? data.name.trim() : existing.name,
            startTime: data.startTime || existing.startTime,
            endTime: data.endTime || existing.endTime,
            breakMinutes: data.breakMinutes !== undefined ? parseInt(data.breakMinutes, 10) : existing.breakMinutes,
            toleranceMinutes: data.toleranceMinutes !== undefined ? parseInt(data.toleranceMinutes, 10) : existing.toleranceMinutes
        }, tenantId);
    },

    async deleteShift(id, tenantId = null) {
        const existing = await shiftRepository.getShiftById(id);
        if (!existing) throw new Error('Turno no encontrado.');
        return shiftRepository.deleteShift(id, tenantId);
    },

    async getAllShifts(tenantId = null) {
        return shiftRepository.getAllShifts(tenantId);
    },

    async getAllSchedules(tenantId = null) {
        return shiftRepository.getAllSchedules(tenantId);
    },

    async deleteSchedule(id) {
        return shiftRepository.deleteSchedule(id);
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
