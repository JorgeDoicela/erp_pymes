import { shiftService } from '../../services/attendance/shiftService.js';

const createShift = async (req, res, next) => {
    try {
        const { name, startTime, endTime } = req.body;
        if (!name || !startTime || !endTime) return res.status(400).json({ message: 'Faltan datos.' });

        const shift = await shiftService.createShift({ name, startTime, endTime });
        res.status(201).json({ success: true, data: shift });
    } catch (error) {
        next(error);
    }
};

const getAllShifts = async (req, res, next) => {
    try {
        const shifts = await shiftService.getAllShifts();
        res.json({ success: true, data: shifts });
    } catch (error) {
        next(error);
    }
};

const assignShifts = async (req, res, next) => {
    try {
        const { employeeIds, shiftId, startDate, endDate, daysOfWeek } = req.body;

        if (!employeeIds || !Array.isArray(employeeIds) || !shiftId || !startDate) {
            return res.status(400).json({ message: 'Datos inválidos. Recuerde: employeeIds es array.' });
        }

        const result = await shiftService.assignShiftToEmployees({
            employeeIds,
            shiftId,
            startDate,
            endDate,
            daysOfWeek: daysOfWeek || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] // Default
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
    getAllShifts,
    assignShifts,
    getEmployeeSchedule
};
