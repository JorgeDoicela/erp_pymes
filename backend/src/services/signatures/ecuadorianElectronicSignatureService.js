/**
 * @file ecuadorianElectronicSignatureService.js
 * @description Servicio desacoplado para procesamiento, inspección, firmado y verificación de Firma Electrónica Oficial del Ecuador (PKCS#12 / .p12 / .pfx).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import forge from 'node-forge';
import crypto from 'crypto';

// CAs Acreditadas en Ecuador por ARCOTEL
const RECOGNIZED_ECUADORIAN_CAS = [
    'BANCO CENTRAL DEL ECUADOR',
    'SECURITY DATA S.A.',
    'ANF AUTORIDAD DE CERTIFICACION ECUADOR',
    'UANATACA ECUADOR',
    'CONSEJO DE LA JUDICATURA',
    'DATASAFE S.A.'
];

class EcuadorianElectronicSignatureService {
    /**
     * Inspecciona un archivo de certificado PKCS#12 (.p12 / .pfx) con su contraseña.
     * Extrae los metadatos del firmante, cédula/RUC, entidad certificadora (CA) y vigencia sin almacenar la contraseña.
     * 
     * @param {Buffer|string} p12Buffer - Buffer del archivo .p12 o string base64
     * @param {string} password - Contraseña del certificado digital
     * @returns {Object} Metadatos completos del certificado digital ecuatoriano
     */
    inspectCertificate(p12Buffer, password) {
        if (!p12Buffer || !password) {
            throw new Error('El archivo del certificado .p12 y su contraseña son obligatorios');
        }

        try {
            // Convertir buffer a forge binary string
            const buffer = Buffer.isBuffer(p12Buffer) ? p12Buffer : Buffer.from(p12Buffer, 'base64');
            const p12Der = buffer.toString('binary');
            const p12Asn1 = forge.asn1.fromDer(p12Der);
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

            // Obtener el SafeContents que contiene el certificado
            const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
            const certBag = certBags[forge.pki.oids.certBag]?.[0];

            if (!certBag || !certBag.cert) {
                throw new Error('No se encontró un certificado X.509 válido dentro del archivo .p12');
            }

            const cert = certBag.cert;
            const now = new Date();
            const validFrom = new Date(cert.validity.notBefore);
            const validTo = new Date(cert.validity.notAfter);
            const isExpired = now > validTo;
            const isNotYetValid = now < validFrom;
            const daysRemaining = Math.max(0, Math.ceil((validTo - now) / (1000 * 60 * 60 * 24)));

            // Extraer atributos del titular (Subject)
            const subjectAttributes = {};
            cert.subject.attributes.forEach(attr => {
                const name = attr.name || attr.shortName || attr.type;
                subjectAttributes[name] = attr.value;
            });

            // Extraer atributos del emisor (Issuer / CA)
            const issuerAttributes = {};
            cert.issuer.attributes.forEach(attr => {
                const name = attr.name || attr.shortName || attr.type;
                issuerAttributes[name] = attr.value;
            });

            const issuerOrg = issuerAttributes.organizationName || issuerAttributes.commonName || 'Entidad Certificadora';
            const isRecognizedCA = RECOGNIZED_ECUADORIAN_CAS.some(ca =>
                issuerOrg.toUpperCase().includes(ca) || (issuerAttributes.commonName || '').toUpperCase().includes(ca)
            );

            // Cédula o RUC del firmante en certificados de Ecuador (generalmente en serialNumber o description)
            const idNumber = subjectAttributes.serialNumber || subjectAttributes.uniqueIdentifier || subjectAttributes.description || '';
            const signerFullName = subjectAttributes.commonName || `${subjectAttributes.givenName || ''} ${subjectAttributes.surname || ''}`.trim() || 'Titular del Certificado';

            return {
                valid: !isExpired && !isNotYetValid,
                signer: {
                    fullName: signerFullName,
                    identityNumber: idNumber,
                    email: subjectAttributes.emailAddress || subjectAttributes.mail || '',
                    organization: subjectAttributes.organizationName || '',
                    department: subjectAttributes.organizationalUnitName || '',
                    country: subjectAttributes.countryName || 'EC'
                },
                issuer: {
                    caName: issuerOrg,
                    commonName: issuerAttributes.commonName || '',
                    isEcuadorianAccreditedCA: isRecognizedCA
                },
                validity: {
                    validFrom: validFrom.toISOString(),
                    validTo: validTo.toISOString(),
                    isExpired,
                    isNotYetValid,
                    daysRemaining,
                    statusText: isExpired ? 'CADUCADO' : isNotYetValid ? 'AÚN NO VIGENTE' : 'VÁLIDO Y ACTIVO'
                },
                technicalDetails: {
                    serialNumber: cert.serialNumber,
                    signatureAlgorithm: cert.siginfo?.algorithmOid || '1.2.840.113549.1.1.11 (SHA256withRSA)',
                    publicKeyBits: cert.publicKey.n?.bitLength() || 2048,
                    fingerprintSha256: forge.md.sha256.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()).digest().toHex().toUpperCase()
                }
            };
        } catch (error) {
            if (error.message && (error.message.includes('password') || error.message.includes('PKCS#12 MAC'))) {
                throw new Error('Contraseña del certificado .p12 incorrecta');
            }
            throw new Error(`Error al leer el archivo de firma electrónica: ${error.message}`);
        }
    }

    /**
     * Firma criptográficamente un documento, archivo o payload con un certificado oficial .p12.
     * Algoritmo estándar del Ecuador: SHA256withRSA.
     * 
     * @param {Object} params
     * @param {Buffer|string} params.p12Buffer - Archivo .p12 del firmante
     * @param {string} params.password - Contraseña del certificado .p12
     * @param {string|Buffer|Object} params.documentContent - Contenido o hash a firmar
     * @param {string} [params.documentName='Documento'] - Nombre o descripción del documento
     * @param {string} [params.reason='Firma de Aprobación Legal'] - Razón de la firma
     * @returns {Object} Sello de firma electrónica, firma criptográfica y certificado X.509
     */
    signDocument({
        p12Buffer,
        password,
        documentContent,
        documentName = 'Documento Legal',
        reason = 'Firma de Aprobación y Conformidad'
    }) {
        if (!documentContent) {
            throw new Error('El contenido del documento a firmar es obligatorio');
        }

        try {
            const buffer = Buffer.isBuffer(p12Buffer) ? p12Buffer : Buffer.from(p12Buffer, 'base64');
            const p12Der = buffer.toString('binary');
            const p12Asn1 = forge.asn1.fromDer(p12Der);
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

            // Obtener Clave Privada y Certificado
            const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
            const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0] || p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]?.[0];

            const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
            const certBag = certBags[forge.pki.oids.certBag]?.[0];

            if (!keyBag || !keyBag.key) {
                throw new Error('No se encontró la clave privada en el archivo .p12');
            }
            if (!certBag || !certBag.cert) {
                throw new Error('No se encontró el certificado X.509 en el archivo .p12');
            }

            const privateKey = keyBag.key;
            const cert = certBag.cert;

            // Validar vigencia del certificado
            const now = new Date();
            if (now > cert.validity.notAfter) {
                throw new Error('El certificado digital .p12 ha caducado');
            }
            if (now < cert.validity.notBefore) {
                throw new Error('El certificado digital .p12 aún no está en su periodo de vigencia');
            }

            // Normalizar contenido y calcular Hash SHA-256
            const contentStr = typeof documentContent === 'object' && !Buffer.isBuffer(documentContent)
                ? JSON.stringify(documentContent)
                : documentContent.toString();

            const docHash = crypto.createHash('sha256').update(contentStr, 'utf8').digest('hex');

            // Firmar Hash con Clave Privada RSA (SHA-256 with RSA Encryption)
            const md = forge.md.sha256.create();
            md.update(contentStr, 'utf8');
            const rawSignature = privateKey.sign(md);
            const signatureHex = forge.util.bytesToHex(rawSignature);
            const signatureBase64 = forge.util.encode64(rawSignature);

            // Extraer datos del firmante
            const certPem = forge.pki.certificateToPem(cert);
            const certInspection = this.inspectCertificate(buffer, password);

            const signedAt = now.toISOString();
            const signatureId = `EC-SIG-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

            // Sello electrónico estandarizado para Ecuador
            const signatureStamp = {
                signatureId,
                documentName,
                docHash,
                algorithm: 'SHA256withRSA',
                signedAt,
                reason,
                signer: {
                    name: certInspection.signer.fullName,
                    identityCard: certInspection.signer.identityNumber,
                    issuerCA: certInspection.issuer.caName
                },
                validity: {
                    validUntil: certInspection.validity.validTo,
                    isRecognizedCA: certInspection.issuer.isEcuadorianAccreditedCA
                },
                rawSignatureBase64: signatureBase64,
                signatureHex
            };

            return {
                success: true,
                signatureId,
                signatureStamp,
                signatureBase64,
                signatureHex,
                docHash,
                signedAt,
                signer: certInspection.signer,
                issuer: certInspection.issuer,
                certificatePem: certPem
            };
        } catch (error) {
            if (error.message && (error.message.includes('password') || error.message.includes('PKCS#12 MAC'))) {
                throw new Error('Contraseña de firma electrónica incorrecta');
            }
            throw new Error(`Error en el proceso de firmado electrónico: ${error.message}`);
        }
    }

    /**
     * Valida y autentica un documento firmado electrónicamente con su certificado PEM y firma base64/hex.
     * 
     * @param {Object} params
     * @param {string|Buffer|Object} params.documentContent - Contenido del documento a verificar
     * @param {string} params.signature - Firma en Base64 o Hexadecimal
     * @param {string} params.certificatePem - Certificado X.509 en formato PEM
     * @returns {Object} Resultado de la verificación legal y criptográfica
     */
    verifyElectronicSignature({ documentContent, signature, certificatePem }) {
        if (!documentContent || !signature || !certificatePem) {
            return {
                valid: false,
                status: 'MISSING_DATA',
                message: 'Contenido del documento, firma y certificado son obligatorios para validar'
            };
        }

        try {
            const cert = forge.pki.certificateFromPem(certificatePem);
            const publicKey = cert.publicKey;

            // Normalizar contenido
            const contentStr = typeof documentContent === 'object' && !Buffer.isBuffer(documentContent)
                ? JSON.stringify(documentContent)
                : documentContent.toString();

            // Decodificar firma (Base64 o Hex)
            let sigBytes;
            if (/^[0-9a-fA-F]+$/.test(signature) && signature.length % 2 === 0) {
                sigBytes = forge.util.hexToBytes(signature);
            } else {
                sigBytes = forge.util.decode64(signature);
            }

            // Verificar firma criptográfica con la Clave Pública del certificado
            const md = forge.md.sha256.create();
            md.update(contentStr, 'utf8');
            const isValidCrypto = publicKey.verify(md.digest().bytes(), sigBytes);

            if (!isValidCrypto) {
                return {
                    valid: false,
                    status: 'INVALID_SIGNATURE',
                    message: 'La firma no corresponde al documento o el contenido ha sido alterado'
                };
            }

            // Validar vigencia del certificado
            const now = new Date();
            const isExpired = now > cert.validity.notAfter;
            const isNotYetValid = now < cert.validity.notBefore;

            // Extraer Subject y CA
            const subjectAttributes = {};
            cert.subject.attributes.forEach(attr => {
                subjectAttributes[attr.name || attr.shortName || attr.type] = attr.value;
            });
            const issuerAttributes = {};
            cert.issuer.attributes.forEach(attr => {
                issuerAttributes[attr.name || attr.shortName || attr.type] = attr.value;
            });

            return {
                valid: true,
                status: isExpired ? 'VALID_SIGNATURE_EXPIRED_CERT' : 'VALID_OFFICIAL',
                message: isExpired
                    ? 'Firma criptográfica válida, pero el certificado digital está caducado'
                    : 'Firma electrónica oficial íntegra y verificada exitosamente',
                signer: {
                    name: subjectAttributes.commonName || `${subjectAttributes.givenName || ''} ${subjectAttributes.surname || ''}`.trim(),
                    identityCard: subjectAttributes.serialNumber || subjectAttributes.uniqueIdentifier || '',
                    organization: subjectAttributes.organizationName || ''
                },
                issuer: {
                    caName: issuerAttributes.organizationName || issuerAttributes.commonName || 'Entidad Certificadora'
                },
                validity: {
                    validFrom: cert.validity.notBefore.toISOString(),
                    validTo: cert.validity.notAfter.toISOString(),
                    isExpired
                }
            };
        } catch (error) {
            return {
                valid: false,
                status: 'VERIFICATION_ERROR',
                message: `Error al verificar la firma electrónica: ${error.message}`
            };
        }
    }
}

export default new EcuadorianElectronicSignatureService();
