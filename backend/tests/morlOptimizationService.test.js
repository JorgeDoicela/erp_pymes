import { describe, it, expect, vi, beforeEach } from 'vitest';
import morlOptimizationService from '../src/services/ai/morlOptimizationService.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        employee: {
            findMany: vi.fn()
        },
        morlPolicyRun: {
            create: vi.fn(),
            findMany: vi.fn()
        },
        rsiCalibration: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
                weightsJson: JSON.stringify({ beta_salary: -0.85, beta_absence: 0.35 })
            })
        }
    }
}));

describe('MORL Engine (Aprendizaje por Refuerzo Multiobjetivo & Frontera de Pareto) Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should correctly filter non-dominated Pareto points', () => {
        const candidatePoints = [
            { totalCostEstimate: 5000, expectedRetentionRate: 80.0 },
            { totalCostEstimate: 8000, expectedRetentionRate: 85.0 },
            { totalCostEstimate: 8000, expectedRetentionRate: 82.0 }, // Dominado por el de 85.0
            { totalCostEstimate: 12000, expectedRetentionRate: 92.0 }
        ];

        const nonDominated = morlOptimizationService.filterNonDominatedParetoPoints(candidatePoints);

        expect(nonDominated).toHaveLength(3);
        expect(nonDominated[0].totalCostEstimate).toBe(5000);
        expect(nonDominated[1].totalCostEstimate).toBe(8000);
        expect(nonDominated[1].expectedRetentionRate).toBe(85.0);
        expect(nonDominated[2].totalCostEstimate).toBe(12000);
    });

    it('should run MORL vector Q-learning optimization and generate Pareto Frontier', async () => {
        const mockEmployees = [
            { id: 'emp1', firstName: 'Juan', lastName: 'Pérez', salary: '1200', department: 'Tecnología', absences: [], evaluations: [{ finalScore: 88 }] },
            { id: 'emp2', firstName: 'Maria', lastName: 'Gómez', salary: '900', department: 'Tecnología', absences: [{ id: 'a1' }], evaluations: [{ finalScore: 75 }] },
            { id: 'emp3', firstName: 'Carlos', lastName: 'Ruiz', salary: '800', department: 'Tecnología', absences: [], evaluations: [{ finalScore: 82 }] }
        ];

        prisma.employee.findMany.mockResolvedValue(mockEmployees);
        prisma.morlPolicyRun.create.mockImplementation(({ data }) => Promise.resolve({
            id: 'morl_run_1',
            ...data,
            createdAt: new Date()
        }));

        const result = await morlOptimizationService.runMorlParetoOptimization({
            tenantId: 'tenant_test',
            budgetLimit: 10000,
            targetDepartment: 'Tecnología'
        });

        expect(result.sampleSize).toBe(3);
        expect(result.paretoFrontier.length).toBeGreaterThan(0);
        expect(result.paretoFrontier[0].expectedRetentionRate).toBeDefined();
        expect(result.paretoFrontier[0].actionBreakdown).toBeDefined();
    });

    it('should retrieve MORL history for tenant', async () => {
        const mockHistory = [
            {
                id: 'morl_1',
                title: 'Optimización MORL IT',
                budgetLimit: 15000,
                targetDepartment: 'IT',
                sampleSize: 20,
                frontierPoints: [{ id: 'pt1' }, { id: 'pt2' }, { id: 'pt3' }],
                selectedPointIndex: 1,
                createdAt: new Date()
            }
        ];

        prisma.morlPolicyRun.findMany.mockResolvedValue(mockHistory);

        const history = await morlOptimizationService.getMorlHistory('tenant_test');
        expect(history).toHaveLength(1);
        expect(history[0].title).toBe('Optimización MORL IT');
        expect(history[0].paretoPointsCount).toBe(3);
    });
});
