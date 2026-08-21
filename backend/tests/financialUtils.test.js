import { describe, it, expect } from 'vitest';
import { financial } from '../src/utils/financialUtils.js';
import { Decimal } from 'decimal.js';

describe('Financial Utilities & Arbitrary-Precision Arithmetic Test Suite', () => {

    describe('1. Decimal Conversion & Rounding (ROUND_HALF_UP)', () => {
        it('should accurately convert numbers and strings to Decimal instances', () => {
            const decFromNum = financial.from(1234.56);
            const decFromStr = financial.from('9876.54');
            const decFromNull = financial.from(null);
            const decFromUndefined = financial.from(undefined);

            expect(decFromNum).toBeInstanceOf(Decimal);
            expect(decFromNum.toNumber()).toBe(1234.56);
            expect(decFromStr.toNumber()).toBe(9876.54);
            expect(decFromNull.toNumber()).toBe(0);
            expect(decFromUndefined.toNumber()).toBe(0);
        });

        it('should round numbers according to standard financial half-up rule (2 decimals)', () => {
            // Half-up rounding cases
            expect(financial.round(10.555)).toBe(10.56);
            expect(financial.round(10.554)).toBe(10.55);
            expect(financial.round(10.556)).toBe(10.56);
            expect(financial.round('450.125')).toBe(450.13);
            expect(financial.round(0)).toBe(0);
        });

        it('should support custom decimal places rounding', () => {
            expect(financial.round(123.456789, 4)).toBe(123.4568);
            expect(financial.round(123.456789, 0)).toBe(123);
        });
    });

    describe('2. Percentage Calculations', () => {
        it('should calculate statutory IESS percentages accurately without floating point drift', () => {
            const baseSalary = 1200.00;
            // Aporte personal 9.45%
            const iessPersonal = financial.percentage(baseSalary, 9.45);
            expect(financial.round(iessPersonal)).toBe(113.40);

            // Aporte patronal 12.15%
            const iessPatronal = financial.percentage(baseSalary, 12.15);
            expect(financial.round(iessPatronal)).toBe(145.80);

            // Fondos de reserva 8.33%
            const reserveFund = financial.percentage(baseSalary, 8.33);
            expect(financial.round(reserveFund)).toBe(99.96);
        });

        it('should calculate 0% and 100% percentages properly', () => {
            expect(financial.round(financial.percentage(500, 0))).toBe(0);
            expect(financial.round(financial.percentage(500, 100))).toBe(500);
        });
    });

    describe('3. Variadic Sum and Subtraction Operations', () => {
        it('should sum multiple operands safely with exact precision', () => {
            const total = financial.sum(100.10, 200.20, 300.30, null, 0.05);
            expect(financial.round(total)).toBe(600.65);
        });

        it('should subtract multiple deductions from base salary accurately', () => {
            const grossSalary = 1000.00;
            const iess = 94.50;
            const advance = 150.00;
            const loan = 50.25;

            const netSalary = financial.subtract(grossSalary, iess, advance, loan);
            expect(financial.round(netSalary)).toBe(705.25);
        });
    });

    describe('4. Multiplication & Division Operations', () => {
        it('should compute hourly rates with exact division (base 240 hours)', () => {
            const baseSalary = 960.00;
            const hourlyRate = financial.divide(baseSalary, 240);
            expect(financial.round(hourlyRate)).toBe(4.00);

            // 13th salary: base / 12
            const thirteenth = financial.divide(1200, 12);
            expect(financial.round(thirteenth)).toBe(100.00);

            // 14th salary: SBU (460) / 12
            const fourteenth = financial.divide(460, 12);
            expect(financial.round(fourteenth)).toBe(38.33);
        });

        it('should calculate overtime rates with exact multiplication', () => {
            const hourlyRate = financial.from(5.00);
            // 50% surcharge (1.5x)
            const supp50 = financial.multiply(financial.multiply(hourlyRate, 1.5), 10);
            expect(financial.round(supp50)).toBe(75.00);

            // 100% surcharge (2.0x)
            const extra100 = financial.multiply(financial.multiply(hourlyRate, 2.0), 8);
            expect(financial.round(extra100)).toBe(80.00);
        });
    });
});
