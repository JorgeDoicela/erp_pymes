/**
 * @file ragEvaluation.service.js
 * @description Motor de Evaluación Cuantitativa RAG (estándar Ragas / DeepEval) para certificar
 * extremo a extremo el Asistente Jurídico de Norma ERP en 6 métricas: Context Precision, Context Recall,
 * Faithfulness, Answer Correctness, Citation Accuracy y Temporal Validity.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import sustainabilityRagService from './sustainabilityRag.service.js';

export const MANDATORY_RAG_BENCHMARK_CASES = [
  {
    id: 'BENCH_01_DESPIDO_INTEMPESTIVO',
    title: 'Despido intempestivo y liquidación de haberes (Art. 188 íntegro + co-recuperación)',
    query:
      '¿Qué debo pagar al despedir intempestivamente a un trabajador y cómo se calcula la indemnización?',
    expectedArticles: ['188', '185', '69', '71', '111', '113'],
    expectedContentMarkers: [
      'Hasta tres años de servicio',
      'veinte y cinco meses de remuneración',
      'fracción de un año se considerará como año completo',
    ],
    expectedAnswerSignals: [/188/, /185/, /ejemplo referencial|par[aá]metros/i],
    expectOutOfScope: false,
    requireTemporalDistinction: false,
  },
  {
    id: 'BENCH_02_VACACIONES_NO_GOZADAS',
    title: 'Vacaciones anuales y liquidación de vacaciones no gozadas (Arts. 69 y 71)',
    query:
      '¿Cómo se liquidan y pagan las vacaciones anuales no gozadas cuando un trabajador sale de la empresa?',
    expectedArticles: ['69', '71'],
    expectedContentMarkers: ['quince días', 'veinticuatroava parte'],
    expectedAnswerSignals: [/69/, /71/, /veinticuatroava|1\/24/i],
    expectOutOfScope: false,
    requireTemporalDistinction: false,
  },
  {
    id: 'BENCH_03_DECIMO_CUARTO_QUITO',
    title: 'Décimo cuarto sueldo en Quito — Régimen Sierra y Amazonía (Art. 113)',
    query:
      '¿Cuándo se paga el décimo cuarto sueldo en Quito y qué período aplica para la región Sierra y Amazonía?',
    expectedArticles: ['113'],
    expectedContentMarkers: ['15 de agosto', 'Sierra y Amazónica'],
    expectedAnswerSignals: [/113/, /15 de agosto/i, /Sierra/i],
    expectOutOfScope: false,
    requireTemporalDistinction: false,
  },
  {
    id: 'BENCH_04_FUERA_DEL_CORPUS',
    title: 'Consulta ajena al corpus normativo (Control de abstención y cero alucinación)',
    query:
      '¿Cuál es la órbita geoestacionaria y el protocolo de propulsión nuclear para naves interplanetarias a Júpiter?',
    expectedArticles: [],
    expectedContentMarkers: [],
    expectedAnswerSignals: [/No se encuentra el fundamento oficial/i],
    expectOutOfScope: true,
    requireTemporalDistinction: false,
  },
  {
    id: 'BENCH_05_REFORMA_NORMATIVA_VIGENCIA',
    title: 'Reforma laboral: legislación vigente reformada vs. artículos derogados (2015)',
    query:
      '¿Cómo cambió la reforma laboral de 2015 el contrato a plazo fijo por contrato indefinido y qué artículos quedaron reformados o derogados?',
    expectedArticles: ['14', '184', '181', '189'],
    expectedContentMarkers: ['Registro Oficial Suplemento 483', 'Artículo derogado'],
    expectedAnswerSignals: [/14/, /VIGENTE_REFORMADO|Reformado/i, /DEROGADO|Artículo derogado/i],
    expectOutOfScope: false,
    requireTemporalDistinction: true,
  },
];

export class RagEvaluationService {
  /**
   * Evalúa un caso individual contra las 6 métricas de calidad RAG (Ragas / DeepEval).
   */
  async evaluateTestCase(testCase, providerOverrides = { provider: 'local' }) {
    const ragResult = await sustainabilityRagService.processQuery({
      query: testCase.query,
      moduleContext: 'sustainability',
      providerOverrides,
    });

    const citations = ragResult.legalCitations || [];
    const audit = ragResult.evaluationAudit || {};

    const contextPrecision = this.computeContextPrecision(testCase, citations);
    const contextRecall = this.computeContextRecall(testCase, citations);
    const faithfulness = Number((audit.groundednessScore ?? 0).toFixed(4));
    const citationAccuracy = Number((audit.citationAccuracy ?? 0).toFixed(4));
    const temporalValidity = this.computeTemporalValidity(
      testCase,
      citations,
      ragResult.answer,
      audit
    );
    const answerCorrectness = this.computeAnswerCorrectness(testCase, ragResult);

    const overallScore = Number(
      (
        (contextPrecision +
          contextRecall +
          faithfulness +
          answerCorrectness +
          citationAccuracy +
          temporalValidity) /
        6
      ).toFixed(4)
    );

    return {
      id: testCase.id,
      title: testCase.title,
      query: testCase.query,
      passed:
        contextPrecision >= 0.8 &&
        contextRecall >= 0.95 &&
        faithfulness >= 0.85 &&
        answerCorrectness >= 0.85 &&
        citationAccuracy >= 0.95 &&
        temporalValidity >= 0.95,
      metrics: {
        contextPrecision,
        contextRecall,
        faithfulness,
        answerCorrectness,
        citationAccuracy,
        temporalValidity,
        overallScore,
      },
      retrievedArticles: citations.map((c) => ({
        articleCode: c.articleCode,
        temporalStatus: c.temporalStatus,
        confidence: c.evaluatorConfidence,
      })),
      auditStatus: audit.status,
    };
  }

  /**
   * Ejecuta la batería oficial de 5 pruebas diagnósticas y devuelve el reporte consolidado.
   */
  async runMandatoryBenchmarkSuite(providerOverrides = { provider: 'local' }) {
    const results = [];
    for (const testCase of MANDATORY_RAG_BENCHMARK_CASES) {
      const evaluated = await this.evaluateTestCase(testCase, providerOverrides);
      results.push(evaluated);
    }

    const avg = (key) =>
      Number(
        (results.reduce((sum, r) => sum + r.metrics[key], 0) / (results.length || 1)).toFixed(4)
      );

    return {
      executedAt: new Date().toISOString(),
      totalCases: results.length,
      passedCases: results.filter((r) => r.passed).length,
      allPassed: results.every((r) => r.passed),
      summaryMetrics: {
        contextPrecision: avg('contextPrecision'),
        contextRecall: avg('contextRecall'),
        faithfulness: avg('faithfulness'),
        answerCorrectness: avg('answerCorrectness'),
        citationAccuracy: avg('citationAccuracy'),
        temporalValidity: avg('temporalValidity'),
        overallScore: avg('overallScore'),
      },
      cases: results,
    };
  }

  computeContextPrecision(testCase, citations) {
    if (testCase.expectOutOfScope) {
      return citations.length === 0 ? 1.0 : 0.0;
    }
    if (citations.length === 0) return 0.0;

    // Average Precision @ K: pondera que los artículos esperados estén en los primeros lugares
    let hits = 0;
    let sumPrecisions = 0;
    const expectedSet = testCase.expectedArticles || [];

    citations.forEach((cit, idx) => {
      const isExpected = expectedSet.some((num) =>
        new RegExp(`\\bart(?:[ií]culo|\\.)?\\s*${num.replace('.', '\\.')}\\b`, 'i').test(
          String(cit.articleCode || '').trim()
        )
      );
      if (isExpected) {
        hits++;
        sumPrecisions += hits / (idx + 1);
      }
    });

    if (hits === 0) return 0.0;
    return Number(Math.min(1.0, sumPrecisions / hits).toFixed(4));
  }

  computeContextRecall(testCase, citations) {
    if (testCase.expectOutOfScope) {
      return citations.length === 0 ? 1.0 : 0.0;
    }
    const expectedArticles = testCase.expectedArticles || [];
    const expectedMarkers = testCase.expectedContentMarkers || [];
    const totalTargets = expectedArticles.length + expectedMarkers.length;
    if (totalTargets === 0) return 1.0;

    const fullRetrievedText = citations.map((c) => `${c.articleCode} ${c.fullContent}`).join('\n');
    let matched = 0;

    for (const artNum of expectedArticles) {
      const regex = new RegExp(`\\bart(?:[ií]culo|\\.)?\\s*${artNum.replace('.', '\\.')}\\b`, 'i');
      if (citations.some((c) => regex.test(String(c.articleCode || '').trim()))) {
        matched++;
      }
    }

    for (const marker of expectedMarkers) {
      if (fullRetrievedText.toLowerCase().includes(marker.toLowerCase())) {
        matched++;
      }
    }

    return Number((matched / totalTargets).toFixed(4));
  }

  computeTemporalValidity(testCase, citations, answerText, audit) {
    if (testCase.expectOutOfScope) return 1.0;
    if ((audit.repealedCitationsWarning || []).length > 0) return 0.4;

    if (testCase.requireTemporalDistinction) {
      const hasReformedCitation = citations.some((c) => c.temporalStatus === 'VIGENTE_REFORMADO');
      const hasRepealedCitation = citations.some((c) => c.temporalStatus === 'DEROGADO');
      const answerDistinguishes =
        /\b(reformad[oa]|vigente)\b/i.test(answerText) && /\bderogad[oa]\b/i.test(answerText);
      if (hasReformedCitation && hasRepealedCitation && answerDistinguishes) return 1.0;
      return 0.6;
    }

    const activeRatio =
      citations.length > 0 ? citations.filter((c) => !c.isRepealed).length / citations.length : 1.0;
    return Number(activeRatio.toFixed(4));
  }

  computeAnswerCorrectness(testCase, ragResult) {
    const answer = String(ragResult.answer || '');
    if (testCase.expectOutOfScope) {
      return ragResult.evaluationAudit?.status === 'OUT_OF_CORPUS_SCOPE' &&
        /No se encuentra el fundamento oficial/i.test(answer)
        ? 1.0
        : 0.0;
    }

    const signals = testCase.expectedAnswerSignals || [];
    if (signals.length === 0) return 1.0;
    const matchedSignals = signals.filter((regex) => regex.test(answer)).length;
    return Number((matchedSignals / signals.length).toFixed(4));
  }
}

export default new RagEvaluationService();
