/**
 * @file qrSignatureService.js
 * @description Servicio desacoplado para generación y validación de firmas digitales criptográficas con Códigos QR.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import crypto from 'crypto';
import QRCode from 'qrcode';

class QrSignatureService {
    constructor() {
        this.secretKey = process.env.JWT_SECRET || 'emplifi_signature_secret_key_2026_ecuador_secure';
    }

    /**
     * Calcula el hash criptográfico SHA-256 de un contenido, archivo o payload.
     * @param {string|Buffer|Object} content - Contenido a hashear.
     * @returns {string} Hash SHA-256 hexadecimal.
     */
    calculateHash(content) {
        const str = typeof content === 'object' && !Buffer.isBuffer(content)
            ? JSON.stringify(content)
            : content.toString();
        return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
    }

    /**
     * Genera una firma digital HMAC-SHA256 desacoplada y su correspondiente código QR.
     * 
     * @param {Object} params
     * @param {string} params.docType - Tipo de documento (PAYSLIP, ASSET_HANDOVER, CONTRACT, WORK_CERTIFICATE, ATTENDANCE, CUSTOM)
     * @param {string} params.docId - ID del registro en el sistema
     * @param {string} params.signerName - Nombre completo del firmante
     * @param {string} params.signerId - Cédula / Identificación del firmante
     * @param {string} params.issuer - Razón social de la empresa o entidad emisora
     * @param {string|Object} [params.content] - Contenido o campos clave para asegurar integridad
     * @param {string} [params.notes] - Observaciones o propósito de la firma
     * @param {number} [params.expiresInDays=365] - Días de validez del QR
     * @returns {Promise<Object>} Metadata de la firma, token criptográfico y QR en Base64/SVG.
     */
    async generateQrSignature({
        docType = 'CUSTOM',
        docId = crypto.randomUUID(),
        signerName,
        signerId,
        issuer = 'EMPLIFI S.A.',
        content = '',
        notes = 'Firma digital de conformidad',
        expiresInDays = 365
    }) {
        if (!signerName || !signerId) {
            throw new Error('El nombre y número de identificación del firmante son obligatorios');
        }

        const timestamp = new Date().toISOString();
        const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
        const docHash = this.calculateHash(content || `${docType}:${docId}:${signerId}:${timestamp}`);
        const verificationCode = `SIG-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;

        // Payload estandarizado de la firma
        const payload = {
            v: '1.0',
            docType,
            docId,
            verificationCode,
            signerName,
            signerId,
            issuer,
            docHash,
            timestamp,
            expiresAt,
            notes
        };

        // Generar firma HMAC-SHA256
        const payloadString = JSON.stringify(payload);
        const signature = crypto.createHmac('sha256', this.secretKey).update(payloadString).digest('hex');

        // Token seguro base64url que contiene el payload y la firma
        const token = Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');

        // URL de verificación pública
        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        const verificationUrl = `${appUrl}/signatures/verify/${token}`;

        // Generar Código QR en formato Data URL (PNG) y SVG
        const [qrDataUrl, qrSvg] = await Promise.all([
            QRCode.toDataURL(verificationUrl, {
                errorCorrectionLevel: 'M',
                margin: 2,
                width: 320,
                color: {
                    dark: '#111827',
                    light: '#ffffff'
                }
            }),
            QRCode.toString(verificationUrl, {
                type: 'svg',
                margin: 2,
                color: {
                    dark: '#111827',
                    light: '#ffffff'
                }
            })
        ]);

        return {
            success: true,
            verificationCode,
            token,
            verificationUrl,
            qrDataUrl,
            qrSvg,
            docHash,
            signature,
            payload
        };
    }

    /**
     * Valida y autentica una firma QR a partir de su token criptográfico o payload.
     * 
     * @param {string} token - Token base64url generado por el sistema
     * @param {string|Object} [expectedContent] - Contenido original opcional para verificar integridad de datos
     * @returns {Object} Resultado de la validación, estado de vigencia y autoría.
     */
    verifyQrSignature(token, expectedContent = null) {
        if (!token) {
            return {
                valid: false,
                status: 'INVALID_TOKEN',
                message: 'Token de firma no proporcionado'
            };
        }

        try {
            const decodedStr = Buffer.from(token, 'base64url').toString('utf8');
            const { payload, signature } = JSON.parse(decodedStr);

            if (!payload || !signature) {
                return {
                    valid: false,
                    status: 'CORRUPTED',
                    message: 'Estructura de firma dañada o incompleta'
                };
            }

            // Validar firma HMAC
            const payloadString = JSON.stringify(payload);
            const expectedSignature = crypto.createHmac('sha256', this.secretKey).update(payloadString).digest('hex');

            const isSignatureValid = crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );

            if (!isSignatureValid) {
                return {
                    valid: false,
                    status: 'FORGED',
                    message: 'Firma no válida o manipulada ilegítimamente'
                };
            }

            // Validar fecha de expiración
            const isExpired = new Date(payload.expiresAt) < new Date();
            if (isExpired) {
                return {
                    valid: false,
                    status: 'EXPIRED',
                    message: 'La firma digital ha expirado',
                    payload
                };
            }

            // Validar integridad del contenido si se proveyó
            if (expectedContent !== null) {
                const currentHash = this.calculateHash(expectedContent);
                if (currentHash !== payload.docHash) {
                    return {
                        valid: false,
                        status: 'INTEGRITY_MISMATCH',
                        message: 'El contenido del documento ha sido modificado tras la firma',
                        payload
                    };
                }
            }

            return {
                valid: true,
                status: 'VALID',
                message: 'Firma digital válida y verificada con éxito',
                payload,
                verificationCode: payload.verificationCode,
                signer: {
                    name: payload.signerName,
                    id: payload.signerId,
                    issuer: payload.issuer
                },
                signedAt: payload.timestamp,
                expiresAt: payload.expiresAt,
                docType: payload.docType,
                docId: payload.docId
            };
        } catch (error) {
            return {
                valid: false,
                status: 'DECODE_ERROR',
                message: `Error al procesar la firma: ${error.message}`
            };
        }
    }
}

export default new QrSignatureService();
