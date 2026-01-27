import { attendanceService } from '../../services/attendance/attendanceService.js';

const markAttendance = async (req, res, next) => {
    try {
        const { employeeId, type, location } = req.body;

        if (!employeeId || !type) {
            return res.status(400).json({
                success: false,
                message: 'employeeId y type (ENTRY/EXIT) son requeridos'
            });
        }

        const start = Date.now();
        const result = await attendanceService.registerAttendance(employeeId, type, location);
        const duration = Date.now() - start;

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.record,
            workedHours: result.workedHours, // Puede ser undefined si es ENTRY
            meta: {
                latency: `${duration}ms`
            }
        });

    } catch (error) {
        // Si es un error de negocio (validación), 400. Si es interno, 500.
        // Por simplicidad, si el mensaje es conocido enviamos 400.
        if (error.message.includes('Ya se ha registrado') || error.message.includes('Debe registrar entrada')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

const getStatus = async (req, res, next) => {
    try {
        const { employeeId } = req.params;
        const status = await attendanceService.getStatus(employeeId);
        res.json({ success: true, data: status });
    } catch (error) {
        next(error);
    }
};

export default {
    markAttendance,
    getStatus
};
