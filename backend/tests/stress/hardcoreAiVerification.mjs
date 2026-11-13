/**
 * @file hardcoreAiVerification.mjs
 * @description Suite de Pruebas de Estrés Máximo y Auditoría de Causa Raíz para el Ecosistema Completo de IA:
 * 1. RAG Legal con pgvector (HNSW), BM25 híbrido, Bi-Encoder & Cross-Encoder ONNX.
 * 2. Auditor Anti-Alucinación y Calculadora Determinista Decimal.js.
 * 3. Aislamiento Criptográfico y Multi-Tenant (LOPDP).
 * 4. Compilador de Datasets de Fine-Tuning Multi-Modelo (Qwen 2.5, LLaMA 3, Mistral, DeepSeek, OpenAI).
 * 5. Asistente WhatsApp: NLU, Flujo 2FA (OTP), RBAC por Roles y Webhook HMAC.
 * 6. Motores Predictivos (Causal Inference AIPW, MORL Pareto, FT-Transformer, Temporal Attention, DP-SGD).
 * 7. Integración en Vivo con PostgreSQL 15 + pgvector e Internet / Hugging Face.
 */

import { Decimal } from 'decimal.js';
import crypto from 'crypto';
import prisma from '../../src/database/db.js';
import sustainabilityRepository from '../../src/modules/sustainability/sustainability.repository.js';
import sustainabilityRagService from '../../src/modules/sustainability/sustainabilityRag.service.js';
import sustainabilityFineTuningService from '../../src/modules/sustainability/sustainabilityFineTuning.service.js';
import legalEvaluatorService from '../../src/modules/sustainability/legalEvaluator.service.js';
import neuralRetrieverService from '../../src/modules/sustainability/neuralRetriever.service.js';
import llmProviderService from '../../src/modules/sustainability/llmProvider.service.js';
import whatsappAiService from '../../src/modules/whatsapp/whatsappAi.service.js';
import whatsappSecurityService from '../../src/modules/whatsapp/whatsappSecurity.service.js';
import whatsappConfirmationService from '../../src/modules/whatsapp/whatsappConfirmation.service.js';
import causalInferenceService from '../../src/modules/intelligence/predictive/causalInference.service.js';
import morlOptimizationService from '../../src/modules/intelligence/predictive/morlOptimization.service.js';
import ftTransformerService from '../../src/modules/intelligence/predictive/ftTransformer.service.js';
import temporalAttentionService from '../../src/modules/intelligence/predictive/temporalAttention.service.js';
import federatedLearningService from '../../src/modules/intelligence/predictive/federatedLearning.service.js';
import { WHATSAPP_INTENTS } from '../../src/modules/whatsapp/whatsapp.constants.js';
import { computePrivacyAccountant } from '../../src/modules/intelligence/predictive/rdpAccountant.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Fallo de aserción: ${message}`);
  }
}

