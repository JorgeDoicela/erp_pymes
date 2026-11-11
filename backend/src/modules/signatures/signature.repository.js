/**
 * @file signature.repository.js
 * @description Repositorio de persistencia y trazabilidad de firmas electrónicas y sellos QR (Norma ERP).
 * Encapsula la interacción con la base de datos para auditoría y metadata de firmas sobre documentos.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class SignatureRepository {
  /**
   * Registrar evento de auditoría criptográfica de firma
   * @param {Object} data - Datos de auditoría de firma
   */
  async logSignatureEvent({ entityId, performedBy, action, details, ip, tenantId }) {
    return prisma.auditLog.create({
      data: {
        entity: 'ElectronicSignature',
        entityId: String(entityId || '0'),
        action: action || 'SIGNATURE_APPLIED',
        performedBy: performedBy || 'System',
        details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
        ip: ip || null,
        tenantId: tenantId || null,
      },
    });
  }

  /**
   * Buscar documento por ID para verificación de integridad de firma
   * @param {string} documentId
   */
  async findDocumentForSignatureVerification(documentId) {
    return prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        type: true,
        fileUrl: true,
        employeeId: true,
        tenantId: true,
        createdAt: true,
      },
    });
  }
}

export const signatureRepository = new SignatureRepository();
export default signatureRepository;
