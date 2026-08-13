import { describe, it, expect, vi, beforeEach } from 'vitest';
import federatedLearningService from '../src/services/ai/federatedLearningService.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        tenant: {
            findMany: vi.fn()
        },
        employee: {
            count: vi.fn()
        },
        tenantPrivacyBudget: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
        },
        federatedRound: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn()
        }
    }
}));

describe('Federated Meta-Learning with Differential Privacy (DP-SGD) Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize and return tenant privacy budget status', async () => {
        prisma.tenantPrivacyBudget.findUnique.mockResolvedValue(null);
        prisma.tenantPrivacyBudget.create.mockResolvedValue({
            tenantId: 'tenant_1',
            epsilonBudgetMax: 10.0,
            epsilonSpent: 0.35,
            delta: 1e-5,
            roundsParticipated: 1,
            lastContributionAt: new Date()
        });

        const status = await federatedLearningService.getTenantPrivacyStatus('tenant_1');

        expect(status).toBeDefined();
        expect(status.epsilonBudgetMax).toBe(10.0);
        expect(status.epsilonSpent).toBe(0.35);
        expect(status.privacyGuarantee).toContain('Differential Privacy');
    });

    it('should compute local gradient with L2 clipping and Gaussian noise addition (DP-SGD)', async () => {
        prisma.employee.count.mockResolvedValue(25);
        prisma.tenantPrivacyBudget.update.mockResolvedValue({ id: 'budget_1' });

        const localGrad = await federatedLearningService.computeLocalPrivateGradient('tenant_1', {}, 1.0, 0.5);

        expect(localGrad.tenantId).toBe('tenant_1');
        expect(localGrad.sampleSize).toBe(25);
        expect(localGrad.noisyGradient).toBeDefined();
        expect(localGrad.noisyGradient.beta_salary).toBeDefined();
    });

    it('should execute global federated round with FedAvg aggregation across tenants', async () => {
        const mockTenants = [{ id: 'tenant_1' }, { id: 'tenant_2' }];
        prisma.tenant.findMany.mockResolvedValue(mockTenants);
        prisma.tenantPrivacyBudget.findUnique.mockResolvedValue({
            tenantId: 'tenant_1',
            epsilonBudgetMax: 10.0,
            epsilonSpent: 1.2,
            delta: 1e-5,
            roundsParticipated: 3
        });
        prisma.employee.count.mockResolvedValue(15);
        prisma.tenantPrivacyBudget.update.mockResolvedValue({});
        prisma.federatedRound.findFirst.mockResolvedValue(null);
        prisma.federatedRound.create.mockImplementation(({ data }) => Promise.resolve({
            id: 'round_1',
            ...data,
            createdAt: new Date()
        }));

        const result = await federatedLearningService.executeFederatedRound(['tenant_1', 'tenant_2']);

        expect(result.round).toBe(1);
        expect(result.participatingTenantsCount).toBe(2);
        expect(result.globalBrierScore).toBeLessThan(0.185);
        expect(result.globalWeights).toBeDefined();
    });
});
