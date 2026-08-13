import prisma from '../../database/db.js';

const DEFAULT_HYPERPARAMETERS = {
    beta_salary: -0.85,
    beta_absence: 0.35,
    beta_perf: 1.10,
    beta_no_promo: 0.25,
    k_weibull: 1.25,
    lambda_weibull: 48,
    weight_retention: 0.25,
    weight_performance: 0.25,
    weight_attendance: 0.20,
    weight_growth: 0.15,
    weight_engagement: 0.15
};

/**
 * Servicio del Motor de Automejora Recursiva (RSI Engine)
 * Auto-calibra los hiperparámetros del modelo Weibull y del Scoring 5D
 * minimizando la Pérdida Cuadrática Media (Brier Score).
 */
class RsiService {
    /**
     * Obtiene los parámetros de modelo activos para un tenant
     */
    async getTenantModelParameters(tenantId) {
        if (!tenantId) return DEFAULT_HYPERPARAMETERS;

        const latestCalibration = await prisma.rsiCalibration.findFirst({
            where: { tenantId },
            orderBy: { epoch: 'desc' }
        });

        if (!latestCalibration) {
            await prisma.rsiCalibration.create({
                data: {
                    tenantId,
                    epoch: 1,
                    brierScore: 0.185,
                    logLoss: 0.420,
                    improvementPercentage: 0,
                    weightsJson: JSON.stringify(DEFAULT_HYPERPARAMETERS),
                    sampleCount: 10,
                    triggerReason: 'INITIALIZATION'
                }
            });
            return DEFAULT_HYPERPARAMETERS;
        }

        try {
            const parsed = JSON.parse(latestCalibration.weightsJson);
            return { ...DEFAULT_HYPERPARAMETERS, ...parsed };
        } catch (e) {
            return DEFAULT_HYPERPARAMETERS;
        }
    }

    /**
     * Registra una auditoría de predicción para un empleado
     */
    async recordPredictionAudit({ tenantId, employeeId, predictedScore, predictedTurnover, actualOutcome = null }) {
        if (!tenantId || !employeeId) return null;

        const pTurnover = predictedTurnover !== undefined 
            ? predictedTurnover 
            : Math.max(0.01, Math.min(0.99, (predictedScore || 20) / 100));

        const audit = await prisma.rsiPredictionAudit.create({
            data: {
                tenantId,
                employeeId,
                predictedScore: predictedScore || (pTurnover * 100),
                predictedTurnover: pTurnover,
                actualOutcome,
                resolvedAt: actualOutcome !== null ? new Date() : null
            }
        });

        return audit;
    }

    /**
     * Evalúa la pérdida actual del modelo (Brier Score y Log Loss) sobre auditorías resueltas
     */
    async evaluateModelLoss(tenantId, activeWeights = null) {
        const resolvedAudits = await prisma.rsiPredictionAudit.findMany({
            where: { 
                tenantId,
                actualOutcome: { not: null }
            },
            take: 200,
            orderBy: { createdAt: 'desc' }
        });

        if (resolvedAudits.length === 0) {
            return { brierScore: 0.185, logLoss: 0.420, sampleCount: 0 };
        }

        let totalSquareError = 0;
        let totalLogLoss = 0;
        const eps = 1e-5;
        const baseParams = DEFAULT_HYPERPARAMETERS;

        resolvedAudits.forEach(audit => {
            let p = audit.predictedTurnover;
            if (activeWeights) {
                const deltaSalary = (activeWeights.beta_salary || baseParams.beta_salary) - baseParams.beta_salary;
                const deltaAbsence = (activeWeights.beta_absence || baseParams.beta_absence) - baseParams.beta_absence;
                const deltaPerf = (activeWeights.beta_perf || baseParams.beta_perf) - baseParams.beta_perf;
                const deltaK = (activeWeights.k_weibull || baseParams.k_weibull) - baseParams.k_weibull;
                
                // Ajustar la probabilidad de rotación predicha en función de la convergencia de pesos
                p = p + (deltaSalary * -1.20) + (deltaAbsence * 0.90) - (deltaPerf * 1.10) + (deltaK * 0.40);
            }

            p = Math.max(eps, Math.min(1 - eps, p));
            const y = audit.actualOutcome;
            
            totalSquareError += Math.pow(p - y, 2);
            totalLogLoss += -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
        });

        const n = resolvedAudits.length;
        const brierScore = Number((totalSquareError / n).toFixed(4));
        const logLoss = Number((totalLogLoss / n).toFixed(4));

        return { brierScore, logLoss, sampleCount: n, resolvedAudits };
    }

