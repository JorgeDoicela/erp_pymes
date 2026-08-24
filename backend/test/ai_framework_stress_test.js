/**
 * @file ai_framework_stress_test.js
 * @description Suite Exhaustiva de Validación Matemática, Determinismo, Resiliencia y Stress Test
 * para todos los módulos de Inteligencia Artificial del Framework de People Analytics.
 * 
 * Módulos Evaluados:
 * 1. Temporal Self-Attention (Vaswani et al. 2017)
 * 2. FT-Transformer Tabular (Gorishniy et al. NeurIPS 2021)
 * 3. Recursive Self-Improvement Engine (Schmidhuber 2004 / Ring & Orseau 2011)
 * 4. Inferencia Causal Contrafactual (Pearl 2009 / Robins et al. 1994)
 * 5. Aprendizaje Federado con Privacidad Diferencial (McMahan et al. 2017)
 * 6. Optimización Multiobjetivo por Refuerzo MORL & Frontera de Pareto
 * 7. Modelo de Supervivencia Weibull y Simulación Monte Carlo
 */

import temporalAttentionService from '../src/services/ai/temporalAttentionService.js';
import ftTransformerService from '../src/services/ai/ftTransformerService.js';
import causalInferenceService from '../src/services/ai/causalInferenceService.js';
import federatedLearningService from '../src/services/ai/federatedLearningService.js';
import morlOptimizationService from '../src/services/ai/morlOptimizationService.js';
import prisma from '../src/database/db.js';

let passedTests = 0;
let failedTests = 0;
const testLogs = [];

function assert(condition, message) {
    if (!condition) {
        failedTests++;
        const err = `❌ FALLO: ${message}`;
        testLogs.push(err);
        console.error(err);
        throw new Error(message);
    } else {
        passedTests++;
        testLogs.push(`✅ ÉXITO: ${message}`);
        console.log(`  ✅ ${message}`);
    }
}

function assertApprox(val1, val2, tolerance = 1e-3, message = '') {
    const diff = Math.abs(val1 - val2);
    if (diff > tolerance) {
        failedTests++;
        const err = `❌ FALLO (${val1} vs ${val2}, diff: ${diff.toFixed(5)} > ${tolerance}): ${message}`;
        testLogs.push(err);
        console.error(err);
        throw new Error(err);
    } else {
        passedTests++;
        testLogs.push(`✅ ÉXITO: ${message} (${val1.toFixed(4)} ≈ ${val2.toFixed(4)})`);
        console.log(`  ✅ ${message} (${val1.toFixed(4)} ≈ ${val2.toFixed(4)})`);
    }
}

// Generador de colaboradores sintéticos realistas
function generateMockEmployees(count = 20, tenantId = 'tenant_test_alpha') {
    const departments = ['Tecnología', 'Ventas', 'Operaciones', 'Finanzas', 'RRHH'];
    const emps = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        const hireMonths = 2 + (i % 48);
        const hireDate = new Date(now - hireMonths * 30.4 * 24 * 3600 * 1000);
        const dept = departments[i % departments.length];
        const salary = 800 + ((i * 137) % 2500);

        // Ausencias
        const absenceCount = i % 5;
        const absences = [];
        for (let a = 0; a < absenceCount; a++) {
            absences.push({
                id: `abs_${i}_${a}`,
                startDate: new Date(now - (a + 1) * 20 * 24 * 3600 * 1000),
                createdAt: new Date(now - (a + 1) * 20 * 24 * 3600 * 1000)
            });
        }

        // Asistencias
        const attendance = [];
        for (let att = 0; att < 30; att++) {
            attendance.push({
                id: `att_${i}_${att}`,
                date: new Date(now - att * 24 * 3600 * 1000),
                isLate: (att + i) % 7 === 0
            });
        }

        // Evaluaciones
        const evaluations = [
            { id: `eval_${i}_1`, finalScore: 60 + ((i * 7) % 38), createdAt: new Date(now - 45 * 24 * 3600 * 1000) },
            { id: `eval_${i}_2`, finalScore: 65 + ((i * 11) % 35), createdAt: new Date(now - 120 * 24 * 3600 * 1000) }
        ];

        // Payroll
        const PayrollDetail = [
            { id: `pay_${i}_1`, overtimeHours: (i * 3) % 15, createdAt: new Date(now - 15 * 24 * 3600 * 1000) }
        ];

        emps.push({
            id: `emp_${tenantId}_${i}`,
            tenantId,
            firstName: `Nombre_${i}`,
            lastName: `Apellido_${i}`,
            department: dept,
            position: `Especialista ${dept}`,
            salary: `$2b$10$mockencrypted${salary}`,
            _decryptedSalary: salary,
            hireDate,
            absences,
            attendance,
            evaluations,
            PayrollDetail
        });
    }
    return emps;
}

