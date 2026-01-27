
/**
 * RNF-16: Configuración de Almacenamiento
 */
export const STORAGE_CONFIG = {
    // Límite individual de archivo: 5MB
    MAX_FILE_SIZE: 5 * 1024 * 1024,

    // Extensiones permitidas por tipo
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    ALLOWED_RESUME_TYPES: ['application/pdf'],

    // Rutas de almacenamiento
    PATHS: {
        DOCUMENTS: 'uploads/documents',
        RESUMES: 'uploads/resumes',
        EVIDENCE: 'uploads/evidence'
    }
};
