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
    console.log(`EJECUTANDO EXPERIMENTO 1: CONVERGENCIA DEL MOTOR RSI (12 ÉPOCAS - ${tenants.length} TENANTS)`);
    console.log('------------------------------------------------------------------------');

    for (const tenant of tenants) {
        console.log(`\n* Tenant: ${tenant.name} (${tenant.id})`);
        
        // Limpiar calibraciones previas para experimento limpio desde época 1
        await prisma.rsiCalibration.deleteMany({ where: { tenantId: tenant.id } });

        // Epoch 1 (Inicialización)
        const initCalib = await rsiService.runRecursiveCalibration(tenant.id, 'INITIALIZATION');
        console.log(`   Epoca 1  | Brier Score: ${initCalib.brierScore.toFixed(4)} | LogLoss: ${initCalib.logLoss.toFixed(4)} | Mejora: ${initCalib.improvementPercentage}%`);

        // Épocas 2 a 12 (Calibración SGD estocástica recursiva)
        for (let ep = 2; ep <= 12; ep++) {
            const calib = await rsiService.runRecursiveCalibration(tenant.id, `RESEARCH_EPOCH_${ep}`);
            if (ep % 3 === 0 || ep === 12) {
                console.log(`   Epoca ${ep < 10 ? ' ' + ep : ep} | Brier Score: ${calib.brierScore.toFixed(4)} | LogLoss: ${calib.logLoss.toFixed(4)} | Mejora: ${calib.improvementPercentage}%`);
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

        console.log(`   ATE (Efecto Promedio del Tratamiento): ${(result.impact.ate * 100).toFixed(2)}% de reducción de rotación`);
        console.log(`   Rotación Basal: ${result.impact.baselineTurnoverRate}% -> Post-Tratamiento: ${result.impact.counterfactualTurnoverRate}%`);
        console.log(`   Financiero: Costo: $${result.financials.costEstimate} | Ahorro: $${result.financials.savingsEstimate} | ROI Neto: $${result.financials.netRoi} (${result.financials.roiPercentage}%)`);
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

    for (let round = 1; round <= 3; round++) {
        const fedResult = await federatedLearningService.executeFederatedRound(tenantIds);
        const weights = fedResult.globalWeights;
        console.log(`\n* Ronda Federada Global ${round}:`);
        console.log(`   Tenants Participantes: ${fedResult.participatingTenantsCount}`);
        console.log(`   Brier Score Global: ${fedResult.globalBrierScore.toFixed(4)}`);
        console.log(`   Epsilon Gastado (acum.): ${(fedResult.epsilonUsed * round).toFixed(2)} (DP-SGD Noise Scale: ${fedResult.noiseScale})`);
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
