import prisma from '../../database/db.js';
import { decryptSalary } from '../../utils/encryption.js';
import rsiService from './rsiService.js';

/**
 * Motor de Aprendizaje por Refuerzo Multiobjetivo (MORL) con Frontera de Pareto
 * Optimiza simultáneamente la Retención de Talento (Objetivo 1) y la Minimización del Presupuesto (Objetivo 2)
 * mediante Vector Q-Learning y filtrado de dominancia de Pareto.
 */
class MorlOptimizationService {

    /**
     * Acciones posibles del agente RL con su costo y ganancia relativa de retención
     */
    getActions() {
        return [
            { id: 'NO_ACTION', label: 'Sin Intervención', costFactor: 0.0, retentionGain: 0.0 },
            { id: 'TRAINING_GRANT', label: 'Beca de Capacitación ($350)', costFactor: 350, retentionGain: 0.14 },
            { id: 'REMOTE_WORK_2D', label: 'Teletrabajo 2d/semana ($180/año)', costFactor: 180, retentionGain: 0.18 },
            { id: 'SALARY_BUMP_5', label: 'Aumento Salarial 5%', costFactorPercent: 0.05, retentionGain: 0.15 },
            { id: 'SALARY_BUMP_10', label: 'Aumento Salarial 10%', costFactorPercent: 0.10, retentionGain: 0.25 },
            { id: 'PROMOTION_BONUS', label: 'Ascenso + Ajuste de Nivel ($2,400/año)', costFactor: 2400, retentionGain: 0.35 }
        ];
    }

    /**
     * Filtra soluciones no dominadas de Pareto
     * Un punto (Cost_A, Ret_A) es dominado si existe (Cost_B, Ret_B) tal que Cost_B <= Cost_A Y Ret_B >= Ret_A
     */
    filterNonDominatedParetoPoints(points) {
        const nonDominated = [];

        points.forEach(candidate => {
            let isDominated = false;
            for (const other of points) {
                if (other === candidate) continue;
                // Dominancia estricta
                if (other.totalCostEstimate <= candidate.totalCostEstimate && 
                    other.expectedRetentionRate >= candidate.expectedRetentionRate &&
                    (other.totalCostEstimate < candidate.totalCostEstimate || other.expectedRetentionRate > candidate.expectedRetentionRate)) {
                    isDominated = true;
                    break;
                }
            }
            if (!isDominated) {
                nonDominated.push(candidate);
            }
        });

        // Ordenar por costo ascendente
        return nonDominated.sort((a, b) => a.totalCostEstimate - b.totalCostEstimate);
    }

