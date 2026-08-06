import { put, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { STORAGE_CONFIG } from '../../config/storage.config.js';

/**
 * Servicio de almacenamiento híbrido (Vercel Blob / Disco Local)
 * Permite persistir PDFs/documentos en la nube en Vercel manteniendo fallback local.
 */
export const uploadFileToStorage = async (file, folder = 'resumes') => {
    if (!file) return null;

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname || '.pdf');
    const filename = `${folder}/${file.fieldname || 'file'}-${uniqueSuffix}${extension}`;

    // 1. Si el Token de Vercel Blob está presente, subir a la nube Vercel Blob
    if (token) {
        try {
            const blob = await put(filename, file.buffer || file.path, {
                access: 'public',
                contentType: file.mimetype || 'application/pdf',
                token: token
            });
            console.log(`[Storage] Archivo subido exitosamente a Vercel Blob: ${blob.url}`);
            return blob.url;
        } catch (error) {
            console.error('[Storage Error] Fallo al subir a Vercel Blob, recurriendo a almacenamiento local:', error.message);
        }
    } else if (process.env.VERCEL) {
        console.warn('[Storage Warning] Ejecutando en Vercel pero falta BLOB_READ_WRITE_TOKEN. Los archivos guardados en /tmp serán efímeros.');
    }

    // 2. Fallback: Almacenamiento local en disco (para desarrollo local)
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
    console.log(`[Storage] Archivo guardado localmente en: ${relativePath}`);
    return relativePath;
};

/**
 * Elimina un archivo del almacenamiento (Vercel Blob o Disco Local)
 */
export const deleteFileFromStorage = async (fileUrl) => {
    if (!fileUrl) return;

    try {
        const token = process.env.BLOB_READ_WRITE_TOKEN;

        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            if (token) {
                await del(fileUrl, { token });
                console.log(`[Storage] Archivo eliminado de Vercel Blob: ${fileUrl}`);
            }
            return;
        }

        const absolutePath = path.resolve(fileUrl);
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log(`[Storage] Archivo local eliminado: ${absolutePath}`);
        }
    } catch (error) {
        console.error('[Storage Error] Error al eliminar archivo:', error.message);
    }
};
