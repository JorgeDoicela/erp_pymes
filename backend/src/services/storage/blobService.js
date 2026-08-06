import fs from 'fs';
import path from 'path';
import { STORAGE_CONFIG } from '../../config/storage.config.js';

/**
 * Servicio de almacenamiento local en servidor (Disco Local / Volumen Docker EC2)
 */
export const uploadFileToStorage = async (file, folder = 'resumes') => {
    if (!file) return null;

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname || '.pdf');

    const targetDir = folder === 'resumes' 
        ? STORAGE_CONFIG.PATHS.RESUMES 
        : (folder === 'documents' ? STORAGE_CONFIG.PATHS.DOCUMENTS : STORAGE_CONFIG.PATHS.EVIDENCE);

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const localFilename = `${file.fieldname || 'file'}-${uniqueSuffix}${extension}`;
    const filePath = path.join(targetDir, localFilename);

    if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
    } else if (file.path) {
        fs.copyFileSync(file.path, filePath);
    }

    const relativePath = `uploads/${folder}/${localFilename}`;
    console.log(`[Storage] Archivo guardado localmente en servidor: ${relativePath}`);
    return relativePath;
};

/**
 * Elimina un archivo del almacenamiento local del servidor
 */
export const deleteFileFromStorage = async (fileUrl) => {
    if (!fileUrl) return;

    try {
        let cleanPath = fileUrl;
        if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
            const urlObj = new URL(cleanPath);
            cleanPath = urlObj.pathname.replace(/^\/api\//, '');
        }

        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

        const filename = path.basename(cleanPath);
        let targetDir = STORAGE_CONFIG.PATHS.RESUMES;
        if (cleanPath.includes('documents')) targetDir = STORAGE_CONFIG.PATHS.DOCUMENTS;
        if (cleanPath.includes('evidence')) targetDir = STORAGE_CONFIG.PATHS.EVIDENCE;

        const absolutePath = path.join(targetDir, filename);

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log(`[Storage] Archivo local eliminado: ${absolutePath}`);
        }
    } catch (error) {
        console.error('[Storage Error] Error al eliminar archivo:', error.message);
    }
};

