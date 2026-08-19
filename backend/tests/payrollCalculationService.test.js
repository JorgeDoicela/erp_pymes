import { describe, it, expect, vi, beforeEach } from 'vitest';
import payrollCalculationService from '../src/services/payroll/payrollCalculationService.js';
import payrollConfigService from '../src/services/payroll/payrollConfigService.js';
import { financial } from '../src/utils/financialUtils.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        payrollConfig: {
            findFirst: vi.fn(),
            updateMany: vi.fn(),
            create: vi.fn()
        },
        payroll: {
            findFirst: vi.fn(),
            create: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn()
        },
        employee: {
            findMany: vi.fn()
        }
    }
}));

describe('Payroll Calculation & Config Service Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate financial rounding correctly using Decimal.js', () => {
        const val1 = financial.from(100.555);
        const rounded = financial.round(val1);
        expect(rounded).toBe(100.56);

        const salary = financial.from(1200);
        const iessDeduction = financial.percentage(salary, 9.45);
        expect(financial.round(iessDeduction)).toBe(113.40);
    });

    it('should return default payroll config with IESS deduction if no active config exists', async () => {
        prisma.payrollConfig.findFirst.mockResolvedValue(null);

        const tenantId = 'test-tenant-123';
        const config = await payrollConfigService.getConfig(tenantId);
        expect(config).toBeDefined();
        expect(config.workingDays).toBe(30);
        expect(config.items).toHaveLength(1);
        expect(config.items[0].name).toBe('Aporte Personal IESS');
        expect(config.items[0].percentage).toBe(9.45);
    });

    it('should throw an error when generating payroll for period with no active employee contracts', async () => {
        prisma.payroll.findFirst.mockResolvedValue(null);
        prisma.payrollConfig.findFirst.mockResolvedValue({
            id: 'cfg-1',
            workingDays: 30,
            items: []
        });
        prisma.employee.findMany.mockResolvedValue([]);

        await expect(payrollCalculationService.generatePayroll(1, 2026, 'admin-1', 'non-existent-tenant'))
            .rejects
            .toThrow('No se encontraron empleados con contratos activos para el periodo 1/2026.');
    });

    it('should compute exact fractions for 13th, 14th, Reserve Fund and Vacation provisions', () => {
        const salary = financial.from(1200);
        // Décimo Tercero: 1/12
        const thirteenth = financial.divide(salary, 12);
        expect(financial.round(thirteenth)).toBe(100.00);

        // Décimo Cuarto: SBU ($460) / 12
        const fourteenth = financial.divide(financial.from(460), 12);
        expect(financial.round(fourteenth)).toBe(38.33);

        // Fondos de Reserva: 1/12 (8.333%)
        const reserveFund = financial.divide(salary, 12);
        expect(financial.round(reserveFund)).toBe(100.00);

        // Vacaciones: 15 / 360 = 1/24
        const vacation = financial.divide(salary, 24);
        expect(financial.round(vacation)).toBe(50.00);
    });

    it('should compute exact prorated provisions for partial month hires', () => {
        const salary = financial.from(900);
        const workedDays = 15;
        const proratedSalary = financial.divide(financial.multiply(salary, workedDays), 30);
        expect(financial.round(proratedSalary)).toBe(450.00);

        // 13th prorated: proratedSalary / 12 = 450 / 12 = 37.50
        const thirteenth = financial.divide(proratedSalary, 12);
        expect(financial.round(thirteenth)).toBe(37.50);

        // 14th prorated: SBU * 15 / 360 = 460 * 15 / 360 = 19.17
        const fourteenth = financial.divide(financial.multiply(financial.from(460), workedDays), 360);
        expect(financial.round(fourteenth)).toBe(19.17);
    });

    it('should calculate night shift surcharge (25%) and overtime rates correctly according to Ecuador Labor Code', () => {
        const baseSalary = financial.from(960);
        // Valor hora = 960 / (30 * 8) = 960 / 240 = $4.00
        const hourlyRate = financial.divide(baseSalary, 240);
        expect(financial.round(hourlyRate)).toBe(4.00);

        // Recargo Nocturno (25% s/hora ordinaria): 4.00 * 0.25 = $1.00 por hora nocturna
        const nightSurchargePerHour = hourlyRate.mul(0.25);
        expect(financial.round(nightSurchargePerHour)).toBe(1.00);

        // 20 horas nocturnas = 20 * 1.00 = $20.00
        const totalNightSurcharge = nightSurchargePerHour.mul(20);
        expect(financial.round(totalNightSurcharge)).toBe(20.00);

        // Horas Suplementarias (50% de recargo = 1.5 * valor hora): 10 horas * 4.00 * 1.5 = $60.00
        const overtime50 = hourlyRate.mul(1.5).mul(10);
        expect(financial.round(overtime50)).toBe(60.00);

        // Horas Extraordinarias/Fines de Semana (100% de recargo = 2.0 * valor hora): 5 horas * 4.00 * 2.0 = $40.00
        const overtime100 = hourlyRate.mul(2.0).mul(5);
        expect(financial.round(overtime100)).toBe(40.00);

        // Materia Gravada IESS: 960 + 20 + 60 + 40 = $1080.00
        const taxableEarnings = baseSalary.plus(totalNightSurcharge).plus(overtime50).plus(overtime100);
        expect(financial.round(taxableEarnings)).toBe(1080.00);

        // Aporte IESS Personal (9.45% de 1080) = $102.06
        const iessPersonal = financial.percentage(taxableEarnings, 9.45);
        expect(financial.round(iessPersonal)).toBe(102.06);
    });

    it('should maintain strict penny parity in settlement and net salary components', () => {
        const baseSalary = 800.00;
        const overtimeAmount = 75.33;
        const totalBonuses = 50.00;
        const totalDeductions = 87.42;

        const netSalary = financial.from(baseSalary)
            .plus(overtimeAmount)
            .plus(totalBonuses)
            .minus(totalDeductions);

        const roundedNet = financial.round(netSalary);
        expect(roundedNet).toBe(837.91);
        expect(baseSalary + overtimeAmount + totalBonuses - totalDeductions).toBeCloseTo(roundedNet, 2);
    });
});

