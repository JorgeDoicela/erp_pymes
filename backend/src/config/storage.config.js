
/**
 * RNF-16: Configuración de Almacenamiento
 */
export const STORAGE_CONFIG = {
    // Límite individual de archivo: 15MB (Nota: Vercel tiene un límite rígido de 4.5MB)
    MAX_FILE_SIZE: 15 * 1024 * 1024,

    // Extensiones permitidas por tipo
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    ALLOWED_RESUME_TYPES: ['application/pdf'],

    // Rutas de almacenamiento
    PATHS: {
        DOCUMENTS: process.env.VERCEL ? '/tmp/uploads/documents' : 'uploads/documents',
        RESUMES: process.env.VERCEL ? '/tmp/uploads/resumes' : 'uploads/resumes',
        EVIDENCE: process.env.VERCEL ? '/tmp/uploads/evidence' : 'uploads/evidence'
    }
};
