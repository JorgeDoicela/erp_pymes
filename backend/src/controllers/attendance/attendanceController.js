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

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const start = Date.now();
        const result = await attendanceService.registerAttendance(employeeId, type, location, ip);
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
        // Validation/Business errors (400) vs Internal errors (500)
        const businessErrors = [
            'Ubicación no permitida',
            'La ubicación es requerida',
            'Conexión no permitida',
            'Ya se ha registrado',
            'Debe registrar entrada',
            'No se encontró registro de entrada',
            'Tipo de registro no válido',
            'No ha iniciado el almuerzo',
            'Ya ha iniciado un inicio de almuerzo',
            'Ya ha finalizado su almuerzo'
        ];

        const isBusinessError = businessErrors.some(msg => error.message.includes(msg));

        if (isBusinessError || error.message.includes('No se encontró empleado') || error.message.includes('Empleado no encontrado')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error('[ATTENDANCE] Unexpected Server Error:', error);
        next(error);
    }
};

const getStatus = async (req, res, next) => {
    try {
        const { employeeId } = req.params;
        const status = await attendanceService.getStatus(employeeId);
        res.json({ success: true, data: status });
    } catch (error) {
        console.error('Error en getStatus:', error);

        if (error.message.includes('Empleado no encontrado') || error.message.includes('No se encontró empleado')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    }
};

export default {
    markAttendance,
    getStatus
};