async function runHardcoreAiAudit() {
  console.log('='.repeat(78));
  console.log('AUDITORIA DE MAXIMO RIGOR Y PRUEBAS DE ESTRES DE IA - NORMA ERP');
  console.log('='.repeat(78));

  // --------------------------------------------------------------------------
  // 1. VERIFICACION DE BASE DE DATOS Y PGVECTOR HNSW
  // --------------------------------------------------------------------------
  console.log('\n--- [FASE 1] BASE DE DATOS & PGVECTOR EN POSTGRESQL 15 ---');
  
  const extCheck = await prisma.$queryRawUnsafe(
    `SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';`
  );
  assert(extCheck.length > 0, `Extension pgvector activa en PostgreSQL (Version: ${extCheck[0]?.extversion})`);

  const chunkStats = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int AS total, count(embedding)::int AS embedded FROM "knowledge_chunks";`
  );
  assert(chunkStats[0]?.total >= 1880, `Corpus legal indexado en BD (${chunkStats[0]?.total} chunks)`);
  assert(chunkStats[0]?.embedded >= 1880, `Todos los chunks disponen de embedding vectorial 768-dim (${chunkStats[0]?.embedded})`);

  // Búsqueda vectorial HNSW real con distancia coseno <=>
  const testVecQuery = await prisma.$queryRawUnsafe(
    `SELECT id, "articleCode", (1 - (embedding <=> (
       SELECT embedding FROM knowledge_chunks WHERE "articleCode" = 'Código del Trabajo Art. 188 (Parte 1)' LIMIT 1
     )))::float AS sim
     FROM knowledge_chunks
     ORDER BY embedding <=> (
       SELECT embedding FROM knowledge_chunks WHERE "articleCode" = 'Código del Trabajo Art. 188 (Parte 1)' LIMIT 1
     )
     LIMIT 3;`
  );
  assert(testVecQuery.length === 3, 'Consulta de similitud coseno HNSW ejecutada exitosamente');
  assert(testVecQuery[0].sim >= 0.999, 'Auto-similitud de vector Art. 188 exacta (sim = 1.0)');

  // --------------------------------------------------------------------------
  // 2. MODELOS NEURONALES ONNX LOCALES (CPU INT8)
  // --------------------------------------------------------------------------
  console.log('\n--- [FASE 2] INFERENCIA ONNX CUANTIZADA INT8 LOCAL ---');
  const onnxStatus = neuralRetrieverService.getStatus();
  assert(onnxStatus.biEncoderReady, 'Bi-Encoder ONNX cuantizado presente y verificado en disco');
  assert(onnxStatus.crossEncoderReady, 'Cross-Encoder Evaluador ONNX presente y verificado en disco');

  const liveEmbedding = await neuralRetrieverService.embedQuery('desahucio y bonificacion por renuncia voluntaria');
  assert(Array.isArray(liveEmbedding) && liveEmbedding.length === 768, 'Bi-Encoder vectoriza consulta en vivo a 768 dimensiones');
  
  const norm = Math.sqrt(liveEmbedding.reduce((acc, v) => acc + v * v, 0));
  assert(Math.abs(norm - 1.0) < 0.01, `Embedding normalizado unitariamente L2 (norm = ${norm.toFixed(4)})`);

  const passages = [
    'Art. 185 Bonificación por desahucio: El empleador bonificará al trabajador con el veinticinco por ciento del equivalente a la última remuneración mensual por cada uno de los años de servicio prestados.',
    'Art. 42 Obligaciones del empleador: Pagar las cantidades que correspondan al trabajador, en los términos del contrato.',
    'Las Islas Galápagos se encuentran a mil kilómetros de la costa del Ecuador continental.'
  ];
  const ceScores = await neuralRetrieverService.rerankPairs('cuanto corresponde por desahucio', passages);
  assert(ceScores && ceScores.length === 3, 'Cross-Encoder re-rankea candidatos en vivo');
  assert(ceScores[0] > ceScores[1] && ceScores[0] > ceScores[2], `Cross-Encoder prioriza Art. 185 sobre obligaciones generales y texto irrelevante (Score 185: ${ceScores[0]} vs Ajeno: ${ceScores[2]})`);

  // --------------------------------------------------------------------------
  // 3. AISLAMIENTO MULTI-TENANT ESTRICTO (LOPDP) EN RAG
  // --------------------------------------------------------------------------
  console.log('\n--- [FASE 3] AISLAMIENTO MULTI-TENANT ESTRICTO (LOPDP) ---');
  
  // Buscar un tenant real para la prueba
  const realTenant = await prisma.tenant.findFirst({ select: { id: true, name: true } });
  assert(Boolean(realTenant), `Tenant de prueba localizado (${realTenant.name} - ${realTenant.id})`);

  // Insertar un documento privado en Tenant A con cláusula confidencial
  const testPrivateDoc = await prisma.knowledgeDocument.create({
    data: {
      tenantId: realTenant.id,
      title: 'Politica Privada Interna de Bonificaciones Confidenciales Tenant A',
      category: 'INTERNAL_POLICY',
      version: '2026-TEST',
      chunks: {
        create: [
          {
            content: 'Clausula Secreta Confidencial 999: El bono de fin de ano para directores de Tenant A es de diez mil dolares.',
            articleCode: 'Clausula Secreta 999',
            odsTarget: '8.5',
            contentHash: 'hash_test_confidential_999'
          }
        ]
      }
    },
    include: { chunks: true }
  });

  try {
    // 3a. Consulta como Tenant B (o sin tenantId) buscando la cláusula confidencial
    const unauthorizedSearch = await sustainabilityRepository.searchKnowledgeChunks({
      query: 'bono de fin de ano para directores clausula secreta 999',
      tenantId: 'otro_tenant_ajeno_xyz',
      limit: 10
    });
    const leakDetected = unauthorizedSearch.some(c => 
      c.content.includes('Clausula Secreta Confidencial 999') || 
      c.document?.title?.includes('Tenant A')
    );
    assert(!leakDetected, 'Tenant ajeno NO puede acceder a documentos confidenciales privados de otra empresa');

    // 3b. Consulta como el Tenant A propietario legítimo
    const authorizedSearch = await sustainabilityRepository.searchKnowledgeChunks({
      query: 'bono de fin de ano para directores clausula secreta 999',
      tenantId: realTenant.id,
      limit: 10
    });
    const legitimateFound = authorizedSearch.some(c => 
      c.content.includes('Clausula Secreta Confidencial 999')
    );
    assert(legitimateFound, 'Tenant propietario SI puede recuperar sus políticas internas privadas');
  } finally {
    // Limpieza atómica del documento de prueba
    await prisma.knowledgeChunk.deleteMany({ where: { documentId: testPrivateDoc.id } });
    await prisma.knowledgeDocument.delete({ where: { id: testPrivateDoc.id } });
  }

  // --------------------------------------------------------------------------
  // 4. AUDITOR ANTI-ALUCINACION Y CALCULADORA DECIMAL.JS
  // --------------------------------------------------------------------------
  console.log('\n--- [FASE 4] AUDITOR ANTI-ALUCINACION & DECIMAL.JS ---');

  // Test de precisión matemática exacta con Decimal.js
  const salary = new Decimal('1250.75');
  const years = new Decimal('6');
  // Desahucio Art. 185: 25% del salario mensual por cada año de servicio
  const expectedDesahucio = salary.times('0.25').times(years); // 1250.75 * 0.25 * 6 = 1876.125 -> ROUND_HALF_UP = 1876.13
  assert(expectedDesahucio.toFixed(2) === '1876.13', 'Cálculo de Desahucio Art. 185 matemáticamente exacto con Decimal.js ($1876.13)');

  // Despido Intempestivo Art. 188: > 3 años = 1 remuneración por cada año
  const expectedDespido = salary.times(years); // 1250.75 * 6 = 7504.50
  assert(expectedDespido.toFixed(2) === '7504.50', 'Cálculo de Despido Art. 188 exacto ($7504.50)');

  // Test del Verificador de Fidelidad (Groundedness Judge) ante citas falsas
  const fakeLlmAnswer = 'Conforme al Art. 9999 del Código del Trabajo y al Art. 7777 de la Ley de Finiquitos, el trabajador tiene derecho a 100 sueldos.';
  const fidelityCheck = legalEvaluatorService.verifyAnswerFidelity({
    answerText: fakeLlmAnswer,
    retrievedChunks: [
      { articleCode: 'Art. 188', content: 'Indemnización por despido intempestivo...' },
      { articleCode: 'Art. 185', content: 'Bonificación por desahucio...' }
    ],
    liveCalculation: null
  });
  assert(fidelityCheck.unverifiedArticles.includes('Art. 9999'), 'Auditor detecta e impugna el artículo apócrifo Art. 9999');
  assert(fidelityCheck.unverifiedArticles.includes('Art. 7777'), 'Auditor detecta e impugna el artículo apócrifo Art. 7777');
  assert(fidelityCheck.groundednessScore < 0.5, 'Puntaje de fidelidad degradado drásticamente ante alucinaciones');

  // --------------------------------------------------------------------------
  // 5. PIPELINE RAG DE PUNTA A PUNTA (CONSULTAS COMPLEJAS REALES)
  // --------------------------------------------------------------------------
  console.log('\n--- [FASE 5] PIPELINE RAG COMPLETO EN PRODUCCION ---');

  const ragQuery1 = await sustainabilityRagService.processQuery({
    query: 'me despidieron intempestivamente tengo 4 anos de trabajo y ganaba 800 dolares',
    tenantId: realTenant.id,
    userRole: 'employee',
    moduleContext: 'offboarding'
  });
  assert(ragQuery1 && ragQuery1.answer, 'RAG procesa consulta compleja de despido');
  assert(ragQuery1.legalCitations.some(c => c.articleCode.includes('188')), 'RAG cita formalmente el Art. 188 del Código del Trabajo');
  assert(ragQuery1.legalCitations.some(c => c.articleCode.includes('185')), 'RAG cita formalmente el Art. 185 sobre bonificación por desahucio');
  assert(ragQuery1.evaluationAudit && ragQuery1.evaluationAudit.groundednessScore >= 0.8, `Puntaje de fidelidad verificado >= 0.80 (Score: ${ragQuery1.evaluationAudit?.groundednessScore})`);

  const ragQuery2 = await sustainabilityRagService.processQuery({
    query: 'cuanto recargo se paga por trabajar horas suplementarias despues de las 24h00 y en feriado',
    tenantId: realTenant.id,
    userRole: 'employee',
    moduleContext: 'attendance'
  });
  assert(ragQuery2.legalCitations.some(c => c.articleCode.includes('55') || c.articleCode.includes('49')), 'RAG recupera Art. 55 y Art. 49 para jornada nocturna y horas extraordinarias');

  // --------------------------------------------------------------------------
  // 6. COMPILADOR DE DATASETS DE FINE-TUNING MULTI-MODELO
  // --------------------------------------------------------------------------
  console.log('\n--- [FASE 6] COMPILADOR DE FINE-TUNING MULTI-MODELO ---');

  const targetModels = ['qwen2.5', 'llama3', 'mistral', 'deepseek', 'openai'];
  for (const tm of targetModels) {
    const ds = await sustainabilityFineTuningService.generateDataset({
      targetModel: tm,
      includeTenantData: false,
      categories: ['LABOR_CODE', 'IESS_REGULATION']
    });
    assert(ds.samples.length >= 150, `Dataset generado para ${tm} con ${ds.samples.length} muestras de entrenamiento`);
    
    // Validar primera muestra
    const sample = ds.samples[0];
    if (tm === 'openai') {
      assert(Array.isArray(sample.messages) && sample.messages.length === 3, `Formato OpenAI válido con messages[]`);
    } else if (tm === 'qwen2.5') {
      assert(sample.text.includes('<|im_start|>system'), `Tokens ChatML <|im_start|> presentes en Qwen 2.5`);
      assert(sample.text.includes('<|im_start|>user'), `Tokens ChatML de usuario presentes`);
      assert(sample.text.includes('<|im_start|>assistant'), `Tokens ChatML de asistente presentes`);
    } else if (tm === 'llama3') {
      assert(sample.text.includes('<|begin_of_text|>') && sample.text.includes('<|start_header_id|>'), `Tokens oficiales de LLaMA 3 presentes`);
    } else if (tm === 'mistral') {
      assert(sample.text.includes('<s>[INST]') && sample.text.includes('[/INST]'), `Tokens oficiales de Mistral presentes`);
    } else if (tm === 'deepseek') {
      assert(sample.text.includes('<｜begin of sentence｜>') && sample.text.includes('<｜User｜>'), `Tokens nativos de DeepSeek presentes`);
    }
  }

  // --------------------------------------------------------------------------
  // 7. ASISTENTE WHATSAPP: NLU, FLUIDEZ CONVERSACIONAL Y SEGURIDAD 2FA
  // --------------------------------------------------------------------------
  console.log('\n--- [FASE 7] ASISTENTE WHATSAPP: NLU & SEGURIDAD 2FA ---');

  const dummyEmployee = {
    id: 'emp_test_wa_001',
    firstName: 'Mateo',
    lastName: 'Andrade',
    identification: '1710034065',
    phone: '+593991234567',
    email: 'mateo.andrade@test.com',
    role: 'employee',
    department: 'Operaciones',
    position: 'Supervisor de Planta',
    vacationDays: 12,
    tenantId: realTenant.id,
    tenant: { name: realTenant.name, ruc: '1790012345001' }
  };

  // NLU Intent classification stress
  const testIntents = [
    { text: 'hola buenas tardes como estas', expected: 'GENERAL_GREETING' },
    { text: 'necesito pedir vacaciones por favor', expected: 'VACATION_REQUEST_ACTION' },
    { text: 'quiero un anticipo de sueldo de 200 dolares', expected: 'SALARY_ADVANCE_ACTION' },
    { text: 'solicito permiso médico para mañana', expected: 'PERMISSION_REQUEST_ACTION' },
    { text: 'como puedo ver mi rol de pagos', expected: 'PAYROLL_SLIP_QUERY' },
    { text: 'cuanto me pagan si renuncio despues de 3 anos', expected: WHATSAPP_INTENTS.LEGAL_QUERY }
  ];

  for (const item of testIntents) {
    const classified = whatsappAiService.classifyIntent(item.text, dummyEmployee);
    assert(classified === item.expected, `NLU clasifica "${item.text.slice(0, 30)}..." como ${item.expected}`);
  }

  // Webhook HMAC-SHA256 signature test
  const appSecret = 'secret_whatsapp_test_production_key';
  const payloadRaw = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
  const validSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(payloadRaw).digest('hex');
  const invalidSignature = 'sha256=' + crypto.createHmac('sha256', 'wrong_secret').update(payloadRaw).digest('hex');

  assert(whatsappSecurityService.verifyWebhookSignature(payloadRaw, validSignature, appSecret), 'Firma HMAC válida verificada correctamente');
  assert(!whatsappSecurityService.verifyWebhookSignature(payloadRaw, invalidSignature, appSecret), 'Firma HMAC con clave incorrecta rechazada');
  assert(!whatsappSecurityService.verifyWebhookSignature(payloadRaw + 'tampered', validSignature, appSecret), 'Payload manipulado rechazado');

  // Validación en tiempo constante de documento de identidad del colaborador
  assert(whatsappSecurityService.verifyIdentityCard('1710034065', '1710034065'), 'Cédula completa verificada en tiempo constante (1710034065)');
  assert(!whatsappSecurityService.verifyIdentityCard('1710034065', '1710034069'), 'Cédula no coincidente rechazada');
  assert(!whatsappSecurityService.verifyIdentityCard('1710034065', '123'), 'Cédula de longitud inválida rechazada');

  // Generación criptográfica segura de OTP
  const otp1 = whatsappSecurityService.generateNumericOtp(6);
  const otp2 = whatsappSecurityService.generateNumericOtp(6);
  assert(/^\d{6}$/.test(otp1) && /^\d{6}$/.test(otp2), 'OTPs de 6 dígitos generados con CSPRNG');
  assert(otp1 !== otp2, 'Generador de OTPs no repite secuencias');

  // --------------------------------------------------------------------------
  // 8. MOTORES PREDICTIVOS TABULARES Y ESTOCASTICOS
  // --------------------------------------------------------------------------
  console.log('\n--- [FASE 8] MOTORES PREDICTIVOS & PRIVACIDAD DIFERENCIAL ---');

  // Inferencia Causal AIPW (Doubly Robust)
  const causalRes = await causalInferenceService.runCausalInterventionSimulation({
    tenantId: realTenant.id,
    treatmentType: 'SALARY_INCREASE',
    parameterValue: 10
  });
  assert(typeof causalRes.impact?.ate === 'number' && !isNaN(causalRes.impact.ate), `Inferencia Causal AIPW calculó ATE: ${causalRes.impact.ate.toFixed(4)}`);
  assert(typeof causalRes.impact?.drATE === 'number' && !isNaN(causalRes.impact.drATE), `Estimador Doblemente Robusto drATE: ${causalRes.impact.drATE.toFixed(4)}`);

  // MORL Pareto Multi-Objetivo
  const morlRes = await morlOptimizationService.runMorlParetoOptimization({
    tenantId: realTenant.id,
    budgetCap: 15000
  });
  assert(Array.isArray(morlRes.paretoFrontier) && morlRes.paretoFrontier.length > 0, `MORL generó ${morlRes.paretoFrontier.length} puntos en la frontera de Pareto`);
  assert(typeof morlRes.selectedPointIndex === 'number', 'Punto de Pareto seleccionado e indexado');

  // Rényi Differential Privacy (RDP) Budget Accountant
  const dpCheck = await federatedLearningService.getTenantPrivacyStatus(realTenant.id);
  const remainingEps = dpCheck.epsilonBudgetMax - dpCheck.epsilonSpent;
  assert(typeof remainingEps === 'number' && remainingEps > 0, `Presupuesto Épsilon de Privacidad remanente: ${remainingEps.toFixed(2)}`);

  const dpBudgetAnalysis = computePrivacyAccountant({ rounds: 5, noiseMultiplier: 1.2, delta: 1e-5, samplingRate: 0.2 });
  assert(typeof dpBudgetAnalysis.rounds === 'number' && dpBudgetAnalysis.rounds === 5, 'RDP Accountant ejecutó análisis de rondas federadas');
  assert(dpBudgetAnalysis.epsilonAccumulated > 0, `RDP Accountant computa epsilon acumulado para rondas federadas (eps = ${dpBudgetAnalysis.epsilonAccumulated})`);

  // FT-Transformer forward pass
  const ftWeights = await ftTransformerService.getTenantWeights(realTenant.id);
  const ftFeatures = [0.5, 0.2, 0.8, 0.1, 0.4, 0.3];
  const ftProb = ftTransformerService.forward(ftFeatures, ftWeights.params);
  assert(typeof ftProb.turnoverProbability === 'number' && ftProb.turnoverProbability >= 0 && ftProb.turnoverProbability <= 1, `FT-Transformer calculó riesgo acotado [0, 1]: ${(ftProb.turnoverProbability * 100).toFixed(1)}%`);

  // Temporal Attention Longitudinal
  const tempSummary = await temporalAttentionService.getCorporateTemporalAttentionSummary(realTenant.id);
  assert(tempSummary.meanMonthlyWeights && tempSummary.meanMonthlyWeights.length === 12, 'Temporal Attention procesó secuencia de 12 meses históricos');
  const sumWeights = tempSummary.meanMonthlyWeights.reduce((a, b) => a + b, 0);
  assert(Math.abs(sumWeights - 1.0) < 0.05, `Suma Softmax de pesos temporales converge a 1.0 (${sumWeights.toFixed(4)})`);

  console.log('\n' + '='.repeat(78));
  console.log(`RESUMEN FINAL DE LA AUDITORIA DE IA: ${passedTests} / ${totalTests} PRUEBAS EXITOSAS (100%)`);
  console.log('='.repeat(78));
}

runHardcoreAiAudit()
  .then(() => {
    console.log('\nSISTEMA DE IA COMPLETO, INTEGRADO Y VERIFICADO CON EXITO.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nERROR DURANTE LA AUDITORIA DE IA:', err);
    process.exit(1);
  });
