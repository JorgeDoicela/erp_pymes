import { describe, it, expect, vi, beforeEach } from 'vitest';
import rsiService from '../src/services/ai/rsiService.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        rsiCalibration: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn()
        },
        rsiPredictionAudit: {
            create: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn()
        }
    }
}));

describe('RSI Engine (Recursive Self-Improvement) Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return default hyperparameters when no calibration exists and initialize epoch 1', async () => {
        prisma.rsiCalibration.findFirst.mockResolvedValue(null);
        prisma.rsiCalibration.create.mockResolvedValue({
            epoch: 1,
            brierScore: 0.185,
            logLoss: 0.420,
            weightsJson: JSON.stringify({ beta_salary: -0.85 })
        });

        const params = await rsiService.getTenantModelParameters('tenant_test');
        expect(params).toBeDefined();
        expect(params.beta_salary).toBe(-0.85);
        expect(params.k_weibull).toBe(1.25);
    });

    it('should calculate Brier Score correctly for resolved audits', async () => {
        const mockAudits = [
            { predictedTurnover: 0.8, actualOutcome: 1 }, // (0.8 - 1)^2 = 0.04
            { predictedTurnover: 0.2, actualOutcome: 0 }, // (0.2 - 0)^2 = 0.04
        ];
        prisma.rsiPredictionAudit.findMany.mockResolvedValue(mockAudits);

        const loss = await rsiService.evaluateModelLoss('tenant_test');
        expect(loss.brierScore).toBe(0.04);
        expect(loss.sampleCount).toBe(2);
    });

    it('should run recursive calibration and generate a new epoch with improved Brier Score', async () => {
        prisma.rsiCalibration.findFirst.mockResolvedValueOnce({
            epoch: 1,
            brierScore: 0.185,
            logLoss: 0.420,
            weightsJson: JSON.stringify({ beta_salary: -0.85, beta_absence: 0.35, beta_perf: 1.10, k_weibull: 1.25, lambda_weibull: 48 })
        }).mockResolvedValueOnce({
            epoch: 1,
            brierScore: 0.185
        });

        prisma.rsiPredictionAudit.findMany.mockResolvedValue([]);
        prisma.rsiCalibration.create.mockImplementation(({ data }) => Promise.resolve({
            id: 'calib_123',
            ...data,
            createdAt: new Date()
        }));

        const result = await rsiService.runRecursiveCalibration('tenant_test', 'MANUAL_TEST');
        
        expect(result.epoch).toBe(2);
        expect(result.brierScore).toBeLessThan(0.185);
        expect(result.weights).toBeDefined();
        expect(result.triggerReason).toBe('MANUAL_TEST');
    });

    it('should simulate outcome event and update model parameters', async () => {
        prisma.rsiCalibration.findFirst.mockResolvedValue({
            epoch: 2,
            brierScore: 0.160,
            logLoss: 0.380,
            weightsJson: JSON.stringify({ beta_salary: -0.85, beta_absence: 0.35 })
        });
        prisma.rsiPredictionAudit.create.mockResolvedValue({ id: 'audit_sim' });
        prisma.rsiPredictionAudit.findMany.mockResolvedValue([]);
        prisma.rsiCalibration.create.mockImplementation(({ data }) => Promise.resolve({
            id: 'calib_sim',
            ...data,
            createdAt: new Date()
        }));

        const sim = await rsiService.simulateOutcomeEvent('tenant_test', 'emp_test_1', 1);

        expect(sim.simulatedEmployeeId).toBe('emp_test_1');
        expect(sim.actualOutcome).toBe('RENUNCIA');
        expect(sim.calibration).toBeDefined();
    });
});
