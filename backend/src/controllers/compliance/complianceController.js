import complianceService from '../../services/compliance/complianceService.js';
import statutoryBenefitsService from '../../services/compliance/statutoryBenefitsService.js';

export const getComplianceAlerts = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const result = await complianceService.getComplianceAlerts(tenantId);
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Error al obtener alertas de cumplimiento' });
    }
};

export const getStatutoryProvisions = async (req, res) => {
    try {
        const { month, year } = req.query;
        const tenantId = req.tenantId || req.user?.tenantId;
        const result = await statutoryBenefitsService.calculateStatutoryProvisions(
            month ? parseInt(month) : undefined,
            year ? parseInt(year) : undefined,
            tenantId
        );
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Error al calcular provisiones sociales' });
    }
};
