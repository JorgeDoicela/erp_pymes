import path from 'path';

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
        DOCUMENTS: process.env.VERCEL ? '/tmp/uploads/documents' : path.resolve(process.cwd(), 'backend/uploads/documents'),
        RESUMES: process.env.VERCEL ? '/tmp/uploads/resumes' : path.resolve(process.cwd(), 'backend/uploads/resumes'),
        EVIDENCE: process.env.VERCEL ? '/tmp/uploads/evidence' : path.resolve(process.cwd(), 'backend/uploads/evidence')
    }
};
