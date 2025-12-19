import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import documentController from '../../controllers/documents/documentController.js';

const router = Router();

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/documents';
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
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato no permitido. Solo PDF, JPG, PNG.'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Rutas
router.post('/', upload.single('document'), documentController.upload);
router.get('/employee/:employeeId', documentController.getByEmployee);
router.delete('/:id', documentController.delete);
router.get('/download/:filename', documentController.download);

export default router;
