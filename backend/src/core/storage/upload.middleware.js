/**
 * @file upload.middleware.js
 * @description Configuración de Multer para la carga controlada de archivos y CVs en memoria (Norma ERP Core Storage).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import multer from 'multer';
import fs from 'fs';
import { STORAGE_CONFIG } from '../../config/storage.config.js';

// Asegurar existencia de directorio de carga
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
  limits: { fileSize: STORAGE_CONFIG.MAX_FILE_SIZE },
});

export default {
  uploadResume,
};
