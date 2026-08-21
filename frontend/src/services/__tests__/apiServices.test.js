import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as intelligenceService from '../intelligenceService.js';
import systemService from '../systemService.js';
import intelligenceClient from '../../api/intelligenceClient.js';
import api from '../../api/axios.js';

vi.mock('../../api/intelligenceClient.js', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

vi.mock('../../api/axios.js', () => ({
    default: {
        get: vi.fn(),
        put: vi.fn()
    }
}));

describe('Frontend API Services Unit Test Suite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('1. Intelligence Service', () => {
        it('should call getDashboard endpoint and return data', async () => {
            intelligenceClient.get.mockResolvedValue({ data: { success: true, health: { score: 90 } } });

            const result = await intelligenceService.getDashboard(true);
            expect(intelligenceClient.get).toHaveBeenCalledWith('/dashboard?refresh=true');
            expect(result.success).toBe(true);
        });

        it('should trigger Monte Carlo simulation with parameters', async () => {
            const params = { iterations: 1000, targetConfidence: 0.95 };
            intelligenceClient.post.mockResolvedValue({ data: { success: true, meanCost: 15400 } });

            const result = await intelligenceService.runWhatIfMonteCarlo(params);
            expect(intelligenceClient.post).toHaveBeenCalledWith('/what-if-monte-carlo', params);
            expect(result.meanCost).toBe(15400);
        });

        it('should trigger Causal AI intervention simulation', async () => {
            const payload = { treatmentType: 'SALARY_INCREASE', treatmentValue: 10 };
            intelligenceClient.post.mockResolvedValue({ data: { ate: -0.12, roi: 8500 } });

            const result = await intelligenceService.runCausalSimulation(payload);
            expect(intelligenceClient.post).toHaveBeenCalledWith('/causal/simulate', payload);
            expect(result.ate).toBe(-0.12);
        });
    });

    describe('2. System Service', () => {
        it('should fetch system settings successfully', async () => {
            api.get.mockResolvedValue({ data: { maintenanceMode: false, globalRadius: 200 } });

            const settings = await systemService.getSettings();
            expect(api.get).toHaveBeenCalledWith('/system/settings');
            expect(settings.globalRadius).toBe(200);
        });

        it('should update system settings via PUT request', async () => {
            const updatePayload = { maintenanceMode: true, maintenanceMessage: 'Actualización en curso' };
            api.put.mockResolvedValue({ data: { success: true, ...updatePayload } });

            const response = await systemService.updateSettings(updatePayload);
            expect(api.put).toHaveBeenCalledWith('/system/settings', updatePayload);
            expect(response.maintenanceMode).toBe(true);
        });
    });
});
