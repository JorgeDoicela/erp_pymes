import auditRepository from '../repositories/audit/auditRepository.js';

/**
 * AuditController
 * Expone los logs de auditoría para el frontend administrativo
 */
export const getAuditLogs = async (req, res) => {
    try {
        const { entity, action, performer, limit } = req.query;

        const logs = await auditRepository.getAll({
            entity,
            action,
            performer,
            limit: limit ? parseInt(limit) : 100
        });

        res.json({
            success: true,
            data: logs
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
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial de la entidad'
        });
    }
};
