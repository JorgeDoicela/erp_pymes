import payrollConfigService from '../../services/payroll/payrollConfigService.js';

class PayrollConfigController {
    async getConfig(req, res) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId;
            const config = await payrollConfigService.getConfig(tenantId);
            res.status(200).json({ success: true, data: config });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error al obtener configuración de nómina' });
        }
    }

    async createConfig(req, res) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId;
            const newConfig = await payrollConfigService.createConfig(req.body, tenantId);
            res.status(201).json({ success: true, data: newConfig, message: 'Configuración guardada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error al guardar configuración' });
        }
    }
}

export default new PayrollConfigController();
