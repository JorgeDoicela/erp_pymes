import prisma from '../database/db.js';

/**
 * AuditRepository
 * Maneja el registro de auditoría
 */
export class AuditRepository {
    /**
     * Crear registro de auditoría
     * @param {Object} data - Datos del log
     * @param {string} data.entity - Entidad (e.g. 'Employee')
     * @param {string} data.entityId - ID de la entidad
     * @param {string} data.action - Acción (UPDATE, CREATE)
     * @param {string} data.performedBy - Usuario que realizó la acción
     * @param {Object} data.details - Detalle de cambios (se guardará como JSON string)
     * @returns {Promise<Object>} Log creado
     */
    async createLog(data) {
        try {
            const { details, ...rest } = data;
            return await prisma.auditLog.create({
                data: {
                    ...rest,
                    details: JSON.stringify(details),
                },
            });
        } catch (error) {
            console.error('Error creando audit log:', error);
            // No lanzamos error para no detener la operación principal si falla el log
            return null;
        }
    }

    /**
     * Obtener logs por entidad
     * @param {string} entityId - ID de la entidad
     * @returns {Promise<Array>} Logs
     */
    async getLogsByEntityId(entityId) {
        try {
            const logs = await prisma.auditLog.findMany({
                where: { entityId },
                orderBy: { timestamp: 'desc' },
            });

            // Parsear details
            return logs.map(log => ({
                ...log,
                details: JSON.parse(log.details)
            }));
        } catch (error) {
            throw new Error(`Error obteniendo logs: ${error.message}`);
        }
    }
}

export default new AuditRepository();
