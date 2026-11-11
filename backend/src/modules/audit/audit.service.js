/**
 * @file audit.service.js
 * @description Norma ERP - Servicio de Dominio de Auditoría
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import auditRepository from './audit.repository.js';

/**
 * Orquesta consultas y registro de eventos de auditoría.
 */
export class AuditService {
  async log(data) {
    return auditRepository.log(data);
  }

  async getAuditStats(tenantId = null) {
    return auditRepository.getAuditStats(tenantId);
  }

  async getAuditLogs(filters = {}) {
    return auditRepository.getAll(filters);
  }

  async getEntityLogs(entityId, limit = 100) {
    return auditRepository.getLogsByEntityId(entityId, limit);
  }
}

export default new AuditService();

