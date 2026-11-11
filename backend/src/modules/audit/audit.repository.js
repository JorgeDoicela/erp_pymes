/**
 * @file audit.repository.js
 * @description Norma ERP - Repositorio de Auditoría (RNF-14)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

const AUTH_OR = [
  { entity: 'Auth' },
  { action: { contains: 'LOGIN' } },
  { action: { contains: 'PASSWORD' } },
];

const PAYROLL_OR = [
  { entity: 'Payroll' },
  { entity: 'SalaryAdvance' },
  { entity: 'EmployeeBenefit' },
];

const EMPLOYEE_OR = [
  { entity: 'Employee' },
  { entity: 'Contract' },
  { entity: 'Absence' },
  { entity: 'JobVacancy' },
  { entity: 'JobApplication' },
];

const KNOWN_ENTITIES = [
  'Auth',
  'Payroll',
  'SalaryAdvance',
  'EmployeeBenefit',
  'Employee',
  'Contract',
  'Absence',
  'JobVacancy',
  'JobApplication',
];

/**
 * Maneja el registro y consulta de logs de auditoría (RNF-14).
 */
export class AuditRepository {
  /**
   * Crear un nuevo registro de auditoría unificado.
   * Soporta { action, entity, entityId, userId, performedBy, details, ip, tenantId }.
   */
  async log(data) {
    try {
      const { action, entity, entityId, userId, performedBy, details, ip, tenantId } = data;

      const performerVal = performedBy || userId || 'Sistema';
      const performerStr =
        typeof performerVal === 'object' ? JSON.stringify(performerVal) : String(performerVal);

      const detailsStr =
        details !== undefined && details !== null
          ? typeof details === 'object'
            ? JSON.stringify(details)
            : String(details)
          : null;

      return await prisma.auditLog.create({
        data: {
          tenantId: tenantId || null,
          entity: entity ? String(entity) : 'System',
          entityId: entityId !== undefined && entityId !== null ? String(entityId) : '0',
          action: action ? String(action) : 'ACTION',
          performedBy: performerStr,
          details: detailsStr,
          ip: ip || null,
        },
      });
    } catch (error) {
      console.error('Error in auditRepository.log:', error);
      // No lanzamos error para no romper el flujo de la transacción o servicio principal
      return null;
    }
  }

  /**
   * Alias retrocompatible para createLog.
   */
  async createLog(data) {
    return this.log(data);
  }

  /**
   * Obtener estadísticas agregadas de auditoría para un tenant.
   */
  async getAuditStats(tenantId = null) {
    const where = tenantId ? { tenantId } : {};

    const [totalLogs, authLogs, payrollLogs, employeeLogs, systemLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, OR: AUTH_OR } }),
      prisma.auditLog.count({ where: { ...where, OR: PAYROLL_OR } }),
      prisma.auditLog.count({ where: { ...where, OR: EMPLOYEE_OR } }),
      prisma.auditLog.count({ where: { ...where, entity: { notIn: KNOWN_ENTITIES } } }),
    ]);

    return {
      totalLogs,
      authLogs,
      payrollLogs,
      employeeLogs,
      systemLogs,
    };
  }

  /**
   * Obtener logs con filtros y paginación.
   */
  async getAll(filters = {}) {
    const { entity, action, performer, category, tenantId, page = 1, limit = 50 } = filters;

    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (performer) where.performedBy = { contains: performer.trim(), mode: 'insensitive' };

    if (category === 'AUTH') {
      where.OR = AUTH_OR;
    } else if (category === 'PAYROLL') {
      where.OR = PAYROLL_OR;
    } else if (category === 'EMPLOYEE') {
      where.OR = EMPLOYEE_OR;
    } else if (category === 'SYSTEM') {
      where.entity = { notIn: KNOWN_ENTITIES };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Obtener logs específicos de una entidad.
   */
  async getLogsByEntityId(entityId, limit = 100) {
    return await prisma.auditLog.findMany({
      where: { entityId: String(entityId) },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
    });
  }
}

export default new AuditRepository();

