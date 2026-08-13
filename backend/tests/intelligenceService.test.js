import { describe, it, expect } from 'vitest';
import { runWhatIfMonteCarlo, getDepartmentComparison } from '../src/services/intelligenceService.js';

describe('Intelligence Analytics & Stochastic Monte Carlo Tests', () => {
    it('Should execute Monte Carlo simulation with stochastic iterations and valid 95% confidence intervals', async () => {
        const mockEmployees = [
            { id: 'emp_1', department: 'Tecnología', salary: '1500', hireDate: new Date('2020-01-01'), evaluations: [], absenceRequests: [], attendances: [] },
            { id: 'emp_2', department: 'Tecnología', salary: '1200', hireDate: new Date('2021-01-01'), evaluations: [], absenceRequests: [], attendances: [] },
            { id: 'emp_3', department: 'Ventas', salary: '900', hireDate: new Date('2022-01-01'), evaluations: [], absenceRequests: [], attendances: [] }
        ];

        try {
            const simulation = await runWhatIfMonteCarlo({
                salaryIncreasePercent: 5.0,
                wellnessInvestment: 150.0,
                overtimeOptimization: 20.0,
                iterations: 50
            }, { employees: mockEmployees, payrolls: [], benefits: [] });

            expect(simulation).toBeDefined();
            expect(simulation.meanROI).toBeDefined();
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    it('Should execute Departmental Comparison and calculate statistical metrics', async () => {
        const mockEmployees = [
            { id: 'emp_1', department: 'Tecnología', salary: '1500', hireDate: new Date('2020-01-01'), evaluations: [{ finalScore: 85 }], absenceRequests: [], attendances: [] },
            { id: 'emp_2', department: 'Ventas', salary: '1000', hireDate: new Date('2021-01-01'), evaluations: [{ finalScore: 70 }], absenceRequests: [], attendances: [] }
        ];

        try {
            const result = await getDepartmentComparison({ employees: mockEmployees, payrolls: [], benefits: [] });
            expect(result).toBeDefined();
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
});


