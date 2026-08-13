import { describe, it, expect, vi, beforeEach } from 'vitest';
import causalInferenceService from '../src/services/ai/causalInferenceService.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        employee: {
            findMany: vi.fn()
        },
        causalIntervention: {
            create: vi.fn(),
            findMany: vi.fn()
        }
    }
}));

describe('Causal AI Engine (Inferencia Causal Contrafactual) Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate propensity scores e(X) correctly over covariates', () => {
        const mockEmployees = [
            { id: 'emp1', salary: '1200', hireDate: new Date('2022-01-01'), department: 'Tecnología', absences: [], evaluations: [{ finalScore: 90 }] },
            { id: 'emp2', salary: '700', hireDate: new Date('2024-01-01'), department: 'Ventas', absences: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }], evaluations: [{ finalScore: 60 }] }
        ];

        const scored = causalInferenceService.calculatePropensityScores(mockEmployees, 'SALARY_INCREASE');
        expect(scored).toHaveLength(2);
        expect(scored[0].propensityScore).toBeGreaterThan(0);
        expect(scored[1].propensityScore).toBeGreaterThan(0);
        expect(scored[0].decryptedSalaryVal).toBe(1200);
    });

    it('should run causal intervention simulation and calculate ATE and Net ROI', async () => {
        const mockEmployees = [
            { id: 'emp1', salary: '1000', hireDate: new Date('2021-01-01'), department: 'IT', absences: [], evaluations: [{ finalScore: 85 }] },
            { id: 'emp2', salary: '900', hireDate: new Date('2022-06-01'), department: 'IT', absences: [{ id: 'a1' }], evaluations: [{ finalScore: 75 }] },
            { id: 'emp3', salary: '800', hireDate: new Date('2023-01-01'), department: 'IT', absences: [], evaluations: [{ finalScore: 80 }] }
        ];

        prisma.employee.findMany.mockResolvedValue(mockEmployees);
        prisma.causalIntervention.create.mockImplementation(({ data }) => Promise.resolve({
            id: 'causal_123',
            ...data,
            createdAt: new Date()
        }));

        const result = await causalInferenceService.runCausalInterventionSimulation({
            tenantId: 'tenant_test',
            treatmentType: 'SALARY_INCREASE',
            treatmentValue: 10,
            targetDepartment: 'IT'
        });

        expect(result.sampleSize).toBe(3);
        expect(result.impact.ate).toBeLessThan(0); // ATE negativo indica reducción de probabilidad de fuga
        expect(result.financials.savingsEstimate).toBeGreaterThan(0);
        expect(result.impact.confidenceInterval95).toHaveLength(2);
    });

    it('should retrieve intervention history for tenant', async () => {
        const mockHistory = [
            {
                id: 'causal_1',
                title: 'Intervención Teletrabajo',
                treatmentType: 'REMOTE_WORK',
                treatmentValue: 2,
                targetDepartment: 'ALL',
                sampleSize: 15,
                ate: -0.15,
                baselineTurnoverRate: 0.25,
                counterfactualTurnoverRate: 0.10,
                costEstimate: 2700,
                savingsEstimate: 12000,
                netRoi: 9300,
                confidenceIntervalLower: -0.18,
                confidenceIntervalUpper: -0.12,
                createdAt: new Date()
            }
        ];

        prisma.causalIntervention.findMany.mockResolvedValue(mockHistory);

        const history = await causalInferenceService.getInterventionHistory('tenant_test');
        expect(history).toHaveLength(1);
        expect(history[0].title).toBe('Intervención Teletrabajo');
        expect(history[0].netRoi).toBe(9300);
    });
});
