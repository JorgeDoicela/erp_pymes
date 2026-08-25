/**
 * @file signatureController.js
 * @description Controlador REST para Firma QR y Firma Electrónica Oficial del Ecuador (.p12).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import qrSignatureService from '../../services/signatures/qrSignatureService.js';
import ecuadorianElectronicSignatureService from '../../services/signatures/ecuadorianElectronicSignatureService.js';

class SignatureController {
    // --- FIRMAS QR ---

    /**
     * Generar Firma Digital QR
     */
    async generateQr(req, res) {
        try {
            const { docType, docId, signerName, signerId, issuer, content, notes, expiresInDays } = req.body;
            const result = await qrSignatureService.generateQrSignature({
                docType,
                docId,
                signerName: signerName || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'Firmante Autorizado',
                signerId: signerId || req.user?.identityCard || req.user?.id || 'EC-ID',
                issuer: issuer || req.user?.tenant?.name || 'EMPLIFI S.A.',
                content,
                notes,
                expiresInDays: expiresInDays ? parseInt(expiresInDays, 10) : 365
            });

            return res.status(201).json({
                success: true,
                message: 'Firma digital QR generada con éxito',
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al generar la firma QR'
            });
        }
    }

    /**
     * Verificar Firma Digital QR vía Token
     */
    async verifyQr(req, res) {
        try {
            const { token, content } = req.body;
            const result = qrSignatureService.verifyQrSignature(token, content);
            return res.status(result.valid ? 200 : 422).json({
                success: result.valid,
                ...result
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al verificar la firma QR'
            });
        }
    }

    /**
     * Verificación pública por token URL (para escaneo QR desde móviles)
     */
    async verifyQrPublic(req, res) {
        try {
            const { token } = req.params;
            const result = qrSignatureService.verifyQrSignature(token);
            return res.status(result.valid ? 200 : 404).json({
                success: result.valid,
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error en la verificación pública de firma'
            });
        }
    }

    // --- FIRMA ELECTRÓNICA OFICIAL ECUADOR (.P12) ---

    /**
     * Inspeccionar archivo .p12 y validar vigencia/CA
     */
    async inspectP12(req, res) {
        try {
            const { password } = req.body;
            const file = req.file;

            if (!file && !req.body.p12Base64) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe adjuntar el archivo .p12 o su contenido en base64'
                });
            }
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña del certificado .p12 es requerida'
                });
            }

            const p12Buffer = file ? file.buffer : Buffer.from(req.body.p12Base64, 'base64');
            const inspection = ecuadorianElectronicSignatureService.inspectCertificate(p12Buffer, password);

            return res.status(200).json({
                success: true,
                message: 'Certificado .p12 validado con éxito',
                data: inspection
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al inspeccionar el certificado digital'
            });
        }
    }

    /**
     * Firmar electrónicamente un documento con .p12
     */
    async signWithP12(req, res) {
        try {
            const { password, documentContent, documentName, reason } = req.body;
            const file = req.file;

            if (!file && !req.body.p12Base64) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe adjuntar el archivo .p12 o su contenido en base64'
                });
            }
            if (!password || !documentContent) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña del .p12 y el contenido del documento son requeridos'
                });
            }

            const p12Buffer = file ? file.buffer : Buffer.from(req.body.p12Base64, 'base64');
            const result = ecuadorianElectronicSignatureService.signDocument({
                p12Buffer,
                password,
                documentContent,
                documentName,
                reason
            });

            return res.status(200).json({
                success: true,
                message: 'Documento firmado electrónicamente con éxito bajo estándar oficial del Ecuador',
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al firmar electrónicamente el documento'
            });
        }
    }

    /**
     * Verificar firma electrónica oficial (.p12 / RSA-SHA256)
     */
    async verifyP12Signature(req, res) {
        try {
            const { documentContent, signature, certificatePem } = req.body;
            const result = ecuadorianElectronicSignatureService.verifyElectronicSignature({
                documentContent,
                signature,
                certificatePem
            });

            return res.status(result.valid ? 200 : 422).json({
                success: result.valid,
                ...result
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al verificar la firma electrónica'
            });
        }
    }
}

export default new SignatureController();
