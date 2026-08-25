/**
 * @file signature.service.js
 * @description Servicio frontend para interactuar con la API desacoplada de Firmas QR y Firma Electrónica Oficial del Ecuador (.p12).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import api from '../../api/axios';

/**
 * Generar firma digital QR para un documento del sistema
 */
export const generateQrSignature = async (payload) => {
    const res = await api.post('/signatures/qr/generate', payload);
    return res.data;
};

/**
 * Verificar firma QR internamente
 */
export const verifyQrSignature = async (token, content = null) => {
    const res = await api.post('/signatures/qr/verify', { token, content });
    return res.data;
};

/**
 * Verificar firma QR pública (vía URL token)
 */
export const verifyQrPublic = async (token) => {
    const res = await api.get(`/signatures/qr/public/${token}`);
    return res.data;
};

/**
 * Inspeccionar certificado .p12 oficial del Ecuador
 */
export const inspectP12Certificate = async (file, password) => {
    const formData = new FormData();
    formData.append('p12File', file);
    formData.append('password', password);

    const res = await api.post('/signatures/electronic/inspect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};

/**
 * Firmar electrónicamente un documento con .p12
 */
export const signDocumentWithP12 = async (file, password, documentContent, documentName, reason) => {
    const formData = new FormData();
    formData.append('p12File', file);
    formData.append('password', password);
    formData.append('documentContent', typeof documentContent === 'object' ? JSON.stringify(documentContent) : documentContent);
    formData.append('documentName', documentName || 'Documento Legal');
    formData.append('reason', reason || 'Firma de Conformidad Legal');

    const res = await api.post('/signatures/electronic/sign', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};

/**
 * Verificar firma electrónica oficial (.p12 / RSA-SHA256)
 */
export const verifyP12Signature = async (documentContent, signature, certificatePem) => {
    const res = await api.post('/signatures/electronic/verify', {
        documentContent: typeof documentContent === 'object' ? JSON.stringify(documentContent) : documentContent,
        signature,
        certificatePem
    });
    return res.data;
};
