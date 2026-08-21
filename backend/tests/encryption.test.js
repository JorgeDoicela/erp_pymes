import { describe, it, expect } from 'vitest';
import {
    encrypt,
    decrypt,
    safeDecrypt,
    encryptSalary,
    decryptSalary,
    encryptCoordinate,
    decryptCoordinate
} from '../src/utils/encryption.js';

describe('Field Level Encryption (FLE) AES-256-GCM Security Test Suite', () => {

    describe('1. General AES-256-GCM Encryption & Decryption', () => {
        it('should encrypt and decrypt arbitrary string values correctly', () => {
            const originalText = 'DatoConfidencial_12345';
            const encrypted = encrypt(originalText);

            expect(encrypted).toBeDefined();
            expect(typeof encrypted).toBe('string');
            // Format should be iv:authTag:encryptedData (3 parts separated by colon)
            const parts = encrypted.split(':');
            expect(parts).toHaveLength(3);
            expect(parts[0]).toHaveLength(24); // 12 bytes in hex = 24 hex characters
            expect(parts[1]).toHaveLength(32); // 16 bytes auth tag in hex = 32 hex characters

            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(originalText);
        });

        it('should generate distinct ciphertexts for identical plaintexts (Randomized IVs)', () => {
            const plainText = 'MismoTextoSecreto';
            const enc1 = encrypt(plainText);
            const enc2 = encrypt(plainText);

            expect(enc1).not.toBe(enc2);
            expect(decrypt(enc1)).toBe(plainText);
            expect(decrypt(enc2)).toBe(plainText);
        });

        it('should handle null, undefined and empty inputs defensively', () => {
            expect(encrypt(null)).toBeNull();
            expect(encrypt(undefined)).toBeNull();
            expect(decrypt(null)).toBeNull();
            expect(decrypt('')).toBeNull();
            expect(safeDecrypt(null)).toBeNull();
        });

        it('should fail or return null when ciphertext or authentication tag is tampered with', () => {
            const encrypted = encrypt('InformacionSensible');
            const [iv, authTag, data] = encrypted.split(':');

            // Alter ciphertext
            const tamperedData = data.slice(0, -2) + (data.endsWith('a') ? 'b' : 'a');
            const tamperedEncrypted = `${iv}:${authTag}:${tamperedData}`;

            expect(() => decrypt(tamperedEncrypted)).toThrow();
            expect(safeDecrypt(tamperedEncrypted)).toBeNull();
        });
    });

    describe('2. Salary Encryption & Decryption', () => {
        it('should encrypt valid numeric salaries and decrypt back to rounded numbers', () => {
            const salary = 1250.75;
            const encryptedSalary = encryptSalary(salary);

            expect(encryptedSalary).toBeDefined();
            expect(encryptedSalary).toContain(':');

            const decryptedSalary = decryptSalary(encryptedSalary);
            expect(decryptedSalary).toBe(1250.75);
        });

        it('should reject non-numeric salaries on encryption', () => {
            expect(() => encryptSalary('mil doscientos')).toThrow('El salario debe ser un número válido');
            expect(() => encryptSalary(NaN)).toThrow('El salario debe ser un número válido');
        });

        it('should support legacy plain-text numerical strings during decryption transition', () => {
            expect(decryptSalary('950.50')).toBe(950.50);
            expect(decryptSalary('invalid-string')).toBeNull();
        });
    });

    describe('3. GPS Coordinate Encryption & Privacy Truncation', () => {
        it('should truncate coordinates to 4 decimal places (~11m privacy) and encrypt', () => {
            const lat = -0.22014892;
            const lng = -78.51239912;

            const encLat = encryptCoordinate(lat);
            const encLng = encryptCoordinate(lng);

            expect(encLat).toBeDefined();
            expect(encLng).toBeDefined();

            const decLat = decryptCoordinate(encLat);
            const decLng = decryptCoordinate(encLng);

            expect(decLat).toBe(-0.2201);
            expect(decLng).toBe(-78.5124);
        });

        it('should handle null/empty coordinate inputs gracefully', () => {
            expect(encryptCoordinate(null)).toBeNull();
            expect(encryptCoordinate('')).toBeNull();
            expect(decryptCoordinate(null)).toBeNull();
        });

        it('should support legacy numeric or plain string coordinates seamlessly', () => {
            expect(decryptCoordinate(-0.18065)).toBe(-0.1807);
            expect(decryptCoordinate('-78.46781')).toBe(-78.4678);
        });
    });
});
