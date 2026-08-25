import { describe, it, expect, vi, beforeEach } from 'vitest';
import salaryAdvanceService from '../src/services/payroll/salaryAdvanceService.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        employee: {
            findUnique: vi.fn(),
            findFirst: vi.fn()
        },
        contract: {
            findFirst: vi.fn()
        },
        salaryAdvance: {
            create: vi.fn(),
            findMany: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            update: vi.fn()
        }
    }
}));

vi.mock('../src/repositories/audit/auditRepository.js', () => ({
    default: {
        createLog: vi.fn().mockResolvedValue({}),
        log: vi.fn().mockResolvedValue({})
    }
}));

describe('Salary Advance & Employee Loan Service Test Suite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create an advance request when parameters are valid and monthly quota <= 50%', async () => {
        prisma.contract.findFirst.mockResolvedValue({
            id: 'ctr_1',
            salary: 1000.00,
            status: 'Active'
        });

        prisma.salaryAdvance.create.mockResolvedValue({
            id: 'adv_1',
            employeeId: 'emp_1',
            amount: 400.00,
            installments: 2,
            monthlyDeduction: 200.00,
            status: 'PENDING',
            employee: { id: 'emp_1', firstName: 'Luis', lastName: 'Vera' }
        });

        const result = await salaryAdvanceService.requestAdvance({
            employeeId: 'emp_1',
            amount: 400,
            installments: 2,
            reason: 'Gastos Médicos'
        });

        expect(result).toBeDefined();
        expect(result.id).toBe('adv_1');
        expect(result.monthlyDeduction).toBe(200.00);
        expect(result.status).toBe('PENDING');
    });

    it('should reject advance request if monthly quota exceeds 50% of base salary', async () => {
        prisma.contract.findFirst.mockResolvedValue({
            id: 'ctr_1',
            salary: 800.00, // 50% max = $400
            status: 'Active'
        });

        // Requesting 600 in 1 installment -> monthly deduction $600 > $400
        await expect(salaryAdvanceService.requestAdvance({
            employeeId: 'emp_1',
            amount: 600,
            installments: 1,
            reason: 'Emergencia'
        })).rejects.toThrow('supera el límite del 50% de tu sueldo base mensual');
    });

    it('should reject advance request if employee has no active contract', async () => {
        prisma.contract.findFirst.mockResolvedValue(null);
        prisma.employee.findUnique.mockResolvedValue(null);

        await expect(salaryAdvanceService.requestAdvance({
            employeeId: 'emp_2',
            amount: 200,
            installments: 1
        })).rejects.toThrow('No se encontró un salario base activo registrado para validar el límite de anticipo');
    });

    it('should approve advance and transition status from PENDING to APPROVED', async () => {
        prisma.salaryAdvance.findFirst.mockResolvedValue({
            id: 'adv_1',
            amount: 300,
            installments: 1,
            status: 'PENDING',
            employee: { id: 'emp_1', firstName: 'Luis', lastName: 'Vera', email: 'luis@test.ec' }
        });

        prisma.salaryAdvance.update.mockResolvedValue({
            id: 'adv_1',
            status: 'APPROVED',
            approvedBy: 'admin_1',
            approvedAt: new Date()
        });

        const result = await salaryAdvanceService.approveAdvance('adv_1', 'admin_1');
        expect(result.status).toBe('APPROVED');
        expect(result.approvedBy).toBe('admin_1');
    });

    it('should reject advance with reason and transition to REJECTED', async () => {
        prisma.salaryAdvance.findFirst.mockResolvedValue({
            id: 'adv_1',
            amount: 300,
            status: 'PENDING',
            employee: { id: 'emp_1', firstName: 'Luis', lastName: 'Vera' }
        });

        prisma.salaryAdvance.update.mockResolvedValue({
            id: 'adv_1',
            status: 'REJECTED',
            rejectionReason: 'Falta documentación de respaldo'
        });

        const result = await salaryAdvanceService.rejectAdvance('adv_1', 'Falta documentación de respaldo', 'admin_1');
        expect(result.status).toBe('REJECTED');
        expect(result.rejectionReason).toBe('Falta documentación de respaldo');
    });

    it('should allow employee to cancel their own PENDING advance request', async () => {
        prisma.salaryAdvance.findUnique.mockResolvedValue({
            id: 'adv_1',
            employeeId: 'emp_1',
            status: 'PENDING'
        });

        prisma.salaryAdvance.update.mockResolvedValue({
            id: 'adv_1',
            status: 'CANCELLED'
        });

        const result = await salaryAdvanceService.cancelAdvance('adv_1', 'emp_1');
        expect(result.status).toBe('CANCELLED');
    });
});
