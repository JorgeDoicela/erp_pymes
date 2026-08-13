import 'dotenv/config';
import prisma from '../../src/database/db.js';
import rsiService from '../../src/services/ai/rsiService.js';
import causalInferenceService from '../../src/services/ai/causalInferenceService.js';
import morlOptimizationService from '../../src/services/ai/morlOptimizationService.js';
import federatedLearningService from '../../src/services/ai/federatedLearningService.js';
import { generateAcademicDataset } from '../../src/services/intelligenceService.js';

async function main() {
    console.log('\n========================================================================');
    console.log('REPORTE DE INVESTIGACIÓN CIENTÍFICA (ANONIMIZADO LOPDP/GDPR)');
    console.log('========================================================================\n');

    const tenants = await prisma.tenant.findMany({
        where: { id: { startsWith: 'research_' } }
    });

    if (tenants.length === 0) {
        console.log('[AVISO] No se encontraron tenants de investigación. Ejecuta primero: node prisma/seed_research.js');
        process.exit(0);
    }

    console.log(`[INFO] Tenants de investigación encontrados: ${tenants.length}\n`);

    // 1. MOTOR RSI
    console.log('--- [MOTOR 1: AUTOMEJORA RECURSIVA (RSI ENGINE)] ---');
    for (const t of tenants) {
        const history = await prisma.rsiCalibration.findMany({
            where: { tenantId: t.id },
            orderBy: { epoch: 'asc' }
        });
        const first = history[0];
        const last = history[history.length - 1];
        if (first && last) {
            console.log(`* ${t.name} (${t.id}):`);
            console.log(`  - Epocas registradas: ${history.length}`);
            console.log(`  - Brier Score: Epoca 1 [${first.brierScore.toFixed(4)}] -> Epoca ${last.epoch} [${last.brierScore.toFixed(4)}]`);
            console.log(`  - LogLoss final: ${last.logLoss.toFixed(4)} | Mejora acumulada: +${last.improvementPercentage}%\n`);
        }
    }

    // 2. MOTOR CAUSAL
    console.log('--- [MOTOR 2: INFERENCIA CAUSAL CONTRAFACTUAL (CAUSAL AI)] ---');
    for (const t of tenants) {
        const interventions = await prisma.causalIntervention.findMany({
            where: { tenantId: t.id },
            orderBy: { createdAt: 'desc' },
            take: 2
        });
        for (const inv of interventions) {
            console.log(`* ${t.name} | Intervención: ${inv.title}`);
            console.log(`  - ATE (Efecto Promedio Tratamiento): ${(inv.ate * 100).toFixed(2)}%`);
            console.log(`  - Tasa de Rotacion: Basal ${(inv.baselineTurnoverRate * 100).toFixed(1)}% -> Contrafactual ${(inv.counterfactualTurnoverRate * 100).toFixed(1)}%`);
            console.log(`  - Financiero: Costo $${inv.costEstimate} | Ahorro Est. $${inv.savingsEstimate} | ROI Neto $${inv.netRoi}\n`);
        }
    }

    // 3. MOTOR MORL PARETO
    console.log('--- [MOTOR 3: APRENDIZAJE POR REFUERZO MULTIOBJETIVO (MORL PARETO)] ---');
    for (const t of tenants) {
        const runs = await prisma.morlPolicyRun.findMany({
            where: { tenantId: t.id },
            include: { frontierPoints: true },
            orderBy: { createdAt: 'desc' },
            take: 1
        });
        if (runs.length > 0) {
            const run = runs[0];
            console.log(`* ${t.name} | Presupuesto Tope: $${run.budgetLimit} (Puntos Pareto: ${run.frontierPoints.length})`);
            run.frontierPoints.forEach((p, idx) => {
                console.log(`  [Punto ${idx + 1}] W_ret: ${p.weightRetention} | Costo: $${p.totalCostEstimate} | Retención: ${p.expectedRetentionRate}% (${p.retainedEmployeeCount} emp)`);
            });
            console.log('');
        }
    }

    // 4. FEDERATED LEARNING
    console.log('--- [MOTOR 4: APRENDIZAJE FEDERADO (FEDAVG + DP-SGD)] ---');
    const fedRound = await prisma.federatedRound.findFirst({
        orderBy: { round: 'desc' }
    });
    if (fedRound) {
        console.log(`* Ronda Federada Global #${fedRound.round}:`);
        console.log(`  - Tenants Participantes: ${fedRound.participatingTenantsCount}`);
        console.log(`  - Brier Score Global: ${fedRound.globalBrierScore.toFixed(4)}`);
        console.log(`  - Epsilon gastado: ${fedRound.epsilonUsed} (Noise Scale: ${fedRound.noiseScale})`);
        console.log(`  - Pesos globales: ${fedRound.globalWeightsJson}\n`);
    }

    // 5. EXPORTACIÓN DE DATASET ANÓNIMO DE MUESTRA
    console.log('--- [MUESTRA DATASET ACADEMICO CSV (ANONIMIZADO LOPDP)] ---');
    const sampleCsv = await generateAcademicDataset(tenants[0]?.id, 'csv');
    const csvLines = sampleCsv.split('\n').slice(0, 6);
    console.log(csvLines.join('\n'));
    console.log('... [Resumen de filas anonimizadas completado]\n');

    console.log('========================================================================');
    console.log('REPORTE COMPLETADO EXITOSAMENTE');
    console.log('========================================================================\n');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