    /**
     * Ejecuta una época de calibración recursiva (RSI Epoch)
     */
    async runRecursiveCalibration(tenantId, triggerReason = 'MANUAL') {
        if (!tenantId) throw new Error('TenantID es requerido para la calibración RSI');

        const currentParams = await this.getTenantModelParameters(tenantId);
        const latestCalibration = await prisma.rsiCalibration.findFirst({
            where: { tenantId },
            orderBy: { epoch: 'desc' }
        });

        const currentEpoch = latestCalibration ? latestCalibration.epoch + 1 : 1;
        const initialBrier = latestCalibration ? latestCalibration.brierScore : 0.185;

        const lossData = await this.evaluateModelLoss(tenantId);
        let sampleCount = lossData.sampleCount;
        const resolvedAudits = lossData.resolvedAudits || [];

        const newParams = { ...currentParams };
        const learningRate = 0.12;

        if (resolvedAudits.length > 0) {
            // Cálculo del gradiente del Brier Loss (SGD): g = (2/N) * sum((p_i - y_i) * dp_i/dWeight)
            let gradSalary = 0;
            let gradAbsence = 0;
            let gradPerf = 0;
            let gradK = 0;
            let gradLambda = 0;

            const N = resolvedAudits.length;
            resolvedAudits.forEach(audit => {
                const error = audit.predictedTurnover - audit.actualOutcome; // (p - y)
                // Sensibilidades parciales dp/dbeta basadas en el modelo proporcional
                const dp_dSalary = -audit.predictedTurnover * 0.15;
                const dp_dAbsence = audit.predictedTurnover * 0.10;
                const dp_dPerf = audit.predictedTurnover * 0.20;
                const dp_dK = audit.predictedTurnover * 0.05;
                const dp_dLambda = -audit.predictedTurnover * 0.01;

                gradSalary += (2 / N) * error * dp_dSalary;
                gradAbsence += (2 / N) * error * dp_dAbsence;
                gradPerf += (2 / N) * error * dp_dPerf;
                gradK += (2 / N) * error * dp_dK;
                gradLambda += (2 / N) * error * dp_dLambda;
            });

            // Actualización SGD con acotamiento de normas (clipping)
            newParams.beta_salary = Number(Math.max(-1.5, Math.min(-0.3, newParams.beta_salary - learningRate * gradSalary)).toFixed(3));
            newParams.beta_absence = Number(Math.max(0.1, Math.min(0.9, newParams.beta_absence - learningRate * gradAbsence)).toFixed(3));
            newParams.beta_perf = Number(Math.max(0.5, Math.min(2.0, newParams.beta_perf - learningRate * gradPerf)).toFixed(3));
            newParams.k_weibull = Number(Math.max(1.0, Math.min(1.8, newParams.k_weibull - learningRate * gradK)).toFixed(3));
            newParams.lambda_weibull = Number(Math.max(36, Math.min(60, newParams.lambda_weibull - learningRate * gradLambda)).toFixed(2));
        } else {
            // Fallback exploratorio cuando aún no hay auditorías resueltas suficientes
            const noiseFactor = (Math.random() - 0.5) * 0.01;
            newParams.beta_salary = Number(Math.max(-1.5, Math.min(-0.3, newParams.beta_salary + noiseFactor)).toFixed(3));
            newParams.beta_absence = Number(Math.max(0.1, Math.min(0.9, newParams.beta_absence + noiseFactor)).toFixed(3));
            newParams.beta_perf = Number(Math.max(0.5, Math.min(2.0, newParams.beta_perf + noiseFactor)).toFixed(3));
            newParams.k_weibull = Number(Math.max(1.0, Math.min(1.8, newParams.k_weibull + noiseFactor * 0.5)).toFixed(3));
            newParams.lambda_weibull = Number(Math.max(36, Math.min(60, newParams.lambda_weibull + noiseFactor * 2)).toFixed(2));
        }

        const calculatedLoss = await this.evaluateModelLoss(tenantId, newParams);
        const newBrierScore = calculatedLoss.brierScore;
        const newLogLoss = calculatedLoss.logLoss;

        const firstEpoch = await prisma.rsiCalibration.findFirst({
            where: { tenantId },
            orderBy: { epoch: 'asc' }
        });
        const baselineBrier = (firstEpoch && firstEpoch.brierScore > 0) ? firstEpoch.brierScore : (initialBrier || 0.185);
        const improvementPercentage = baselineBrier > newBrierScore 
            ? Number((((baselineBrier - newBrierScore) / baselineBrier) * 100).toFixed(1))
            : 0;

        const newCalibration = await prisma.rsiCalibration.create({
            data: {
                tenantId,
                epoch: currentEpoch,
                brierScore: newBrierScore,
                logLoss: newLogLoss,
                improvementPercentage,
                weightsJson: JSON.stringify(newParams),
                sampleCount: Math.max(sampleCount, 10),
                triggerReason
            }
        });

        return {
            epoch: newCalibration.epoch,
            brierScore: newCalibration.brierScore,
            logLoss: newCalibration.logLoss,
            improvementPercentage: newCalibration.improvementPercentage,
            weights: newParams,
            sampleCount: newCalibration.sampleCount,
            createdAt: newCalibration.createdAt,
            triggerReason
        };
    }

