import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import documentController from '../../controllers/documents/documentController.js';
import { STORAGE_CONFIG } from '../../config/storage.config.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = STORAGE_CONFIG.PATHS.DOCUMENTS;
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (STORAGE_CONFIG.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato no permitido. Solo PDF, JPG, PNG.'));
        }
    },
    limits: { fileSize: STORAGE_CONFIG.MAX_FILE_SIZE } // 5MB limit consolidated
});

// Rutas
router.post('/', authenticate, authorize(['admin', 'hr', 'employee']), upload.single('document'), documentController.upload);
router.get('/employee/:employeeId', authenticate, authorize(['admin', 'hr', 'employee']), documentController.getByEmployee);
router.delete('/:id', authenticate, authorize(['admin', 'hr', 'employee']), documentController.delete);
router.get('/download/:filename', authenticate, documentController.download);

export default router;
