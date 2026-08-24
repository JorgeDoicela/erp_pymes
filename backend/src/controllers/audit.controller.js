import auditRepository from '../repositories/audit/auditRepository.js';

/**
 * AuditController
 * Expone los logs de auditoría y estadísticas para el frontend administrativo
 */
export const getAuditStats = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const stats = await auditRepository.getAuditStats(tenantId);
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de auditoría'
        });
    }
};

export const getAuditLogs = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const { entity, action, performer, category, page, limit } = req.query;

        const result = await auditRepository.getAll({
            tenantId,
            entity,
            action,
            performer,
            category,
            page,
            limit
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los logs de auditoría'
        });
    }
};

export const getEntityLogs = async (req, res) => {
    try {
        const { entityId } = req.params;
        const logs = await auditRepository.getLogsByEntityId(entityId);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Error fetching entity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial de la entidad'
        });
    }
};
