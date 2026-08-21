import { describe, it, expect } from 'vitest';
import {
    validateCedula,
    validateEmail,
    validatePhone,
    validateSalary,
    validateAge,
    validateDates
} from '../validationUtils';

describe('Frontend Validation Utilities Test Suite (Ecuadorian Labor Standards)', () => {

    describe('1. Cédula Ecuatoriana (Módulo 10)', () => {
        it('Should validate valid Ecuadorian ID cards correctly', () => {
            // Cédulas válidas reales (Pichincha 17, Guayas 09)
            expect(validateCedula('1710034065')).toBeNull();
            expect(validateCedula('0924973415')).toBeNull();
        });

        it('Should reject invalid or ill-formed ID cards', () => {
            expect(validateCedula('')).toBe('La cédula es obligatoria');
            expect(validateCedula(null)).toBe('La cédula es obligatoria');
            expect(validateCedula('171003406')).toBe('La cédula debe tener 10 dígitos');
            expect(validateCedula('171003406A')).toBe('La cédula solo debe contener números');
            expect(validateCedula('3010034065')).toBe('Provincia inválida en la cédula'); // Provincia > 24
            expect(validateCedula('0010034065')).toBe('Provincia inválida en la cédula'); // Provincia < 1
            expect(validateCedula('1710034069')).toBe('La cédula no es válida'); // Dígito verificador erróneo
        });
    });

    describe('2. Email & Phone Validation', () => {
        it('Should validate correct and incorrect emails', () => {
            expect(validateEmail('empleado@empresa.ec')).toBeNull();
            expect(validateEmail('admin.hr@corporativo.com.ec')).toBeNull();
            expect(validateEmail('')).toBe('El correo es obligatorio');
            expect(validateEmail(null)).toBe('El correo es obligatorio');
            expect(validateEmail('correo-invalido')).toBe('Formato de correo inválido');
            expect(validateEmail('test@sin-dominio')).toBe('Formato de correo inválido');
        });

        it('Should validate Ecuadorian 10-digit mobile phone numbers', () => {
            expect(validatePhone('0991234567')).toBeNull();
            expect(validatePhone('0987654321')).toBeNull();
            expect(validatePhone('')).toBe('El teléfono es obligatorio');
            expect(validatePhone(null)).toBe('El teléfono es obligatorio');
            expect(validatePhone('1234567')).toBe('Debe tener 10 dígitos y empezar con 0');
            expect(validatePhone('1991234567')).toBe('Debe tener 10 dígitos y empezar con 0');
            expect(validatePhone('099123456A')).toBe('Debe tener 10 dígitos y empezar con 0');
        });
    });

    describe('3. Salary, Age & Chronological Date Validation (Código del Trabajo Ecuador)', () => {
        it('Should validate positive salary amounts', () => {
            expect(validateSalary(460)).toBeNull();
            expect(validateSalary('1200.50')).toBeNull();
            expect(validateSalary('')).toBe('El salario es obligatorio');
            expect(validateSalary(undefined)).toBe('El salario es obligatorio');
            expect(validateSalary(-100)).toBe('Debe ser un número mayor a 0');
            expect(validateSalary(0)).toBe('Debe ser un número mayor a 0');
            expect(validateSalary('invalido')).toBe('Debe ser un número mayor a 0');
        });

        it('Should enforce minimum working age of 18 years', () => {
            const referenceDate = new Date('2026-08-21');
            
            // Persona nacida en 2000 (26 años) -> Válido
            expect(validateAge('2000-01-01', referenceDate)).toBeNull();

            // Persona nacida en 2010 (16 años) -> Inválido
            const ageError = validateAge('2010-01-01', referenceDate);
            expect(ageError).toContain('El empleado debe haber tenido al menos 18 años');

            expect(validateAge('')).toBe('La fecha de nacimiento es obligatoria');
            expect(validateAge(null)).toBe('La fecha de nacimiento es obligatoria');
        });

        it('Should validate chronological consistency of birth date vs hire date', () => {
            expect(validateDates('2000-01-01', '2024-01-01')).toBeNull();
            expect(validateDates('2025-01-01', '2020-01-01')).toBe('La fecha de nacimiento debe ser anterior a la de contratación');
            expect(validateDates(null, '2020-01-01')).toBeNull();
        });
    });

});
