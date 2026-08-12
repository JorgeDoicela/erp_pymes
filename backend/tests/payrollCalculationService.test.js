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
});

