import { shiftService } from '../../services/attendance/shiftService.js';

const createShift = async (req, res, next) => {
    try {
        const { name, startTime, endTime, breakMinutes, toleranceMinutes } = req.body;
        if (!name || !startTime || !endTime) return res.status(400).json({ success: false, message: 'Faltan datos obligatorios (nombre, hora inicio, hora fin).' });
        const tenantId = req.tenantId || req.user?.tenantId;

        const shift = await shiftService.createShift({ name, startTime, endTime, breakMinutes, toleranceMinutes }, tenantId);
        res.status(201).json({ success: true, data: shift, message: 'Turno creado correctamente' });
    } catch (error) {
        next(error);
    }
};

const updateShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user?.tenantId;
        const updated = await shiftService.updateShift(id, req.body, tenantId);
        res.json({ success: true, data: updated, message: 'Turno actualizado correctamente' });
    } catch (error) {
        next(error);
    }
};

const deleteShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user?.tenantId;
        const deleted = await shiftService.deleteShift(id, tenantId);
        res.json({ success: true, data: deleted, message: 'Turno eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};

const getAllShifts = async (req, res, next) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const shifts = await shiftService.getAllShifts(tenantId);
        res.json({ success: true, data: shifts });
    } catch (error) {
        next(error);
    }
};

const getAllSchedules = async (req, res, next) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const schedules = await shiftService.getAllSchedules(tenantId);
        res.json({ success: true, data: schedules });
    } catch (error) {
        next(error);
    }
};

const deleteSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await shiftService.deleteSchedule(id);
        res.json({ success: true, data: deleted, message: 'Asignación de turno cancelada' });
    } catch (error) {
        next(error);
    }
};

const assignShifts = async (req, res, next) => {
    try {
        const { employeeIds, shiftId, startDate, endDate, daysOfWeek } = req.body;

        if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0 || !shiftId || !startDate) {
            return res.status(400).json({ success: false, message: 'Datos inválidos. Seleccione empleados, turno y fecha de inicio.' });
        }

        const result = await shiftService.assignShiftToEmployees({
            employeeIds,
            shiftId,
            startDate,
            endDate,
            daysOfWeek: daysOfWeek || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
        });

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getEmployeeSchedule = async (req, res, next) => {
    try {
        const { employeeId } = req.params;
        const schedules = await shiftService.getEmployeeSchedule(employeeId);
        res.json({ success: true, data: schedules });
    } catch (error) {
        next(error);
    }
};

export default {
    createShift,
    updateShift,
    deleteShift,
    getAllShifts,
    getAllSchedules,
    deleteSchedule,
    assignShifts,
    getEmployeeSchedule
};
