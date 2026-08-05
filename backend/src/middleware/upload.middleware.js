import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { STORAGE_CONFIG } from '../config/storage.config.js';

// Ensure uploads directory exists
const uploadDir = STORAGE_CONFIG.PATHS.RESUMES;
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (STORAGE_CONFIG.ALLOWED_RESUME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF'), false);
    }
};

export const uploadResume = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: STORAGE_CONFIG.MAX_FILE_SIZE }
});
