import path from 'path';
import fs from 'fs';

/**
 * Resuelve la ruta absoluta de almacenamiento según el entorno (Vercel, Docker /app, Local backend)
 */
const resolveUploadPath = (folder) => {
    if (process.env.VERCEL) {
        return `/tmp/uploads/${folder}`;
    }
    const cwd = process.cwd();
    // 1. Si cwd ya contiene carpeta uploads (ej: en Docker /app/uploads o local backend/uploads)
    if (fs.existsSync(path.resolve(cwd, 'uploads'))) {
        return path.resolve(cwd, 'uploads', folder);
    }
    // 2. Si cwd está en la raíz del monorepo y contiene backend/uploads
    if (fs.existsSync(path.resolve(cwd, 'backend/uploads'))) {
        return path.resolve(cwd, 'backend/uploads', folder);
    }
    // Fallback según cwd
    return cwd.endsWith('backend') 
        ? path.resolve(cwd, 'uploads', folder) 
        : path.resolve(cwd, 'backend/uploads', folder);
};

/**
 * RNF-16: Configuración de Almacenamiento
 */
export const STORAGE_CONFIG = {
    // Límite individual de archivo: 4MB (Vercel tiene un límite rígido de 4.5MB en su capa de API)
    MAX_FILE_SIZE: 4 * 1024 * 1024,

    // Extensiones permitidas por tipo
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    ALLOWED_RESUME_TYPES: ['application/pdf'],

    // Rutas de almacenamiento
    PATHS: {
        DOCUMENTS: resolveUploadPath('documents'),
        RESUMES: resolveUploadPath('resumes'),
        EVIDENCE: resolveUploadPath('evidence')
    }
};

