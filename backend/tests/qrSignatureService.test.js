import { describe, it, expect } from 'vitest';
import qrSignatureService from '../src/services/signatures/qrSignatureService.js';

describe('Servicio Desacoplado de Firmas Digitales QR (qrSignatureService)', () => {
    it('debe generar una firma digital QR válida con token criptográfico y código de verificación', async () => {
        const result = await qrSignatureService.generateQrSignature({
            docType: 'PAYSLIP',
            docId: 'PAY-2026-03-001',
            signerName: 'Carlos Mendoza',
            signerId: '1711111111',
            issuer: 'EMPLIFI S.A.',
            content: { baseSalary: 1200, netSalary: 1086.60, period: '2026-03' },
            notes: 'Conformidad de Rol de Pagos Marzo 2026'
        });

        expect(result.success).toBe(true);
        expect(result.verificationCode).toMatch(/^SIG-[A-F0-9]{8}-\d{4}$/);
        expect(result.token).toBeDefined();
        expect(result.verificationUrl).toContain('/signatures/verify/');
        expect(result.qrDataUrl).toMatch(/^data:image\/png;base64,/);
        expect(result.qrSvg).toContain('<svg');
        expect(result.docHash).toHaveLength(64); // SHA-256
    });

    it('debe verificar exitosamente una firma QR legítima', async () => {
        const documentData = { contractId: 'CTR-999', salary: 1500, position: 'Líder Técnico' };

        const generated = await qrSignatureService.generateQrSignature({
            docType: 'CONTRACT',
            docId: 'CTR-999',
            signerName: 'Ana Torres',
            signerId: '1799999999',
            issuer: 'EMPLIFI S.A.',
            content: documentData
        });

        const verification = qrSignatureService.verifyQrSignature(generated.token, documentData);

        expect(verification.valid).toBe(true);
        expect(verification.status).toBe('VALID');
        expect(verification.signer.name).toBe('Ana Torres');
        expect(verification.signer.id).toBe('1799999999');
        expect(verification.docType).toBe('CONTRACT');
    });

    it('debe detectar manipulación en el contenido del documento (Integrity Mismatch)', async () => {
        const originalContent = { asset: 'Laptop ThinkPad T14', serial: 'PF4X990' };
        const tamperedContent = { asset: 'Laptop ThinkPad T14', serial: 'PF4X990-MODIFICADO' };

        const generated = await qrSignatureService.generateQrSignature({
            docType: 'ASSET_HANDOVER',
            docId: 'AST-001',
            signerName: 'Gabriel Silva',
            signerId: '1788888888',
            content: originalContent
        });

        const verification = qrSignatureService.verifyQrSignature(generated.token, tamperedContent);

        expect(verification.valid).toBe(false);
        expect(verification.status).toBe('INTEGRITY_MISMATCH');
        expect(verification.message).toContain('modificado');
    });

    it('debe rechazar tokens con firmas falsificadas o alteradas', () => {
        // Token con firma modificada
        const fakePayload = {
            v: '1.0',
            signerName: 'Atacante Malicioso',
            signerId: '0000000000',
            docHash: 'fakehash123'
        };
        const fakeSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        const fakeToken = Buffer.from(JSON.stringify({ payload: fakePayload, signature: fakeSignature })).toString('base64url');

        const verification = qrSignatureService.verifyQrSignature(fakeToken);

        expect(verification.valid).toBe(false);
        expect(verification.status).toBe('FORGED');
    });

    it('debe validar la expiración de firmas caducadas', async () => {
        const expired = await qrSignatureService.generateQrSignature({
            docType: 'WORK_CERTIFICATE',
            docId: 'CERT-001',
            signerName: 'Valeria Espinoza',
            signerId: '1723456789',
            expiresInDays: -1 // Expirado ayer
        });

        const verification = qrSignatureService.verifyQrSignature(expired.token);

        expect(verification.valid).toBe(false);
        expect(verification.status).toBe('EXPIRED');
    });
});
