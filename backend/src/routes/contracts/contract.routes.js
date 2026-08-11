import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import contractController from '../../controllers/contracts/contractController.js';

import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/contracts';
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
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Rutas
router.post('/', authenticate, authorize(['admin', 'hr']), upload.single('document'), contractController.create);
router.get('/expiring', authenticate, authorize(['admin', 'hr']), contractController.getExpiring);
router.get('/employee/:employeeId', authenticate, authorize(['admin', 'hr', 'accounting', 'employee']), contractController.getByEmployee);
router.get('/download/:filename', authenticate, contractController.downloadContract);

export default router;
