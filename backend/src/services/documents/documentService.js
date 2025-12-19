import documentRepository from '../../repositories/documents/documentRepository.js';
import fs from 'fs';
import path from 'path';

class DocumentService {
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
                // Continue to delete record from DB even if file deletion fails
            }
        }

        return await documentRepository.delete(id);
    }
}

export default new DocumentService();
