import { describe, it, expect, vi, beforeEach } from 'vitest';
import offboardingService from '../src/services/employees/offboardingService.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        employee: {
            findUnique: vi.fn()
        },
        absenceRequest: {
            findMany: vi.fn().mockResolvedValue([])
        },
        employeeAsset: {
            findMany: vi.fn().mockResolvedValue([])
        },
        offboardingRecord: {
            create: vi.fn()
        }
    }
}));

describe('Offboarding & Settlement Calculation Tests (Código de Trabajo Ecuador)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Should correctly compute settlement simulation for voluntary resignation with 2 full years of service', async () => {
        const mockEmployee = {
            id: 'emp_1',
            firstName: 'Carlos',
            lastName: 'Mendoza',
            identityCard: '1712345678',
            department: 'Tecnología',
            position: 'Desarrollador',
            contracts: [{
                startDate: new Date('2024-01-01'),
                salary: 1000.00
            }]
        };

        prisma.employee.findUnique.mockResolvedValue(mockEmployee);
        prisma.absenceRequest.findMany.mockResolvedValue([]);

        const result = await offboardingService.simulateSettlement({
            employeeId: 'emp_1',
            exitDate: new Date('2026-01-01'),
            causal: 'VOLUNTARY_RESIGNATION'
        });

        expect(result).toBeDefined();
        expect(result.baseSalary).toBe(1000.00);
        // Desahucio: 25% de 1000 * 2 años = $500.00
        expect(result.desahucioAmount).toBe(500.00);
        // Despido intempestivo en renuncia voluntaria debe ser 0
        expect(result.severanceAmount).toBe(0);
        // Vacaciones pendientes: 732 días trabajados (incluye bisiesto 2024) -> 30.5 días = $1016.67
        expect(result.vacationAmount).toBe(1016.67);
        expect(result.totalSettlement).toBeGreaterThan(1500.00);
    });

    it('Should correctly compute unfair dismissal severance for employee with <= 3 years of service (3 months base salary)', async () => {
        const mockEmployee = {
            id: 'emp_2',
            firstName: 'Ana',
            lastName: 'Silva',
            identityCard: '0912345678',
            department: 'Ventas',
            position: 'Ejecutiva',
            contracts: [{
                startDate: new Date('2024-06-01'),
                salary: 800.00
            }]
        };

        prisma.employee.findUnique.mockResolvedValue(mockEmployee);
        prisma.absenceRequest.findMany.mockResolvedValue([]);

        const result = await offboardingService.simulateSettlement({
            employeeId: 'emp_2',
            exitDate: new Date('2025-12-01'), // 1.5 años de servicio
            causal: 'UNFAIR_DISMISSAL'
        });

        expect(result).toBeDefined();
        // Indemnización por despido intempestivo <= 3 años: 3 meses de salario = 3 * 800 = 2400.00
        expect(result.severanceAmount).toBe(2400.00);
        // Desahucio: 1 año completo * 25% de 800 = 200.00
        expect(result.desahucioAmount).toBe(200.00);
        expect(result.totalSettlement).toBeGreaterThan(2600.00);
    });

    it('Should correctly compute unfair dismissal severance for employee with > 3 years of service (1 month per year)', async () => {
        const mockEmployee = {
            id: 'emp_3',
            firstName: 'Roberto',
            lastName: 'Gómez',
            identityCard: '0102345678',
            department: 'Operaciones',
            position: 'Supervisor',
            contracts: [{
                startDate: new Date('2020-01-01'),
                salary: 1200.00
            }]
        };

        prisma.employee.findUnique.mockResolvedValue(mockEmployee);
        prisma.absenceRequest.findMany.mockResolvedValue([]);

        const result = await offboardingService.simulateSettlement({
            employeeId: 'emp_3',
            exitDate: new Date('2025-06-01'), // 5.42 años de servicio -> Math.ceil = 6 años a indemnizar
            causal: 'UNFAIR_DISMISSAL'
        });

        expect(result).toBeDefined();
        // Indemnización > 3 años: 6 años * 1200 = $7200.00
        expect(result.severanceAmount).toBe(7200.00);
        // Desahucio: 5 años completos * (1200 * 0.25) = 5 * 300 = $1500.00
        expect(result.desahucioAmount).toBe(1500.00);
        expect(result.totalSettlement).toBeGreaterThan(8700.00);
    });

    it('Should reject exit date earlier than contract start date', async () => {
        const mockEmployee = {
            id: 'emp_4',
            firstName: 'Elena',
            lastName: 'Torres',
            contracts: [{
                startDate: new Date('2025-01-01'),
                salary: 1000.00
            }]
        };

        prisma.employee.findUnique.mockResolvedValue(mockEmployee);

        await expect(offboardingService.simulateSettlement({
            employeeId: 'emp_4',
            exitDate: new Date('2024-01-01'),
            causal: 'VOLUNTARY_RESIGNATION'
        })).rejects.toThrow('La fecha de salida no puede ser anterior a la fecha de inicio de contrato');
    });
});
