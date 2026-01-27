import payrollCalculationService from '../../services/payroll/payrollCalculationService.js';

class PayrollController {
    async generate(req, res) {
        try {
            const { month, year } = req.body;
            if (!month || !year) return res.status(400).json({ message: 'Mes y año requeridos' });
            const userId = req.user?.id; // RNF-14 Audit
            const payroll = await payrollCalculationService.generatePayroll(month, year, userId);
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

            const result = await payrollCalculationService.getPayrolls(page, limit);

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
            const payrolls = await payrollCalculationService.getPayrollsByEmployee(req.user.id);
            res.status(200).json({ success: true, data: payrolls });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error al obtener mis pagos' });
        }
    }

    async getById(req, res) {
        try {
            const payroll = await payrollCalculationService.getPayrollById(req.params.id);
            if (!payroll) return res.status(404).json({ message: 'Nómina no encontrada' });
            res.status(200).json({ success: true, data: payroll });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al obtener detalle' });
        }
    }

    async confirm(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id; // RNF-14 Audit
            const payroll = await payrollCalculationService.confirmPayroll(id, userId);
            res.status(200).json({ success: true, data: payroll, message: 'Nómina aprobada' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al confirmar nómina' });
        }
    }

    async generateBankFile(req, res) {
        try {
            const fileContent = await payrollCalculationService.generateBankFile(req.params.id);
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
            const payroll = await payrollCalculationService.markAsPaid(id, userId);
            res.status(200).json({ success: true, data: payroll, message: 'Pago registrado exitosamente' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new PayrollController();
