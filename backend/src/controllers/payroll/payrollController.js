import payrollCalculationService from '../../services/payroll/payrollCalculationService.js';

class PayrollController {
    async generate(req, res) {
        try {
            const { month, year } = req.body;
            if (!month || !year) return res.status(400).json({ message: 'Mes y año requeridos' });

            const payroll = await payrollCalculationService.generatePayroll(month, year);
            res.status(201).json({ success: true, data: payroll, message: 'Nómina generada correctamente (Borrador)' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const payrolls = await payrollCalculationService.getPayrolls();
            res.status(200).json({ success: true, data: payrolls });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al obtener nóminas' });
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
            const payroll = await payrollCalculationService.confirmPayroll(req.params.id);
            res.status(200).json({ success: true, data: payroll, message: 'Nómina aprobada' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al confirmar nómina' });
        }
    }
}

export default new PayrollController();