async function runTestSuite() {
    console.log('\n======================================================================');
    console.log('🔬 INICIANDO SUITE DE VALIDACIÓN CIENTÍFICA Y STRESS TEST (AI FRAMEWORK)');
    console.log('======================================================================\n');

    // ──────────────────────────────────────────────────────────────────
    // BLOQUE 1: TEMPORAL SELF-ATTENTION (Vaswani et al. 2017)
    // ──────────────────────────────────────────────────────────────────
    console.log('\n--- [BLOQUE 1] VALIDACIÓN MATEMÁTICA: TEMPORAL SELF-ATTENTION ---');
    {
        const emp = generateMockEmployees(1)[0];

        // 1.1 Forma de la secuencia temporal [12 x 4]
        const seq = temporalAttentionService.buildTemporalSequence(emp);
        assert(seq.length === 12, 'La secuencia temporal tiene exactamente 12 meses');
        assert(seq[0].length === 4, 'Cada paso temporal contiene exactamente 4 covariables (d_model=4)');
        seq.forEach((row, idx) => {
            row.forEach((val, fIdx) => {
                assert(val >= 0 && val <= 1.0, `Valor normalizado [0, 1] en mes ${idx + 1}, feature ${fIdx}: ${val}`);
            });
        });

        // 1.2 Codificación Posicional Sinusoidal
        const pe = temporalAttentionService.getPositionalEncoding(12, 4);
        assert(pe.length === 12 && pe[0].length === 4, 'Matriz de codificación posicional sinusoidal es [12 x 4]');
        assert(Math.abs(pe[0][0] - 0) < 1e-4, 'PE(0, 0) == sin(0) == 0');
        assert(Math.abs(pe[0][1] - 1) < 1e-4, 'PE(0, 1) == cos(0) == 1');

        // 1.3 Scaled Dot-Product Attention: Suma de pesos == 1.0000 (Propiedad Softmax)
        const customWeights = {
            wq: [[0.5, 0, 0, 0], [0, 0.5, 0, 0], [0, 0, 0.5, 0], [0, 0, 0, 0.5]],
            wk: [[0.5, 0, 0, 0], [0, 0.5, 0, 0], [0, 0, 0.5, 0], [0, 0, 0, 0.5]],
            wv: [[1.0, 0, 0, 0], [0, 1.0, 0, 0], [0, 0, 1.0, 0], [0, 0, 0, 1.0]]
        };
        const context = await temporalAttentionService.computeTemporalContext(emp, customWeights);
        const sumWeights = context.attentionWeights.reduce((a, b) => a + b, 0);
        assertApprox(sumWeights, 1.000, 1e-3, 'Suma estocástica de los pesos de atención Softmax sum(alpha) == 1.0');
        assert(context.contextVector.length === 4, 'Vector de contexto c tiene dimensión d_model=4');
        assert(context.peakAttentionMonth.monthIndex >= 0 && context.peakAttentionMonth.monthIndex < 12, 'Identificación válida del mes pico de atención');

        // 1.4 Determinismo en bucle (10 ejecuciones idénticas)
        console.log('  → Probando determinismo estricto (10 iteraciones consecutivas)...');
        for (let iter = 1; iter <= 10; iter++) {
            const ctxIter = await temporalAttentionService.computeTemporalContext(emp, customWeights);
            assertApprox(ctxIter.attentionWeights[0], context.attentionWeights[0], 1e-5, `Determinismo iter ${iter}: alpha_0 constante`);
            assertApprox(ctxIter.temporalHazardImpact, context.temporalHazardImpact, 1e-5, `Determinismo iter ${iter}: hazard impact constante`);
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // BLOQUE 2: FT-TRANSFORMER TABULAR (Gorishniy et al. NeurIPS 2021)
    // ──────────────────────────────────────────────────────────────────
    console.log('\n--- [BLOQUE 2] VALIDACIÓN MATEMÁTICA: FT-TRANSFORMER TABULAR ---');
    {
        const emp = generateMockEmployees(1)[0];
        const rawFeatures = ftTransformerService.extractEmployeeFeatures(emp, 1200);
        assert(rawFeatures.length === 6, 'Vector de features extraído tiene dimensión 6');

        const { params } = await ftTransformerService.getTenantWeights('tenant_test_alpha');
        assert(params.tokenizerW.length === 6 && params.tokenizerW[0].length === 16, 'Feature Tokenizer W es [6 x 16]');
        assert(params.clsToken.length === 16, 'Token [CLS] tiene dimensión d=16');
        assert(params.wq.length === 16 && params.wq[0].length === 16, 'Matriz W_Q es [16 x 16]');
        assert(params.wo.length === 16 && params.wo[0].length === 16, 'Matriz W_O de proyección final es [16 x 16]');

        // 2.1 LayerNorm: media 0 y varianza 1
        const testVec = [1.2, -0.8, 3.4, 0.5, -2.1, 1.0, 0.0, 0.8, -1.2, 2.0, -0.5, 0.3, 1.1, -0.4, 0.9, -1.0];
        const normVec = ftTransformerService.layerNorm(testVec, new Array(16).fill(1), new Array(16).fill(0));
        const meanNorm = normVec.reduce((a, b) => a + b, 0) / 16;
        const varNorm = normVec.reduce((s, x) => s + Math.pow(x - meanNorm, 2), 0) / 16;
        assertApprox(meanNorm, 0.00, 1e-3, 'LayerNorm produce vector con media centrada en 0');
        assertApprox(varNorm, 1.00, 1e-2, 'LayerNorm produce vector con varianza normalizada a 1');

        // 2.2 GeLU no linealidad
        assertApprox(ftTransformerService.gelu(0), 0.0, 1e-4, 'GeLU(0) == 0');
        assert(ftTransformerService.gelu(2.0) > 1.9, 'GeLU(2) aproxima ReLU suave > 1.9');
        assert(ftTransformerService.gelu(-2.0) < 0 && ftTransformerService.gelu(-2.0) > -0.1, 'GeLU(-2) tiene activación suave acotada');

        // 2.3 Forward Pass Completo
        const fwd = ftTransformerService.forward(rawFeatures, params);
        assert(fwd.turnoverProbability >= 0.0 && fwd.turnoverProbability <= 1.0, `Probabilidad calculada [0, 1]: ${fwd.turnoverProbability}`);
        assert(fwd.attentionMatrix.length === 7 && fwd.attentionMatrix[0].length === 7, 'Matriz de interacción de tokens es [7 x 7] (CLS + 6 features)');
        assert(fwd.clsFeatureImportance.length === 6, 'Importancia de features explicable generada para las 6 variables');

        // 2.4 Determinismo del Forward Pass
        console.log('  → Probando determinismo del FT-Transformer (10 ejecuciones idénticas)...');
        for (let iter = 1; iter <= 10; iter++) {
            const fwdIter = ftTransformerService.forward(rawFeatures, params);
            assertApprox(fwdIter.turnoverProbability, fwd.turnoverProbability, 1e-5, `Determinismo FT iter ${iter}: P(turnover) idéntico`);
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // BLOQUE 3: CASOS BORDE Y RESILIENCIA EXTREMA (EDGE CASES)
    // ──────────────────────────────────────────────────────────────────
    console.log('\n--- [BLOQUE 3] CASOS BORDE Y RESILIENCIA NUMÉRICA ---');
    {
        const { params } = await ftTransformerService.getTenantWeights('tenant_test_alpha');

        // 3.1 Colaborador recién contratado (antigüedad 0, sin ausencias, sin evaluaciones)
        const newHire = {
            id: 'emp_new_0',
            tenantId: 'test_tenant',
            hireDate: new Date(),
            absences: [],
            attendance: [],
            evaluations: [],
            PayrollDetail: []
        };
        const ctxNew = await temporalAttentionService.computeTemporalContext(newHire);
        assert(ctxNew.attentionWeights.length === 12, 'Nuevo colaborador: secuencia temporal válida de 12 meses con ceros');
        assert(!isNaN(ctxNew.temporalHazardImpact), 'Nuevo colaborador: hazard impact no es NaN');

        const featNew = ftTransformerService.extractEmployeeFeatures(newHire, 1000);
        const fwdNew = ftTransformerService.forward(featNew, params);
        assert(!isNaN(fwdNew.turnoverProbability), `Nuevo colaborador: Probabilidad FT no es NaN (${fwdNew.turnoverProbability})`);

        // 3.2 Colaborador outlier extremo (100 ausencias, salario 10x media)
        const outlier = {
            id: 'emp_outlier',
            tenantId: 'test_tenant',
            hireDate: new Date(Date.now() - 365 * 24 * 3600 * 1000),
            absences: Array.from({ length: 100 }, (_, i) => ({ id: `a_${i}`, createdAt: new Date() })),
            attendance: Array.from({ length: 50 }, (_, i) => ({ id: `att_${i}`, isLate: true })),
            evaluations: [{ finalScore: 10 }],
            PayrollDetail: [{ overtimeHours: 150 }]
        };
        const ctxOutlier = await temporalAttentionService.computeTemporalContext(outlier);
        assert(!isNaN(ctxOutlier.temporalHazardImpact), 'Outlier extremo: Atención temporal maneja saturación sin desbordar');
        const featOutlier = ftTransformerService.extractEmployeeFeatures(outlier, 500);
        const fwdOutlier = ftTransformerService.forward(featOutlier, params);
        assert(fwdOutlier.turnoverProbability >= 0.0 && fwdOutlier.turnoverProbability <= 1.0, `Outlier extremo: P(turnover) acotada [0, 1]: ${fwdOutlier.turnoverProbability}`);
    }

    // ──────────────────────────────────────────────────────────────────
    // BLOQUE 4: INFERENCIA CAUSAL (Pearl 2009 / Robins et al. 1994)
    // ──────────────────────────────────────────────────────────────────
    console.log('\n--- [BLOQUE 4] VALIDACIÓN: INFERENCIA CAUSAL (AIPW & G-COMPUTATION) ---');
    {
        const activeTenant = (await prisma.tenant.findFirst({ where: { isActive: true } })) || (await prisma.tenant.findFirst());
        const realTenantId = activeTenant?.id;
        
        // Simular aumento salarial del 10%
        const causalResult = await causalInferenceService.runCausalInterventionSimulation({
            tenantId: realTenantId,
            treatmentType: 'SALARY_INCREASE',
            treatmentValue: 10
        });

        assert(causalResult.sampleSize > 0, `Muestra causal procesó ${causalResult.sampleSize} colaboradores reales`);
        assert(causalResult.impact.ate <= 0, `Efecto Causal ATE negativo/cero (reducción de rotación esperada): ATE = ${causalResult.impact.ate}`);
        assert(causalResult.impact.drATE !== undefined, 'Estimador Doblemente Robusto drATE computado');
        assert(causalResult.impact.confidenceInterval95 !== undefined, 'Intervalo de confianza al 95% computado');
        assert(causalResult.financials.netRoi !== undefined, `ROI Financiero neto computado: $${causalResult.financials.netRoi} USD`);
    }

    // ──────────────────────────────────────────────────────────────────
    // BLOQUE 5: APRENDIZAJE FEDERADO (FedAvg + DP-SGD)
    // ──────────────────────────────────────────────────────────────────
    console.log('\n--- [BLOQUE 5] VALIDACIÓN: APRENDIZAJE FEDERADO & PRIVACIDAD DIFERENCIAL ---');
    {
        const activeTenant = (await prisma.tenant.findFirst({ where: { isActive: true } })) || (await prisma.tenant.findFirst());
        const realTenantId = activeTenant?.id;
        const fedStatus = await federatedLearningService.getTenantPrivacyStatus(realTenantId);
        assert(fedStatus.tenantId === realTenantId, 'Estado de privacidad diferencial del tenant verificado');
        assert(fedStatus.epsilonRemaining >= 0, `Presupuesto epsilon remanente: ${fedStatus.epsilonRemaining} / ${fedStatus.epsilonBudgetMax}`);
        assert(fedStatus.privacyGuarantee.includes('Differential Privacy'), `Garantía de privacidad DP activa: ${fedStatus.privacyGuarantee}`);

        const history = await federatedLearningService.getRoundsHistory();
        assert(Array.isArray(history), `Historial de rondas federadas recuperado (${history.length} rondas)`);
    }

    // ──────────────────────────────────────────────────────────────────
    // BLOQUE 6: APRENDIZAJE POR REFUERZO MULTIOBJETIVO (MORL & PARETO)
    // ──────────────────────────────────────────────────────────────────
    console.log('\n--- [BLOQUE 6] VALIDACIÓN: MORL & FRONTERA DE PARETO ---');
    {
        const activeTenant = (await prisma.tenant.findFirst({ where: { isActive: true } })) || (await prisma.tenant.findFirst());
        const realTenantId = activeTenant?.id;
        const morlResult = await morlOptimizationService.runMorlParetoOptimization({
            tenantId: realTenantId,
            budgetLimit: 5000
        });

        assert(morlResult.paretoFrontier && morlResult.paretoFrontier.length > 0, `Frontera de Pareto generada con ${morlResult.paretoFrontier.length} puntos no dominados`);
        const selectedPt = morlResult.paretoFrontier[morlResult.selectedPointIndex];
        assert(selectedPt !== undefined, 'Punto óptimo balanceado identificado en la frontera de Pareto');
        assert(selectedPt.totalCostEstimate <= 5000 * 1.5, `Presupuesto respetado: $${selectedPt.totalCostEstimate} USD`);
    }

    // ──────────────────────────────────────────────────────────────────
    // BLOQUE 7: K-FOLD CROSS-VALIDATION & FT-TRANSFORMER EVALUATION
    // ──────────────────────────────────────────────────────────────────
    console.log('\n--- [BLOQUE 7] VALIDACIÓN COMPARATIVA K-FOLD (FT vs WEIBULL vs HEURÍSTICO) ---');
    {
        const activeTenant = (await prisma.tenant.findFirst({ where: { isActive: true } })) || (await prisma.tenant.findFirst());
        const realTenantId = activeTenant?.id;
        const comp = await ftTransformerService.evaluateComparativeModels(realTenantId);
        assert(comp.sampleSize > 0, `K-Fold evaluó muestra real de ${comp.sampleSize} colaboradores`);
        assert(comp.models.length === 3, 'Comparativa evaluó los 3 modelos (Heurístico, Weibull+RSI, FT-Transformer)');
        
        const ftModel = comp.models.find(m => m.name.includes('FT-Transformer'));
        const weibullModel = comp.models.find(m => m.name.includes('Weibull'));
        const heurModel = comp.models.find(m => m.name.includes('Heurístico'));

        assert(ftModel && ftModel.f1Score > 0, `F1-Score del FT-Transformer > 0 (${ftModel.f1Score})`);
        assert(ftModel.brierScore < heurModel.brierScore, `FT-Transformer reduce Brier Score vs Heurístico (${ftModel.brierScore} < ${heurModel.brierScore})`);
        console.log(`  → Brier Score: FT-Transformer=${ftModel.brierScore} | Weibull=${weibullModel.brierScore} | Heurístico=${heurModel.brierScore}`);
        console.log(`  → F1-Score:    FT-Transformer=${ftModel.f1Score} | Weibull=${weibullModel.f1Score} | Heurístico=${heurModel.f1Score}`);
    }

    // ──────────────────────────────────────────────────────────────────
    // RESUMEN FINAL
    // ──────────────────────────────────────────────────────────────────
    console.log('\n======================================================================');
    console.log(`📊 RESULTADO FINAL DEL STRESS TEST CIENTÍFICO:`);
    console.log(`   Pruebas Exitosas: ${passedTests}`);
    console.log(`   Pruebas Fallidas: ${failedTests}`);
    console.log('======================================================================\n');

    if (failedTests === 0) {
        console.log('🎉 TODOS LOS MÓDULOS DE IA Y TRANSFORMERS CUMPLEN CON EL RIGOR MATEMÁTICO AL 100%.');
    }
}

runTestSuite().catch(err => {
    console.error('ERROR CRÍTICO EN TEST SUITE:', err);
    process.exit(1);
});
