import prisma from '../../database/db.js';

/**
 * AuditRepository
 * Maneja el registro y consulta de logs de auditoría (RNF-14)
 */
class AuditRepository {
    /**
     * Crear un nuevo registro de auditoría
     * @param {Object} data - Datos del log
     */
    async createLog({ entity, entityId, action, performedBy, details }) {
        try {
            // Asegurarse de que el performedBy sea un String (puede venir como ID o Nombre)
            const performer = typeof performedBy === 'object' ? JSON.stringify(performedBy) : String(performedBy);

            // Asegurarse de que details sea String
            const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details);

            return await prisma.auditLog.create({
                data: {
                    entity,
                    entityId: String(entityId),
                    action,
                    performedBy: performer,
                    details: detailsStr
                }
            });
        } catch (error) {
            console.error('Error creating audit log:', error);
            // No lanzamos error para no romper el flujo principal si falla la auditoría
            return null;
        }
    }

    /**
     * Obtener logs con filtros
     * @param {Object} filters - Filtros de búsqueda
     */
    async getAll(filters = {}) {
        const { entity, action, performer, limit = 100 } = filters;

        const where = {};
        if (entity) where.entity = entity;
        if (action) where.action = action;
        if (performer) where.performedBy = { contains: performer, mode: 'insensitive' };

        return await prisma.auditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: Number(limit)
        });
    }

    /**
     * Obtener logs específicos de una entidad
     */
    async getLogsByEntityId(entityId) {
        return await prisma.auditLog.findMany({
            where: { entityId: String(entityId) },
            orderBy: { timestamp: 'desc' }
        });
    }
}

export default new AuditRepository();