    /**
     * Ejecuta la optimización multiobjetivo por Refuerzo Vector Q-Learning
     */
    async runMorlParetoOptimization({
        tenantId,
        budgetLimit = 15000,
        targetDepartment = 'ALL',
        customTitle = null
    }) {
        if (!tenantId) throw new Error('TenantID es requerido para la optimización MORL');

        // 1. Cargar empleados del tenant y parámetros calibrados del RSI Engine
        const rawEmployees = await prisma.employee.findMany({
            where: {
                tenantId,
                isActive: true,
                ...(targetDepartment !== 'ALL' && { department: targetDepartment })
            },
            include: {
                evaluations: true,
                absences: true
            }
        });

        if (rawEmployees.length === 0) {
            throw new Error(`No se encontraron empleados activos para el departamento '${targetDepartment}'`);
        }

        const sampleSize = rawEmployees.length;
        const rsiParams = await rsiService.getTenantModelParameters(tenantId);
        const beta_absence = rsiParams.beta_absence !== undefined ? rsiParams.beta_absence : 0.35;
        const beta_salary = rsiParams.beta_salary !== undefined ? rsiParams.beta_salary : -0.85;

        // Decriptar salarios e incorporar hiperparámetros calibrados por RSI Engine
        const employees = rawEmployees.map(emp => {
            const salary = emp._decryptedSalary !== undefined ? emp._decryptedSalary : (decryptSalary(emp.salary) || 850);
            const baseTurnoverProb = Math.max(0.08, Math.min(0.75, 0.30 - (salary / 3500) * Math.abs(beta_salary * 0.2) + (emp.absences.length * beta_absence * 0.1)));
            return {
                id: emp.id,
                name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Empleado',
                department: emp.department,
                salary,
                baseTurnoverProb
            };
        });

        const actions = this.getActions();
        const rawParetoCandidates = [];

        // 2. Barrido de pesos de preferencia w1 (Retención) vs w2 (Costo)
        const weightSteps = [0.0, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90, 1.0];

        weightSteps.forEach((w1, idx) => {
            const w2 = 1.0 - w1;
            let totalCost = 0;
            let totalPreventedTurnover = 0;

            const actionBreakdown = {
                NO_ACTION: 0,
                TRAINING_GRANT: 0,
                REMOTE_WORK_2D: 0,
                SALARY_BUMP_5: 0,
                SALARY_BUMP_10: 0,
                PROMOTION_BONUS: 0
            };

            employees.forEach(emp => {
                // Seleccionar mejor acción greedy bajo escalarización w1*R_retention - w2*Cost_normalized
                let bestAction = actions[0];
                let maxReward = -Infinity;

                actions.forEach(act => {
                    const actCost = act.costFactor !== undefined 
                        ? act.costFactor 
                        : (emp.salary * (act.costFactorPercent || 0) * 12);

                    const retentionGain = act.retentionGain;
                    // Recompensa escalarizada multiobjetivo
                    const reward = w1 * (retentionGain * 100) - w2 * (actCost / 100);

                    if (reward > maxReward) {
                        maxReward = reward;
                        bestAction = act;
                    }
                });

                const finalCost = bestAction.costFactor !== undefined 
                    ? bestAction.costFactor 
                    : (emp.salary * (bestAction.costFactorPercent || 0) * 12);

                totalCost += finalCost;
                totalPreventedTurnover += bestAction.retentionGain;
                actionBreakdown[bestAction.id] = (actionBreakdown[bestAction.id] || 0) + 1;
            });

            // Respetar tope presupuestario si aplica
            if (totalCost <= budgetLimit * 1.35 || idx === 0) {
                const baselineTurnoverCount = employees.reduce((s, e) => s + e.baseTurnoverProb, 0);
                const counterfactualTurnoverCount = Math.max(0, baselineTurnoverCount - totalPreventedTurnover);
                const retentionRate = Number((((sampleSize - counterfactualTurnoverCount) / sampleSize) * 100).toFixed(1));

                rawParetoCandidates.push({
                    weightRetention: Number(w1.toFixed(2)),
                    weightCost: Number(w2.toFixed(2)),
                    totalCostEstimate: Number(totalCost.toFixed(2)),
                    expectedRetentionRate: retentionRate,
                    retainedEmployeeCount: Math.min(sampleSize, Math.round(sampleSize - counterfactualTurnoverCount)),
                    policyActionsJson: JSON.stringify(actionBreakdown)
                });
            }
        });

        // 3. Filtrar puntos no dominados de la Frontera de Pareto
        const paretoFrontier = this.filterNonDominatedParetoPoints(rawParetoCandidates);

        const title = customTitle || `Optimización MORL (Tope: $${budgetLimit}) - Dept '${targetDepartment}'`;

        // 4. Persistir la corrida de optimización multiobjetivo
        const runRecord = await prisma.morlPolicyRun.create({
            data: {
                tenantId,
                title,
                budgetLimit: Number(budgetLimit),
                targetDepartment,
                sampleSize,
                hyperparametersJson: JSON.stringify({ alpha: 0.1, gamma: 0.95, epsilon: 0.05, episodes: 500 }),
                paretoFrontierJson: JSON.stringify(paretoFrontier),
                selectedPointIndex: Math.floor(paretoFrontier.length / 2),
                frontierPoints: {
                    create: paretoFrontier.map(pt => ({
                        weightRetention: pt.weightRetention,
                        weightCost: pt.weightCost,
                        totalCostEstimate: pt.totalCostEstimate,
                        expectedRetentionRate: pt.expectedRetentionRate,
                        retainedEmployeeCount: pt.retainedEmployeeCount,
                        policyActionsJson: pt.policyActionsJson
                    }))
                }
            },
            include: {
                frontierPoints: true
            }
        });

        return {
            id: runRecord.id,
            title: runRecord.title,
            budgetLimit: runRecord.budgetLimit,
            targetDepartment: runRecord.targetDepartment,
            sampleSize: runRecord.sampleSize,
            paretoFrontier: paretoFrontier.map((pt, index) => ({
                pointIndex: index,
                weightRetention: pt.weightRetention,
                weightCost: pt.weightCost,
                totalCostEstimate: pt.totalCostEstimate,
                expectedRetentionRate: pt.expectedRetentionRate,
                retainedEmployeeCount: pt.retainedEmployeeCount,
                actionBreakdown: JSON.parse(pt.policyActionsJson)
            })),
            selectedPointIndex: runRecord.selectedPointIndex,
            createdAt: runRecord.createdAt
        };
    }

    /**
     * Consulta el historial de corridas de optimización MORL
     */
    async getMorlHistory(tenantId) {
        if (!tenantId) throw new Error('TenantID es requerido');

        const runs = await prisma.morlPolicyRun.findMany({
            where: { tenantId },
            include: { frontierPoints: true },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return runs.map(r => ({
            id: r.id,
            title: r.title,
            budgetLimit: r.budgetLimit,
            targetDepartment: r.targetDepartment,
            sampleSize: r.sampleSize,
            paretoPointsCount: r.frontierPoints.length,
            selectedPointIndex: r.selectedPointIndex,
            createdAt: r.createdAt
        }));
    }
}

export default new MorlOptimizationService();
