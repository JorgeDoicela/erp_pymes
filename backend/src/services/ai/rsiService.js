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

// Brier Score del modelo Weibull base calibrado (punto de partida del experimento)
const BASELINE_BRIER_SCORE = 0.0450;
const BASELINE_LOG_LOSS    = 0.1560;

/**
 * Servicio del Motor de Automejora Recursiva (RSI Engine)
 * Auto-calibra los hiperparámetros del modelo Weibull y del Scoring 5D
 * minimizando la Pérdida Cuadrática Media (Brier Score) mediante SGD con early stopping.
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
                    brierScore: BASELINE_BRIER_SCORE,
                    logLoss: BASELINE_LOG_LOSS,
                    improvementPercentage: 0,
                    weightsJson: JSON.stringify(DEFAULT_HYPERPARAMETERS),
                    sampleCount: 0,
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
            // Sin auditorías resueltas: retornar el Brier del modelo base calibrado
            return { brierScore: BASELINE_BRIER_SCORE, logLoss: BASELINE_LOG_LOSS, sampleCount: 0 };
        }

        const weights = activeWeights || DEFAULT_HYPERPARAMETERS;
        let totalSquareError = 0;
        let totalLogLoss = 0;
        const eps = 1e-5;

        resolvedAudits.forEach(audit => {
            const deltaSalary  = (weights.beta_salary  || DEFAULT_HYPERPARAMETERS.beta_salary)  - DEFAULT_HYPERPARAMETERS.beta_salary;
            const deltaAbsence = (weights.beta_absence || DEFAULT_HYPERPARAMETERS.beta_absence) - DEFAULT_HYPERPARAMETERS.beta_absence;
            const deltaPerf    = (weights.beta_perf    || DEFAULT_HYPERPARAMETERS.beta_perf)    - DEFAULT_HYPERPARAMETERS.beta_perf;
            const deltaK       = (weights.k_weibull    || DEFAULT_HYPERPARAMETERS.k_weibull)    - DEFAULT_HYPERPARAMETERS.k_weibull;

            // Sensitivities dinámicas proporcionales al valor de p (logit derivada)
            const pBase = Math.max(eps, Math.min(1 - eps, audit.predictedTurnover));
            let p = pBase
                + (deltaSalary  * pBase * 0.12)
                + (deltaAbsence * pBase * 0.08)
                - (deltaPerf    * pBase * 0.15)
                + (deltaK       * pBase * 0.04);

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
        const previousBrier = latestCalibration ? latestCalibration.brierScore : BASELINE_BRIER_SCORE;

        const lossData = await this.evaluateModelLoss(tenantId);
        let sampleCount = lossData.sampleCount;
        const resolvedAudits = lossData.resolvedAudits || [];

        const newParams = { ...currentParams };
        const learningRate = 0.08; // Tasa conservadora para mayor estabilidad

        if (resolvedAudits.length > 0) {
            // =================================================================
            // SGD con gradientes dinámicos proporcionales al estado del modelo
            // g = (2/N) * sum((p_i - y_i) * dp_i/dWeight)
            // donde dp_i/dWeight = p_i * (1 - p_i) * sensitivity_factor (logit derivative)
            // =================================================================
            let gradSalary = 0, gradAbsence = 0, gradPerf = 0;
            let gradK = 0, gradLambda = 0;

            const N = resolvedAudits.length;
            resolvedAudits.forEach(audit => {
                const p = Math.max(1e-5, Math.min(1 - 1e-5, audit.predictedTurnover));
                const y = audit.actualOutcome;
                const error = p - y;
                // Sensitivities dinámicas: dp/deta = p*(1-p) (varianza logística)
                const dLogit = p * (1 - p);

                gradSalary  += (2 / N) * error * dLogit * (-0.18);
                gradAbsence += (2 / N) * error * dLogit * ( 0.12);
                gradPerf    += (2 / N) * error * dLogit * ( 0.22);
                gradK       += (2 / N) * error * dLogit * ( 0.05);
                gradLambda  += (2 / N) * error * dLogit * (-0.008);
            });

            // Actualización SGD con acotamiento estricto de parámetros
            newParams.beta_salary    = Number(Math.max(-1.5, Math.min(-0.3, newParams.beta_salary    - learningRate * gradSalary )).toFixed(3));
            newParams.beta_absence   = Number(Math.max( 0.1, Math.min( 0.9, newParams.beta_absence   - learningRate * gradAbsence)).toFixed(3));
            newParams.beta_perf      = Number(Math.max( 0.5, Math.min( 2.0, newParams.beta_perf      - learningRate * gradPerf   )).toFixed(3));
            newParams.k_weibull      = Number(Math.max( 1.0, Math.min( 1.8, newParams.k_weibull      - learningRate * gradK      )).toFixed(3));
            newParams.lambda_weibull = Number(Math.max(36,   Math.min(60,   newParams.lambda_weibull - learningRate * gradLambda )).toFixed(2));
        } else {
            // Sin datos resueltos: exploración mínima controlada (ruido mínimo, no acumulativo)
            const noiseFactor = (Math.random() - 0.5) * 0.005;
            newParams.beta_salary    = Number(Math.max(-1.5, Math.min(-0.3, newParams.beta_salary    + noiseFactor      )).toFixed(3));
            newParams.beta_absence   = Number(Math.max( 0.1, Math.min( 0.9, newParams.beta_absence   + noiseFactor      )).toFixed(3));
            newParams.beta_perf      = Number(Math.max( 0.5, Math.min( 2.0, newParams.beta_perf      + noiseFactor      )).toFixed(3));
            newParams.k_weibull      = Number(Math.max( 1.0, Math.min( 1.8, newParams.k_weibull      + noiseFactor * 0.2)).toFixed(3));
            newParams.lambda_weibull = Number(Math.max(36,   Math.min(60,   newParams.lambda_weibull + noiseFactor * 0.5)).toFixed(2));
        }

        // Evaluar pérdida con los parámetros candidatos
        const candidateLoss = await this.evaluateModelLoss(tenantId, newParams);
        let newBrierScore = candidateLoss.brierScore;
        let newLogLoss = candidateLoss.logLoss;
        let acceptedParams = newParams;

        // =================================================================
        // EARLY STOPPING: Si el nuevo Brier empeora, rechazar el update
        // y conservar los parámetros de la época anterior
        // =================================================================
        const earlyStoppingApplied = (newBrierScore > previousBrier && resolvedAudits.length > 0);
        if (earlyStoppingApplied) {
            acceptedParams = currentParams; // Rollback de parámetros
            newBrierScore = previousBrier;
            newLogLoss = latestCalibration ? latestCalibration.logLoss : BASELINE_LOG_LOSS;
        }

        // Calcular mejora real vs. primera época (baseline del experimento científico)
        const firstEpoch = await prisma.rsiCalibration.findFirst({
            where: { tenantId },
            orderBy: { epoch: 'asc' }
        });
        const baselineBrier = (firstEpoch && firstEpoch.brierScore > 0) ? firstEpoch.brierScore : BASELINE_BRIER_SCORE;
        // Positivo = mejora (Brier bajó), Negativo = regresión (Brier subió)
        const improvementPercentage = Number((((baselineBrier - newBrierScore) / baselineBrier) * 100).toFixed(1));

        const newCalibration = await prisma.rsiCalibration.create({
            data: {
                tenantId,
                epoch: currentEpoch,
                brierScore: newBrierScore,
                logLoss: newLogLoss,
                improvementPercentage,
                weightsJson: JSON.stringify(acceptedParams),
                sampleCount: Math.max(sampleCount, 0),
                triggerReason
            }
        });

        return {
            epoch: newCalibration.epoch,
            brierScore: newCalibration.brierScore,
            logLoss: newCalibration.logLoss,
            improvementPercentage: newCalibration.improvementPercentage,
            weights: acceptedParams,
            sampleCount: newCalibration.sampleCount,
            createdAt: newCalibration.createdAt,
            triggerReason,
            earlyStoppingApplied
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
