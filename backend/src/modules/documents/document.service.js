/**
 * @file document.service.js
 * @description Servicio de aplicación y dominio para gestión documental de colaboradores (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import documentRepository from './document.repository.js';
import fs from 'fs';
import path from 'path';

export class DocumentService {
  async uploadDocument(data) {
    return await documentRepository.create(data);
  }

  async getDocumentsByEmployee(employeeId) {
    return await documentRepository.findByEmployeeId(employeeId);
  }

  async deleteDocument(id) {
    const document = await documentRepository.findById(id);
    if (!document) {
      throw new Error('Documento no encontrado');
    }

    // Delete file from filesystem
    const filePath = path.resolve('uploads/documents', document.documentUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    return await documentRepository.delete(id);
  }
}

export default new DocumentService();
