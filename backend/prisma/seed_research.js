import 'dotenv/config';
import prisma from '../src/database/db.js';
import { seedResearchData } from './seeds/research_data.js';
import rsiService from '../src/services/ai/rsiService.js';
import causalInferenceService from '../src/services/ai/causalInferenceService.js';
import morlOptimizationService from '../src/services/ai/morlOptimizationService.js';
import federatedLearningService from '../src/services/ai/federatedLearningService.js';

async function main() {
    console.log('========================================================================');
    console.log('SCRIPT DE EXPERIMENTACIÓN Y INVESTIGACIÓN CIENTÍFICA (MARCO DE IA)');
    console.log('========================================================================\n');

    // 1. Poblar el dataset de las 3 empresas (N=75)
    await seedResearchData(prisma);

    const tenants = await prisma.tenant.findMany({
        where: { slug: { in: ['empresa-demo', 'tech-solutions', 'innovate-corp'] } }
    });

    console.log('\n------------------------------------------------------------------------');
    console.log(`EJECUTANDO EXPERIMENTO 1: CONVERGENCIA DEL MOTOR RSI (12 ÉPOCAS SGD - ${tenants.length} TENANTS, BASELINE BRIER=0.1650)`);
    console.log('------------------------------------------------------------------------');

    for (const tenant of tenants) {
        console.log(`\n* Tenant: ${tenant.name} (${tenant.id})`);
        
        // Limpiar calibraciones previas e inicializar Época 0 (Baseline pre-SGD)
        await prisma.rsiCalibration.deleteMany({ where: { tenantId: tenant.id } });
        await rsiService.getTenantModelParameters(tenant.id); // Crea Época 0 (Baseline 0.1650)
        console.log(`   Baseline (Época 0) | Brier Score: 0.1650 | LogLoss: 0.4200 | Mejora: 0%  (pre-SGD)`);

        // Épocas 1 a 12 (Calibración SGD estocástica recursiva con Nivel Meta RSI)
        for (let ep = 1; ep <= 12; ep++) {
            const calib = await rsiService.runRecursiveCalibration(tenant.id, `RESEARCH_EPOCH_${ep}`);
            if (ep === 1 || ep % 3 === 0 || ep === 12) {
                const metaInfo = calib.meta ? ` [Meta LR: ${calib.meta.lr} | Trigger: ${calib.meta.trigger}]` : '';
                console.log(`   Época ${ep < 10 ? ' ' + ep : ep}            | Brier Score: ${calib.brierScore.toFixed(4)} | LogLoss: ${calib.logLoss.toFixed(4)} | Mejora: ${calib.improvementPercentage}%${metaInfo}`);
            }
        }
    }

    console.log('\n------------------------------------------------------------------------');
    console.log('EJECUTANDO EXPERIMENTO 2: INFERENCIA CAUSAL CONTRAFACTUAL (DO-CALCULUS)');
    console.log('------------------------------------------------------------------------');

    for (const tenant of tenants) {
        console.log(`\n* Intervención Dirigida en ${tenant.name}: Retención y Bono Salarial +10%`);
        const result = await causalInferenceService.runCausalInterventionSimulation({
            tenantId: tenant.id,
            treatmentType: 'SALARY_INCREASE',
            treatmentValue: 10,
            targetDepartment: 'ALL',
            customTitle: `Programa de Retención Dirigida y Bono Salarial +10% (${tenant.name})`
        });

        const ci = result.impact.confidenceInterval95;
        const ciStr = `[${(ci[0] * 100).toFixed(2)}%, ${(ci[1] * 100).toFixed(2)}%]`;
        console.log(`   ATE (Efecto Promedio del Tratamiento): ${(result.impact.ate * 100).toFixed(2)}% | IC95%: ${ciStr}`);
        console.log(`   Rotación Basal: ${result.impact.baselineTurnoverRate}% -> Post-Tratamiento: ${result.impact.counterfactualTurnoverRate}%`);
        console.log(`   Financiero: Costo: $${result.financials.costEstimate} | Ahorro: $${result.financials.savingsEstimate} | ROI Neto: $${result.financials.netRoi} (${result.financials.roiPercentage}%)`);
        if (ci[0] <= 0 && ci[1] >= 0) {
            console.log(`   Nota: IC95% incluye 0 (p > 0.05). Estimación puntual = ${(result.impact.ate * 100).toFixed(2)} PP, pero el efecto no es estadísticamente significativo al 95%.`);
        }
    }

    console.log('\n------------------------------------------------------------------------');
    console.log('EJECUTANDO EXPERIMENTO 3: OPTIMIZACIÓN MORL PARETO');
    console.log('------------------------------------------------------------------------');

    for (const tenant of tenants) {
        console.log(`\n* Curva de Pareto para ${tenant.name} (Tope Presupuestario: $12,000)`);
        const morlResult = await morlOptimizationService.runMorlParetoOptimization({
            tenantId: tenant.id,
            budgetLimit: 12000,
            targetDepartment: 'ALL',
            customTitle: `Experimento MORL Pareto (${tenant.name})`
        });

        console.log(`   Puntos en la Frontera de Pareto: ${morlResult.paretoFrontier.length}`);
        morlResult.paretoFrontier.forEach((pt, i) => {
            console.log(`   Punto [${i + 1}] | W_ret: ${pt.weightRetention} | Costo: $${pt.totalCostEstimate} | Retención: ${pt.expectedRetentionRate}% (${pt.retainedEmployeeCount} emp)`);
        });
    }

    console.log('\n------------------------------------------------------------------------');
    console.log('EJECUTANDO EXPERIMENTO 4: ENTRENAMIENTO FEDERADO (FEDAVG + DP-SGD)');
    console.log('------------------------------------------------------------------------');

    // Limpiar rondas federadas previas para empezar desde ronda 1
    const tenantIds = tenants.map(t => t.id);
    await prisma.federatedRound.deleteMany({});
    // Limpiar presupuestos de privacidad para reiniciar contadores epsilon
    await prisma.tenantPrivacyBudget.deleteMany({ where: { tenantId: { in: tenantIds } } });

    let prevEpsilonAcc = 0;
    for (let round = 1; round <= 3; round++) {
        const fedResult = await federatedLearningService.executeFederatedRound(tenantIds);
        const weights = fedResult.globalWeights;
        const epsilonAcc = fedResult.epsilonUsed;
        const epsilonInc = Number((epsilonAcc - prevEpsilonAcc).toFixed(2));
        prevEpsilonAcc = epsilonAcc;

        console.log(`\n* Ronda Federada Global ${round}:`);
        console.log(`   Tenants Participantes: ${fedResult.participatingTenantsCount}`);
        console.log(`   Brier Score Global: ${fedResult.globalBrierScore.toFixed(4)}`);
        console.log(`   Presupuesto DP: ε_incremental = ${epsilonInc} | ε_acumulado = ${epsilonAcc.toFixed(2)} (RDP Accountant [Mironov 2017; Balle et al. 2020]: Noise Scale σ=${fedResult.noiseScale})`);
        if (fedResult.privacyAccountant) {
            console.log(`   Garantía RDP Acumulada: ${fedResult.privacyAccountant.privacyGuarantee}`);
        }
        console.log(`   β_salary: ${weights.beta_salary} | β_absence: ${weights.beta_absence} | β_perf: ${weights.beta_perf} | k_weibull: ${weights.k_weibull}`);
    }

    console.log('\n========================================================================');
    console.log('TODOS LOS EXPERIMENTOS SE COMPLETARON CON ÉXITO Y LOS DATOS ESTÁN LISTOS');
    console.log('========================================================================\n');
}

main()
    .catch((e) => {
        console.error('[ERROR] Error en la ejecución de experimentos:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