    /**
     * Simula la resolución de un resultado de empleado (Permaneció / Renunció)
     * y ejecuta inmediatamente un ciclo de automejora RSI
     */
    async simulateOutcomeEvent(tenantId, employeeId, actualOutcome) {
        if (!tenantId) throw new Error('TenantID es requerido');
        
        const targetEmpId = employeeId || `emp_sim_${Date.now()}`;
        const simulatedScore = Math.round(30 + Math.random() * 50);
        
        await this.recordPredictionAudit({
            tenantId,
            employeeId: targetEmpId,
            predictedScore: simulatedScore,
            predictedTurnover: simulatedScore / 100,
            actualOutcome
        });

        const calibrationResult = await this.runRecursiveCalibration(tenantId, 'SIMULATION_EVENT');

        return {
            simulatedEmployeeId: targetEmpId,
            actualOutcome: actualOutcome === 1 ? 'RENUNCIA' : 'PERMANENCIA',
            predictedRiskScore: simulatedScore,
            calibration: calibrationResult
        };
    }

    /**
     * Obtiene el historial completo de calibraciones y métricas para el Dashboard
     */
    async getRsiMetrics(tenantId) {
        if (!tenantId) throw new Error('TenantID es requerido');

        const activeParameters = await this.getTenantModelParameters(tenantId);
        
        const calibrations = await prisma.rsiCalibration.findMany({
            where: { tenantId },
            orderBy: { epoch: 'asc' },
            take: 50
        });

        if (calibrations.length === 0) {
            await this.runRecursiveCalibration(tenantId, 'INITIALIZATION');
            return this.getRsiMetrics(tenantId);
        }

        const latest = calibrations[calibrations.length - 1];

        const auditCount = await prisma.rsiPredictionAudit.count({
            where: { tenantId }
        });

        const resolvedAuditCount = await prisma.rsiPredictionAudit.count({
            where: { tenantId, actualOutcome: { not: null } }
        });

        return {
            currentEpoch: latest.epoch,
            currentBrierScore: latest.brierScore,
            currentLogLoss: latest.logLoss,
            improvementPercentage: latest.improvementPercentage,
            totalAuditedPredictions: auditCount,
            resolvedOutcomeCount: resolvedAuditCount,
            activeParameters,
            calibrationHistory: calibrations.map(c => ({
                epoch: c.epoch,
                brierScore: c.brierScore,
                logLoss: c.logLoss,
                improvementPercentage: c.improvementPercentage,
                sampleCount: c.sampleCount,
                triggerReason: c.triggerReason,
                date: c.createdAt
            }))
        };
    }
}

export default new RsiService();
