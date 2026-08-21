import { describe, it, expect } from 'vitest';
import {
    computePrivacyAccountant,
    computeEpsilonPerRound
} from '../src/utils/rdpAccountant.js';

describe('Rényi Differential Privacy (RDP) Moments Accountant Test Suite', () => {

    it('should calculate valid (epsilon, delta)-DP bounds for single and multi-round DP-SGD', () => {
        const result = computePrivacyAccountant({
            rounds: 10,
            noiseMultiplier: 1.2,
            delta: 1e-5,
            samplingRate: 0.1
        });

        expect(result).toBeDefined();
        expect(result.rounds).toBe(10);
        expect(result.noiseMultiplier).toBe(1.2);
        expect(result.delta).toBe(1e-5);
        expect(result.samplingRate).toBe(0.1);
        expect(result.epsilonPerRound).toBeGreaterThan(0);
        expect(result.epsilonAccumulated).toBeGreaterThan(result.epsilonPerRound);
        expect(result.optimalAlpha).toBeGreaterThan(1);
        expect(result.privacyGuarantee).toContain('(epsilon=');
    });

    it('should enforce monotonicity: higher noise multiplier must produce smaller epsilon (stronger privacy)', () => {
        const lowNoise = computePrivacyAccountant({
            rounds: 5,
            noiseMultiplier: 0.8,
            delta: 1e-5,
            samplingRate: 0.1
        });

        const highNoise = computePrivacyAccountant({
            rounds: 5,
            noiseMultiplier: 2.0,
            delta: 1e-5,
            samplingRate: 0.1
        });

        expect(highNoise.epsilonAccumulated).toBeLessThan(lowNoise.epsilonAccumulated);
    });

    it('should amplify privacy via Poisson subsampling (samplingRate < 1.0 reduces epsilon)', () => {
        const fullSampling = computePrivacyAccountant({
            rounds: 5,
            noiseMultiplier: 1.5,
            delta: 1e-5,
            samplingRate: 1.0
        });

        const subSampled = computePrivacyAccountant({
            rounds: 5,
            noiseMultiplier: 1.5,
            delta: 1e-5,
            samplingRate: 0.05
        });

        expect(subSampled.epsilonAccumulated).toBeLessThan(fullSampling.epsilonAccumulated);
    });

    it('should compute epsilon per round helper correctly', () => {
        const eps = computeEpsilonPerRound(1.5, 1e-5, 0.1);
        expect(eps).toBeGreaterThan(0);
        expect(Number.isFinite(eps)).toBe(true);
    });

    it('should validate inputs strictly and throw for illegal parameters', () => {
        expect(() => computePrivacyAccountant({ rounds: 0, noiseMultiplier: 1.0, delta: 1e-5 })).toThrow('rounds debe ser > 0');
        expect(() => computePrivacyAccountant({ rounds: 10, noiseMultiplier: -1, delta: 1e-5 })).toThrow('noiseMultiplier debe ser > 0');
        expect(() => computePrivacyAccountant({ rounds: 10, noiseMultiplier: 1.0, delta: 1.5 })).toThrow('delta debe estar en (0, 1)');
        expect(() => computePrivacyAccountant({ rounds: 10, noiseMultiplier: 1.0, delta: 1e-5, samplingRate: 0 })).toThrow('samplingRate debe estar en (0, 1]');
    });
});
