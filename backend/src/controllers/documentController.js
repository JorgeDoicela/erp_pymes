import documentService from '../services/documentService.js';
import path from 'path';

class DocumentController {
    async upload(req, res) {
        try {
            const { employeeId, type, expiryDate } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
            }

            const documentData = {
                employeeId,
                type,
                documentUrl: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                expiryDate: expiryDate ? new Date(expiryDate) : null
            };

            const document = await documentService.uploadDocument(documentData);

            res.status(201).json({
                success: true,
                data: document,
                message: 'Documento subido exitosamente'
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getByEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const documents = await documentService.getDocumentsByEmployee(employeeId);
            res.json({ success: true, data: documents });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await documentService.deleteDocument(id);
            res.json({ success: true, message: 'Documento eliminado correctamente' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async download(req, res) {
        try {
            const { filename } = req.params;
            if (filename.includes('..')) {
                return res.status(400).send('Nombre de archivo inválido');
            }

            const filePath = path.resolve('uploads/documents', filename);
            res.download(filePath);
        } catch (error) {
            res.status(404).json({ success: false, message: 'Archivo no encontrado' });
        }
    }
}

export default new DocumentController();
