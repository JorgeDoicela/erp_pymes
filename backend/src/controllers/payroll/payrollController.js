import payrollCalculationService from '../../services/payroll/payrollCalculationService.js';

class PayrollController {
    async generate(req, res) {
        try {
            const { month, year } = req.body;
            if (!month || !year) return res.status(400).json({ message: 'Mes y año requeridos' });
            const userId = req.user?.id; // RNF-14 Audit
            const tenantId = req.tenantId || req.user?.tenantId;
            const payroll = await payrollCalculationService.generatePayroll(month, year, userId, tenantId);
            res.status(201).json({ success: true, data: payroll, message: 'Nómina generada correctamente (Borrador)' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const tenantId = req.tenantId || req.user?.tenantId;

            const result = await payrollCalculationService.getPayrolls(page, limit, tenantId);

            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al obtener nóminas' });
        }
    }

    async getMyPayrolls(req, res) {
        try {
            const employeeId = req.user?.employeeId || req.user?.id;
            const payrolls = await payrollCalculationService.getPayrollsByEmployee(employeeId, req.user);
            res.status(200).json({ success: true, data: payrolls });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error al obtener mis pagos' });
        }
    }

    async getById(req, res) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId;
            const payroll = await payrollCalculationService.getPayrollById(req.params.id, tenantId);
            if (!payroll) return res.status(404).json({ message: 'Nómina no encontrada' });
            res.status(200).json({ success: true, data: payroll });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Error al obtener detalle' });
        }
    }

    async confirm(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id; // RNF-14 Audit
            const tenantId = req.tenantId || req.user?.tenantId;
            const payroll = await payrollCalculationService.confirmPayroll(id, userId, tenantId);
            res.status(200).json({ success: true, data: payroll, message: 'Nómina aprobada' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Error al confirmar nómina' });
        }
    }

    async generateBankFile(req, res) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId;
            const fileContent = await payrollCalculationService.generateBankFile(req.params.id, tenantId);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=transferencias.csv');
            res.send(fileContent);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async markAsPaid(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const tenantId = req.tenantId || req.user?.tenantId;
            const payroll = await payrollCalculationService.markAsPaid(id, userId, tenantId);
            res.status(200).json({ success: true, data: payroll, message: 'Pago registrado exitosamente' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateDetail(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user?.id;
            const tenantId = req.tenantId || req.user?.tenantId;
            const result = await payrollCalculationService.updatePayrollDetail(id, req.body, adminId, tenantId);
            res.status(200).json({ success: true, message: 'Detalle de nómina actualizado', data: result });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user?.id;
            const tenantId = req.tenantId || req.user?.tenantId;
            const result = await payrollCalculationService.deletePayroll(id, adminId, tenantId);
            res.status(200).json({ success: true, message: 'Nómina eliminada correctamente', data: result });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async signPayslip(req, res) {
        try {
            const { id } = req.params;
            const employeeId = req.user?.employeeId || req.user?.id;
            const { signatureType, notes, p12Data } = req.body;

            const result = await payrollCalculationService.signPayslip({
                detailId: id,
                employeeId,
                signatureType,
                notes,
                p12Data
            });

            res.status(200).json({
                success: true,
                message: 'Rol de pagos firmado y aprobado con éxito',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({ success: false, message: error.message || 'Error al firmar el rol' });
        }
    }

    async disputePayslip(req, res) {
        try {
            const { id } = req.params;
            const employeeId = req.user?.employeeId || req.user?.id;
            const { reason } = req.body;

            if (!reason) return res.status(400).json({ success: false, message: 'Debe especificar el motivo de la observación' });

            const result = await payrollCalculationService.disputePayslip({
                detailId: id,
                employeeId,
                reason
            });

            res.status(200).json({
                success: true,
                message: 'Observación registrada y notificada a Recursos Humanos',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({ success: false, message: error.message || 'Error al registrar observación' });
        }
    }

    async notifyPendingSignatures(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.tenantId || req.user?.tenantId;
            const result = await payrollCalculationService.notifyPendingSignatures(id, tenantId);

            res.status(200).json({
                success: true,
                message: `Se enviaron ${result.sentCount} recordatorios de firma a colaboradores pendientes`,
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message || 'Error al enviar recordatorios' });
        }
    }
}

export default new PayrollController();
