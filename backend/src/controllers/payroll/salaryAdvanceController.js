import salaryAdvanceService from '../../services/payroll/salaryAdvanceService.js';

export const requestAdvance = async (req, res) => {
    try {
        const employeeId = req.user.employeeId || req.user.id;
        const { amount, installments, reason } = req.body;

        const advance = await salaryAdvanceService.requestAdvance({
            employeeId,
            amount,
            installments,
            reason
        });

        return res.status(201).json({
            success: true,
            message: 'Solicitud de anticipo registrada exitosamente',
            data: advance
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al procesar la solicitud de anticipo'
        });
    }
};

export const getAdvances = async (req, res) => {
    try {
        const { page, limit, status, employeeId, search } = req.query;
        const result = await salaryAdvanceService.getAdvances({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            status,
            employeeId,
            search
        });

        return res.json({
            success: true,
            ...result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener anticipos'
        });
    }
};

export const getMyAdvances = async (req, res) => {
    try {
        const employeeId = req.user.employeeId || req.user.id;
        const advances = await salaryAdvanceService.getMyAdvances(employeeId);

        return res.json({
            success: true,
            data: advances
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener tus anticipos'
        });
    }
};

export const approveAdvance = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        const updated = await salaryAdvanceService.approveAdvance(id, adminId);
        return res.json({
            success: true,
            message: 'Anticipo aprobado exitosamente',
            data: updated
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al aprobar anticipo'
        });
    }
};

export const rejectAdvance = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        const adminId = req.user.id;

        const updated = await salaryAdvanceService.rejectAdvance(id, rejectionReason, adminId);
        return res.json({
            success: true,
            message: 'Anticipo rechazado',
            data: updated
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al rechazar anticipo'
        });
    }
};

export const cancelAdvance = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId || req.user.id;

        const cancelled = await salaryAdvanceService.cancelAdvance(id, employeeId);
        return res.json({
            success: true,
            message: 'Solicitud cancelada',
            data: cancelled
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al cancelar solicitud'
        });
    }
};
