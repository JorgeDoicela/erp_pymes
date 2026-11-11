/**
 * @file audit.controller.js
 * @description Norma ERP - Controlador de Auditoría
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import auditService from './audit.service.js';

/**
 * Expone estadísticas agregadas de auditoría para el tenant actual.
 */
export const getAuditStats = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const stats = await auditService.getAuditStats(tenantId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de auditoría',
    });
  }
};

/**
 * Expone los logs de auditoría filtrados y paginados.
 */
export const getAuditLogs = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const { entity, action, performer, category, page, limit } = req.query;

    const result = await auditService.getAuditLogs({
      tenantId,
      entity,
      action,
      performer,
      category,
      page,
      limit,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los logs de auditoría',
    });
  }
};

/**
 * Expone el historial de auditoría para una entidad específica.
 */
export const getEntityLogs = async (req, res) => {
  try {
    const { entityId } = req.params;
    const logs = await auditService.getEntityLogs(entityId);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error fetching entity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de la entidad',
    });
  }
};

