import { describe, it, expect } from 'vitest';
import payrollCalculationService from '../src/services/payroll/payrollCalculationService.js';
import payrollConfigService from '../src/services/payroll/payrollConfigService.js';
import { financial } from '../src/utils/financialUtils.js';

describe('Payroll Calculation & Config Service Tests', () => {
    it('should calculate financial rounding correctly using Decimal.js', () => {
        const val1 = financial.from(100.555);
        const rounded = financial.round(val1);
        expect(rounded).toBe(100.56);

        const salary = financial.from(1200);
        const iessDeduction = financial.percentage(salary, 9.45);
        expect(financial.round(iessDeduction)).toBe(113.40);
    });

    it('should return default payroll config with IESS deduction if no active config exists', async () => {
        const tenantId = 'test-tenant-123';
        const config = await payrollConfigService.getConfig(tenantId);
        expect(config).toBeDefined();
        expect(config.workingDays).toBe(30);
        expect(config.items).toHaveLength(1);
        expect(config.items[0].name).toBe('Aporte Personal IESS');
        expect(config.items[0].percentage).toBe(9.45);
    });

    it('should throw an error when generating payroll for period with no active employee contracts', async () => {
        await expect(payrollCalculationService.generatePayroll(1, 2026, 'admin-1', 'non-existent-tenant'))
            .rejects
            .toThrow();
    });
});
