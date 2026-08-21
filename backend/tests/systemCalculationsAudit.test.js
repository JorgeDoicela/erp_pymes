import { describe, it, expect } from 'vitest';
import { financial } from '../src/utils/financialUtils.js';
import { calculateKolmogorovSmirnovTest } from '../src/services/intelligenceService.js';

describe('System-wide Calculations and Data Audit Test Suite (Código del Trabajo Ecuador & Enterprise Standard)', () => {

    describe('1. Payroll & Labor Law Formulas (Código del Trabajo Ecuador)', () => {
        it('Should compute hourly rate accurately using 240 hours standard base', () => {
            const baseSalary = 960.00;
            const workingDays = 30;
            const hourlyRate = financial.divide(financial.from(baseSalary), financial.multiply(workingDays, 8));
            expect(financial.round(hourlyRate)).toBe(4.00);
        });

        it('Should calculate overtime with 50% surcharge (suplementaria) and 100% (extraordinaria)', () => {
            const hourlyRate = financial.from(4.00);
            const supplementaryHours = financial.from(5);
            const extraordinaryHours = financial.from(3);

            const suppCost = supplementaryHours.mul(hourlyRate).mul(1.5);
            const extraCost = extraordinaryHours.mul(hourlyRate).mul(2.0);

            expect(financial.round(suppCost)).toBe(30.00);
            expect(financial.round(extraCost)).toBe(24.00);
            expect(financial.round(suppCost.plus(extraCost))).toBe(54.00);
        });

        it('Should calculate 25% night surcharge correctly (Art. 49 CT: 19h00 a 06h00)', () => {
            const hourlyRate = financial.from(5.00);
            const nightHours = financial.from(6);
            const surcharge = nightHours.mul(hourlyRate).mul(0.25);
            expect(financial.round(surcharge)).toBe(7.50);
        });

        it('Should calculate personal IESS contribution (9.45%) on total taxable base', () => {
            const salary = financial.from(1000.00);
            const overtime = financial.from(120.00);
            const bonus = financial.from(80.00);
            const taxableEarnings = salary.plus(overtime).plus(bonus); // 1200.00

            const iessDeduction = financial.percentage(taxableEarnings, 9.45);
            expect(financial.round(iessDeduction)).toBe(113.40);
        });

        it('Should calculate employer IESS contribution (12.15% general / 11.15% sectorial)', () => {
            const taxableEarnings = financial.from(1000.00);
            const iessPatronal = financial.percentage(taxableEarnings, 12.15);
            expect(financial.round(iessPatronal)).toBe(121.50);
        });

        it('Should calculate 13th, 14th, Reserve Funds (8.33%) and Vacations accurately', () => {
            const annualTaxableEarnings = financial.from(14400.00);
            const thirteenthSalary = financial.divide(annualTaxableEarnings, 12);
            expect(financial.round(thirteenthSalary)).toBe(1200.00);

            const SBU = financial.from(460.00);
            const fourteenthMonthly = financial.divide(SBU, 12);
            expect(financial.round(fourteenthMonthly)).toBe(38.33);

            const monthlySalary = financial.from(1200.00);
            const reserveFunds = financial.percentage(monthlySalary, 8.33);
            expect(financial.round(reserveFunds)).toBe(99.96);

            const vacationMonthlyProvision = financial.divide(monthlySalary, 24);
            expect(financial.round(vacationMonthlyProvision)).toBe(50.00);
        });

        it('Should compute net pay after salary advances, loans and undertime deductions', () => {
            const earnedSalary = financial.from(850.00);
            const overtime = financial.from(50.00);
            const bonuses = financial.from(60.00);
            const iessPersonal = financial.from(90.72);
            const advanceDeduction = financial.from(100.00);
            const undertimeDeduction = financial.from(15.00);

            const totalBonuses = bonuses;
            const totalDeductions = iessPersonal.plus(advanceDeduction).plus(undertimeDeduction);

            const netSalary = earnedSalary.plus(overtime).plus(totalBonuses).minus(totalDeductions);
            expect(financial.round(netSalary)).toBe(754.28);
        });
    });

    describe('2. Settlement and Offboarding Indemnities (Art. 185 and 188)', () => {
        it('Should calculate Desahucio (25% last salary per year of service - Art. 185)', () => {
            const baseSalary = financial.from(1200.00);
            const fullYearsWorked = 4;
            const desahucio = financial.multiply(financial.divide(baseSalary, 4), fullYearsWorked);
            expect(financial.round(desahucio)).toBe(1200.00);
        });

        it('Should calculate Unfair Dismissal Severance for <= 3 years (3 months base - Art. 188)', () => {
            const baseSalary = financial.from(1000.00);
            const yearsWorked = 2.5;
            let severance = financial.from(0);
            if (yearsWorked <= 3) {
                severance = financial.multiply(baseSalary, 3);
            }
            expect(financial.round(severance)).toBe(3000.00);
        });

        it('Should calculate Unfair Dismissal Severance for > 3 years (1 month per year up to 25)', () => {
            const baseSalary = financial.from(800.00);
            const yearsWorked = 6.2;
            const yearsToPay = Math.min(Math.ceil(yearsWorked), 25);
            const severance = financial.multiply(baseSalary, yearsToPay);
            expect(yearsToPay).toBe(7);
            expect(financial.round(severance)).toBe(5600.00);
        });

        it('Should calculate non-taken vacation compensation accurately (15 days per 360 days)', () => {
            const baseSalary = financial.from(900.00);
            const daysWorkedTotal = 720; // 2 years
            const earnedVacationDays = (daysWorkedTotal / 360.0) * 15.0; // 30 days
            const takenDays = 10;
            const pendingVacationDays = earnedVacationDays - takenDays; // 20 days

            const vacationAmount = financial.divide(financial.multiply(baseSalary, pendingVacationDays), 30);
            expect(pendingVacationDays).toBe(20);
            expect(financial.round(vacationAmount)).toBe(600.00);
        });
    });

    describe('3. Attendance Geofencing & Net Worked Hours Calculation', () => {
        it('Should calculate Haversine geodetic distance accurately between coordinates', () => {
            const getDistance = (lat1, lon1, lat2, lon2) => {
                const R = 6371e3; // Radio de la Tierra en metros
                const φ1 = lat1 * Math.PI / 180;
                const φ2 = lat2 * Math.PI / 180;
                const Δφ = (lat2 - lat1) * Math.PI / 180;
                const Δλ = (lon2 - lon1) * Math.PI / 180;

                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            // Coordenadas Quito (Plaza Grande a La Mariscal ~ 2.8km)
            const dist = getDistance(-0.2201, -78.5123, -0.2030, -78.4940);
            expect(Math.round(dist)).toBeGreaterThan(2500);
            expect(Math.round(dist)).toBeLessThan(3200);

            // Coincidencia exacta de coordenadas debe ser 0 metros
            expect(getDistance(-0.1806, -78.4678, -0.1806, -78.4678)).toBe(0);
        });

        it('Should deduct break/lunch duration from total worked hours', () => {
            const checkIn = new Date('2026-08-21T08:00:00Z');
            const checkOut = new Date('2026-08-21T17:30:00Z'); // 9.5 hours total
            const breakStart = new Date('2026-08-21T13:00:00Z');
            const breakEnd = new Date('2026-08-21T14:00:00Z'); // 1.0 hour break

            let diffMs = checkOut - checkIn;
            const breakDuration = breakEnd - breakStart;
            diffMs -= breakDuration;

            const workedHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
            expect(workedHours).toBe(8.50);
        });
    });

    describe('4. Goal Progress & Performance Calculations', () => {
        it('Should safely calculate goal progress without division by zero', () => {
            const computeProgress = (currentVal, targetVal) => {
                const cur = parseFloat(currentVal) || 0;
                const target = parseFloat(targetVal);
                if (!isNaN(target) && target > 0) {
                    return Math.max(0, Math.min(100, parseFloat(((cur / target) * 100).toFixed(2))));
                }
                return 0;
            };

            expect(computeProgress(50, 100)).toBe(50);
            expect(computeProgress(150, 100)).toBe(100);
            expect(computeProgress(-10, 100)).toBe(0);
            expect(computeProgress(50, 0)).toBe(0);
            expect(computeProgress(50, null)).toBe(0);
        });

        it('Should calculate weighted evaluation scores accurately', () => {
            const criteria = [
                { score: 4.5, weight: 40 },
                { score: 4.0, weight: 30 },
                { score: 5.0, weight: 30 }
            ];

            const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
            const weightedSum = criteria.reduce((sum, c) => sum + (c.score * c.weight), 0);
            const overallScore = parseFloat((weightedSum / totalWeight).toFixed(2));

            expect(totalWeight).toBe(100);
            expect(overallScore).toBe(4.50);
        });
    });

    describe('5. Statistical, Psychometric & Goodness-of-Fit Validations', () => {
        it('Should calculate Cronbach Alpha with unbiased sample variances', () => {
            const matrix = [
                [5, 4, 5, 4],
                [4, 4, 4, 4],
                [5, 5, 5, 5],
                [4, 3, 4, 3],
                [5, 4, 4, 5]
            ];
            const N = matrix.length;
            const K = matrix[0].length;

            const itemVariances = [];
            for (let j = 0; j < K; j++) {
                const itemValues = matrix.map(row => row[j]);
                const mean = itemValues.reduce((a, b) => a + b, 0) / N;
                const variance = itemValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (N - 1);
                itemVariances.push(variance);
            }
            const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);

            const totalScores = matrix.map(row => row.reduce((a, b) => a + b, 0));
            const totalMean = totalScores.reduce((a, b) => a + b, 0) / N;
            const totalVariance = totalScores.reduce((sum, v) => sum + Math.pow(v - totalMean, 2), 0) / (N - 1);

            const rawAlpha = (K / (K - 1)) * (1 - (sumItemVariances / totalVariance));
            expect(rawAlpha).toBeGreaterThan(0.70);
            expect(rawAlpha).toBeLessThan(1.0);
        });

        it('Should execute Kolmogorov-Smirnov test for empirical samples', () => {
            const sample = [12, 15, 18, 24, 30, 36, 42, 48, 60];
            const result = calculateKolmogorovSmirnovTest(sample);

            expect(result.sampleSize).toBe(9);
            expect(result.D_Weibull).toBeGreaterThan(0);
            expect(result.criticalValue95).toBeGreaterThan(0);
            expect(result.bestFitDistribution).toBeDefined();
        });
    });

    describe('6. Startup Intelligence & Unit Economics', () => {
        it('Should calculate Unit Economics ratio (LTV / CAC) and sustainability status', () => {
            const cac = 150.00;
            const ltv = 600.00;
            const unitEconomics = cac > 0 ? parseFloat((ltv / cac).toFixed(2)) : 0;
            const isSustainable = unitEconomics > 3;

            expect(unitEconomics).toBe(4.00);
            expect(isSustainable).toBe(true);
        });
    });

});
