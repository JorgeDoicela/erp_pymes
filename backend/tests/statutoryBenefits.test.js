import { describe, it, expect, vi, beforeEach } from 'vitest';
import statutoryBenefitsService from '../src/services/compliance/statutoryBenefitsService.js';
import complianceService from '../src/services/compliance/complianceService.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        employee: {
            findMany: vi.fn()
        },
        contract: {
            findMany: vi.fn()
        },
        document: {
            findMany: vi.fn()
        }
    }
}));

describe('Statutory Benefits & Compliance Service Tests (Ecuador)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Should correctly calculate employer provisions for active employees (13th, 14th, Reserve Fund, Vacation)', async () => {
        const mockEmployees = [
            {
                id: 'emp_1',
                firstName: 'Juan',
                lastName: 'Pérez',
                identityCard: '1720000001',
                department: 'Finanzas',
                position: 'Contador',
                contracts: [{
                    startDate: new Date('2024-01-01'),
                    endDate: null,
                    salary: 1200.00,
                    status: 'Active'
                }]
            },
            {
                id: 'emp_2',
                firstName: 'María',
                lastName: 'López',
                identityCard: '1720000002',
                department: 'Operaciones',
                position: 'Asistente',
                contracts: [{
                    startDate: new Date('2026-05-01'), // Menos de 1 año (sin fondos de reserva)
                    endDate: null,
                    salary: 600.00,
                    status: 'Active'
                }]
            }
        ];

        prisma.employee.findMany.mockResolvedValue(mockEmployees);

        const result = await statutoryBenefitsService.calculateStatutoryProvisions(8, 2026, 'tenant_1');

        expect(result).toBeDefined();
        expect(result.summary.totalEmployees).toBe(2);

        const emp1 = result.provisionsList.find(p => p.employee.id === 'emp_1');
        expect(emp1.baseSalary).toBe(1200.00);
        expect(emp1.thirteenthProvision).toBe(100.00); // 1200 / 12
        expect(emp1.fourteenthProvision).toBe(38.33); // 460 / 12
        expect(emp1.reserveFundProvision).toBe(100.00); // 1200 / 12 (antigüedad > 1 año)
        expect(emp1.vacationProvision).toBe(50.00); // 1200 / 24
        expect(emp1.totalEmpProvision).toBe(288.33);

        const emp2 = result.provisionsList.find(p => p.employee.id === 'emp_2');
        expect(emp2.baseSalary).toBe(600.00);
        expect(emp2.thirteenthProvision).toBe(50.00);
        expect(emp2.fourteenthProvision).toBe(38.33);
        expect(emp2.reserveFundProvision).toBe(0); // Antigüedad < 1 año
        expect(emp2.vacationProvision).toBe(25.00);
        expect(emp2.totalEmpProvision).toBe(113.33);
    });

    it('Should correctly generate compliance alerts for 90-day probation period and expiring contracts', async () => {
        const today = new Date();
        const startProbation = new Date(today);
        startProbation.setDate(startProbation.getDate() - 80); // Faltan 10 días para cumplir 90

        const mockContracts = [
            {
                id: 'ctr_1',
                startDate: startProbation,
                endDate: null,
                type: 'INDEFINITE',
                status: 'Active',
                employee: {
                    id: 'emp_1',
                    firstName: 'Carlos',
                    lastName: 'Mendoza',
                    identityCard: '1720000003',
                    department: 'Ventas',
                    position: 'Ejecutivo'
                }
            }
        ];

        prisma.contract.findMany.mockResolvedValue(mockContracts);
        prisma.document.findMany.mockResolvedValue([]);

        const alertsResult = await complianceService.getComplianceAlerts('tenant_1');

        expect(alertsResult).toBeDefined();
        expect(alertsResult.summary.probationCount).toBe(1);
        expect(alertsResult.alerts[0].type).toBe('PROBATION_PERIOD');
        expect(alertsResult.alerts[0].urgency).toBe('CRITICAL'); // <= 10 días restantes
    });
});
