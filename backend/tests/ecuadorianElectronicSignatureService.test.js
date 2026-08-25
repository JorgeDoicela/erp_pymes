import { describe, it, expect, beforeAll } from 'vitest';
import forge from 'node-forge';
import ecuadorianElectronicSignatureService from '../src/services/signatures/ecuadorianElectronicSignatureService.js';

describe('Servicio Desacoplado de Firma Electrónica Oficial del Ecuador (ecuadorianElectronicSignatureService)', () => {
    let testP12Buffer;
    const testPassword = 'PasswordSeguro2026!';
    const testSignerName = 'Ing. Jorge Doicela';
    const testIdentityCard = '1720000001';
    const testCA = 'SECURITY DATA S.A.';

    beforeAll(() => {
        // Generar un certificado X.509 y clave privada PKCS#12 (.p12) válido en memoria para pruebas
        const keys = forge.pki.rsa.generateKeyPair(2048);
        const cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '0123456789ABCDEF';
        cert.validity.notBefore = new Date(Date.now() - 24 * 60 * 60 * 1000); // Ayer
        cert.validity.notAfter = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 año

        const attrs = [
            { name: 'commonName', value: testSignerName },
            { name: 'countryName', value: 'EC' },
            { name: 'organizationName', value: 'EMPLIFI S.A.' },
            { name: 'serialNumber', value: testIdentityCard }
        ];

        const issuerAttrs = [
            { name: 'commonName', value: 'AUTORIDAD DE CERTIFICACION SECURITY DATA' },
            { name: 'organizationName', value: testCA },
            { name: 'countryName', value: 'EC' }
        ];

        cert.setSubject(attrs);
        cert.setIssuer(issuerAttrs);
        cert.sign(keys.privateKey, forge.md.sha256.create());

        // Empaquetar en PKCS#12 (.p12)
        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], testPassword, {
            generateLocalKeyId: true,
            friendlyName: 'Firma Electronica Ecuador'
        });
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
        testP12Buffer = Buffer.from(p12Der, 'binary');
    });

    it('debe inspeccionar un certificado .p12 y extraer metadatos oficiales del Ecuador', () => {
        const inspection = ecuadorianElectronicSignatureService.inspectCertificate(testP12Buffer, testPassword);

        expect(inspection.valid).toBe(true);
        expect(inspection.signer.fullName).toBe(testSignerName);
        expect(inspection.signer.identityNumber).toBe(testIdentityCard);
        expect(inspection.issuer.caName).toBe(testCA);
        expect(inspection.issuer.isEcuadorianAccreditedCA).toBe(true);
        expect(inspection.validity.isExpired).toBe(false);
        expect(inspection.validity.statusText).toBe('VÁLIDO Y ACTIVO');
        expect(inspection.technicalDetails.publicKeyBits).toBe(2048);
    });

    it('debe rechazar inspección si la contraseña del .p12 es incorrecta', () => {
        expect(() => {
            ecuadorianElectronicSignatureService.inspectCertificate(testP12Buffer, 'WrongPassword123');
        }).toThrow(/Contraseña/);
    });

    it('debe firmar electrónicamente un documento con SHA256withRSA y generar sello oficial', () => {
        const documentContent = {
            docId: 'ROL-2026-03',
            employee: 'Carlos Mendoza',
            netToPay: 1086.60
        };

        const signed = ecuadorianElectronicSignatureService.signDocument({
            p12Buffer: testP12Buffer,
            password: testPassword,
            documentContent,
            documentName: 'Rol de Pagos Individual - Marzo 2026',
            reason: 'Aprobación Definitiva de Nómina'
        });

        expect(signed.success).toBe(true);
        expect(signed.signatureStamp.algorithm).toBe('SHA256withRSA');
        expect(signed.signatureStamp.signer.name).toBe(testSignerName);
        expect(signed.signatureBase64).toBeDefined();
        expect(signed.signatureHex).toBeDefined();
        expect(signed.certificatePem).toContain('BEGIN CERTIFICATE');
    });

    it('debe verificar con éxito un documento firmado con firma electrónica oficial', () => {
        const documentContent = "Acta de Entrega-Recepción de Equipo Portátil Lenovo ThinkPad T14 C.I. 1711111111";

        const signed = ecuadorianElectronicSignatureService.signDocument({
            p12Buffer: testP12Buffer,
            password: testPassword,
            documentContent,
            documentName: 'Acta de Entrega de Activo'
        });

        const verified = ecuadorianElectronicSignatureService.verifyElectronicSignature({
            documentContent,
            signature: signed.signatureBase64,
            certificatePem: signed.certificatePem
        });

        expect(verified.valid).toBe(true);
        expect(verified.status).toBe('VALID_OFFICIAL');
        expect(verified.signer.name).toBe(testSignerName);
        expect(verified.issuer.caName).toBe(testCA);
    });

    it('debe detectar alteraciones en el documento firmado electrónicamente (Firma Inválida)', () => {
        const originalDoc = "Contrato de Trabajo por Tiempo Indefinido - Sueldo: $1200.00 USD";
        const tamperedDoc = "Contrato de Trabajo por Tiempo Indefinido - Sueldo: $5000.00 USD"; // Alterado

        const signed = ecuadorianElectronicSignatureService.signDocument({
            p12Buffer: testP12Buffer,
            password: testPassword,
            documentContent: originalDoc
        });

        const verified = ecuadorianElectronicSignatureService.verifyElectronicSignature({
            documentContent: tamperedDoc,
            signature: signed.signatureBase64,
            certificatePem: signed.certificatePem
        });

        expect(verified.valid).toBe(false);
        expect(verified.status).toBe('INVALID_SIGNATURE');
        expect(verified.message).toContain('alterado');
    });
});
