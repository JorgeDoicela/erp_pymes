/**
 * @file sustainabilityRag.service.js
 * @description Orquestador RAG con Modelo Buscador (1,810+ fragmentos limpios de los 4 PDFs oficiales),
 * Modelo Evaluador (Cross-Encoder Reranker + Verificador de Fidelidad), Calculadora Decimal.js
 * y Adaptador Universal de Modelos Grandes (DeepSeek, OpenAI, Gemini, Anthropic y Local Fine-Tuned GGUF).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import sustainabilityRepository from './sustainability.repository.js';
import sustainabilityService, { SBU_ECUADOR_2026 } from './sustainability.service.js';
import llmProviderService from './llmProvider.service.js';
import legalEvaluatorService from './legalEvaluator.service.js';
import {
  computeLiveLegalCalculation,
  generateSynthesizedAdvice,
  buildContextualActionPlan,
} from './legalCalculation.helper.js';

const TENANT_TELEMETRY_ROLES = new Set(['admin', 'hr', 'accounting', 'manager', 'entrepreneur']);

export class SustainabilityRagService {
  async processQuery({
    query,
    conversationHistory = [],
    tenantId,
    userRole,
    odsTargetFilter,
    categoryFilter,
    moduleContext = 'sustainability',
    providerOverrides = {},
  }) {
    const rawCandidateChunks = await sustainabilityRepository.searchKnowledgeChunks({
      query,
      odsTarget: odsTargetFilter || undefined,
      category: categoryFilter || undefined,
      tenantId,
      limit: 18,
    });

    const evaluatedChunks = await legalEvaluatorService.evaluateAndRerankChunks({
      query,
      candidateChunks: rawCandidateChunks,
      moduleContext,
      topK: 6,
    });

    const sufficiency = legalEvaluatorService.assessRetrievalSufficiency({
      query,
      evaluatedChunks,
    });
    const safeOverrides = providerOverrides || {};
    const activeProviderInfo = llmProviderService.resolveActiveConfig(safeOverrides);
    const corpusStats = sustainabilityRepository.getCorpusStatistics();

    if (sufficiency.isOutOfScope) {
      return this.buildOutOfScopeResponse({
        query,
        moduleContext,
        activeProviderInfo,
        corpusStats,
      });
    }

    const tenantMetrics = await this.resolveTenantTelemetry(tenantId, userRole);
    const liveCalculation = this.computeLiveLegalCalculation(query);
    const legalCitations = this.mapLegalCitations(evaluatedChunks);

    const { rawAnswer, inferenceMode } = await this.generateGroundedAnswer({
      query,
      conversationHistory,
      evaluatedChunks,
      tenantMetrics,
      liveCalculation,
      moduleContext,
      safeOverrides,
    });

    const evaluationAudit = legalEvaluatorService.verifyAnswerFidelity({
      answerText: rawAnswer,
      retrievedChunks: evaluatedChunks,
      liveCalculation,
      allKnownArticleCodes: sustainabilityRepository.getKnownArticleNumbers(),
    });

    return {
      query,
      moduleContext,
      answer: evaluationAudit.auditedAnswer,
      legalCitations,
      liveCalculation,
      inferenceMode,
      providerConfigured: activeProviderInfo.providerName,
      providerInfo: activeProviderInfo,
      totalIndexedArticles: corpusStats.totalIndexedChunks,
      evaluationAudit: {
        status: evaluationAudit.status,
        groundednessScore: evaluationAudit.groundednessScore,
        citationAccuracy: evaluationAudit.citationAccuracy,
        temporalValidity: evaluationAudit.temporalValidity,
        verifiedArticles: evaluationAudit.verifiedArticles,
        corpusSupportedArticles: evaluationAudit.corpusSupportedArticles,
        unverifiedArticles: evaluationAudit.unverifiedArticles,
        repealedCitationsWarning: evaluationAudit.repealedCitationsWarning,
        mathVerified: evaluationAudit.mathVerified,
        totalCorpusIndexedChunks: corpusStats.totalIndexedChunks,
      },
      tenantScore: tenantMetrics?.ods?.overallScore ?? null,
      complianceLevel: tenantMetrics?.ods?.complianceLevel ?? null,
      erpContext: tenantMetrics?.erpContext || {},
      generatedAt: new Date().toISOString(),
    };
  }

  async resolveTenantTelemetry(tenantId, userRole) {
    const normalizedRole = userRole ? String(userRole).toLowerCase() : null;
    const canAccess =
      Boolean(tenantId) && (!normalizedRole || TENANT_TELEMETRY_ROLES.has(normalizedRole));
    return canAccess ? await sustainabilityService.calculateOds8Metrics(tenantId) : null;
  }

  mapLegalCitations(evaluatedChunks) {
    return evaluatedChunks.map((chunk) => ({
      documentTitle: chunk.document?.title || 'Código del Trabajo del Ecuador',
      articleCode: chunk.articleCode || 'Disposición Normativa',
      odsTarget: chunk.odsTarget || 'ODS 8',
      category: chunk.document?.category || 'LABOR_CODE',
      temporalStatus: chunk.metadata?.temporalStatus || 'VIGENTE',
      isRepealed: Boolean(chunk.metadata?.isRepealed),
      lastReformYear: chunk.metadata?.lastReformYear || null,
      reformNotes: chunk.metadata?.reformNotes || [],
      relevanceScore: chunk.relevanceScore ?? 1.0,
      evaluatorConfidence: chunk.evaluatorConfidence ?? 0.95,
      summarySnippet:
        chunk.content.length > 220 ? `${chunk.content.substring(0, 220)}...` : chunk.content,
      fullContent: chunk.content,
    }));
  }

  async generateGroundedAnswer({
    query,
    conversationHistory,
    evaluatedChunks,
    tenantMetrics,
    liveCalculation,
    moduleContext,
    safeOverrides,
  }) {
    const systemPrompt = this.buildStrictGroundedSystemPrompt({
      evaluatedChunks,
      tenantMetrics,
      liveCalculation,
      moduleContext,
    });
    const historyMessages = [
      ...(conversationHistory || []).slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: query },
    ];

    const llmResult = await llmProviderService.generateChatCompletion({
      systemPrompt,
      messages: historyMessages,
      temperature: 0.1,
      providerOverrides: safeOverrides,
    });

    if (llmResult && llmResult.content) {
      return {
        rawAnswer: llmResult.content,
        inferenceMode: `${llmResult.provider} (${llmResult.model})`,
      };
    }
    return {
      rawAnswer: this.generateSynthesizedAdvice({
        query,
        relevantChunks: evaluatedChunks,
        tenantMetrics,
        liveCalculation,
        moduleContext,
      }),
      inferenceMode: 'DETERMINISTIC_RAG_EVALUATOR',
    };
  }

  buildOutOfScopeResponse({ query, moduleContext, activeProviderInfo, corpusStats }) {
    const answer = [
      '### Consulta Fuera del Alcance del Corpus Normativo Oficial',
      'No se encuentra el fundamento oficial para esta consulta en el corpus normativo cargado (Constitución de la República del Ecuador 2008, Código del Trabajo, Ley de Seguridad Social IESS y Metodología OIT ODS 8).',
      '',
      'El Asistente Jurídico y Contable de Norma ERP opera bajo restricción estricta de evidencia documental verificada y no emite opiniones sobre materias ajenas a la legislación laboral, societaria, tributaria de nómina, seguridad social o sostenibilidad empresarial del Ecuador.',
    ].join('\n');

    return {
      query,
      moduleContext,
      answer,
      legalCitations: [],
      liveCalculation: null,
      inferenceMode: 'EVALUATOR_SCOPE_GUARD',
      providerConfigured: activeProviderInfo.providerName,
      providerInfo: activeProviderInfo,
      totalIndexedArticles: corpusStats.totalIndexedChunks,
      evaluationAudit: {
        status: 'OUT_OF_CORPUS_SCOPE',
        groundednessScore: 1.0,
        citationAccuracy: 1.0,
        temporalValidity: 1.0,
        verifiedArticles: [],
        corpusSupportedArticles: [],
        unverifiedArticles: [],
        repealedCitationsWarning: [],
        mathVerified: true,
        totalCorpusIndexedChunks: corpusStats.totalIndexedChunks,
      },
      tenantScore: null,
      complianceLevel: null,
      erpContext: {},
      generatedAt: new Date().toISOString(),
    };
  }

  buildStrictGroundedSystemPrompt({
    evaluatedChunks,
    tenantMetrics,
    liveCalculation,
    moduleContext,
  }) {
    const erpCtx = tenantMetrics?.erpContext || {};
    const ods = tenantMetrics?.ods || {};
    const isWhatsapp = String(moduleContext || '').toLowerCase() === 'whatsapp';

    const contextBlocks = evaluatedChunks
      .map((c, i) => {
        const statusTag = c.metadata?.temporalStatus || 'VIGENTE';
        const reformTag = c.metadata?.lastReformYear
          ? ` | Últ. Reforma: ${c.metadata.lastReformYear}`
          : '';
        return `[Fuente Verificada ${i + 1} | Confianza Evaluador: ${((c.evaluatorConfidence || 0.9) * 100).toFixed(0)}% | Estado: ${statusTag}${reformTag} | ${c.articleCode} | ${c.document?.title}]:\n${c.content}`;
      })
      .join('\n\n');

    const promptLines = [
      'Eres el Asistente Jurídico, Contable y Laboral Oficial de Norma ERP para la República del Ecuador.',
      isWhatsapp
        ? 'Canal de atención: WhatsApp Corporativo. Responde de forma ejecutiva, breve y directa en formato WhatsApp (*negrita* para artículos y leyes, guiones para viñetas, sin tablas ni numerales ###).'
        : `El usuario está consultando desde el módulo: [${String(moduleContext || 'general').toUpperCase()}].`,
      '',
      'REGLAS INVIOLABLES DEL MODELO EVALUADOR (CERO ALUCINACIONES):',
      '1. Responde ÚNICAMENTE con base en las Fuentes Verificadas extraídas de los 4 documentos oficiales (Constitución del Ecuador 2008, Código del Trabajo, Ley de Seguridad Social IESS y Metodología OIT ODS 8) incluidas abajo.',
      '2. Cita únicamente artículos cuyo texto completo aparezca en las [Fuente Verificada ...] de abajo. Queda prohibido presentar como verificado un artículo cuyo contenido no esté disponible en el contexto recuperado.',
      '3. Si la información consultada NO consta en las Fuentes Verificadas abajo, indica expresamente: "No se encuentra el fundamento oficial para esta consulta en el corpus normativo cargado", y NUNCA inventes artículos de memoria.',
      '4. Cuando existan cálculos monetarios en la sección de Verificación Matemática, utiliza las cifras exactas de Decimal.js. Si el cálculo indica que es un ejemplo referencial ilustrativo por parámetros no especificados, advierte explícitamente qué condiciones faltan por confirmar antes de tomarlo como liquidación definitiva.',
      '5. Respeta el Estado de Vigencia Temporal (VIGENTE, VIGENTE_REFORMADO o DEROGADO) de cada fuente y distingue claramente entre disposiciones vigentes y figuras derogadas.',
      '6. Emplea un tono profesional, directo, estructurado y sin emojis.',
    ];

    if (!isWhatsapp && tenantMetrics) {
      const moduleCode = String(moduleContext || 'general').toLowerCase();
      const moduleTelemetry = {
        payroll: `- Roles Auditados: ${erpCtx.payrollsAuditedCount ?? 0} | Comprobantes Firmados: ${erpCtx.signedPayslipsCount ?? 0} | Bajo SBU: ${erpCtx.subSbuEmployeesCount ?? 0}`,
        attendance: `- Horas Extra (30d): ${erpCtx.overtimeHoursTracked30d ?? 0}h | Pagadas Recientes: $${(erpCtx.overtimeAmountPaidRecent ?? 0).toFixed(2)} USD | Consentimiento Geocerca LOPDP: ${erpCtx.trackingConsentRate ?? 100}%`,
        offboarding: `- Procesos de Finiquito Auditados: ${erpCtx.offboardingsCount ?? 0} | Cumplimiento Legal: ${ods.indicators?.verifiedLegalSettlements?.value ?? 100}%`,
        contracts: `- Tasa de Formalidad Contractual: ${ods.indicators?.formalContractRate?.value ?? 100}% (${erpCtx.employeesWithActiveContract ?? 0}/${erpCtx.totalActiveEmployees ?? 0})`,
        recruitment: `- Vacantes Abiertas: ${erpCtx.openJobVacancies ?? 0} | Evaluaciones 360°: ${erpCtx.totalPerformanceEvaluations ?? 0}`,
        performance: `- Evaluaciones 360° Registradas: ${erpCtx.totalPerformanceEvaluations ?? 0} | Vacantes Abiertas: ${erpCtx.openJobVacancies ?? 0}`,
        signatures: `- Roles de Pago con Firma Electrónica: ${erpCtx.signedPayslipsCount ?? 0} | Consentimiento LOPDP: ${erpCtx.trackingConsentRate ?? 100}%`,
        entrepreneurship: `- Proyectos de Incubadora Activos: ${erpCtx.activeEntrepreneurships ?? 0}`,
        compliance: `- Consentimiento LOPDP: ${erpCtx.trackingConsentRate ?? 100}% | Cobertura IESS: ${ods.indicators?.socialSecurityCoverage?.value ?? 100}% | Bajo SBU: ${erpCtx.subSbuEmployeesCount ?? 0}`,
      };
      promptLines.push(
        '',
        '=== TELEMETRÍA EN VIVO DE LA EMPRESA (TENANT) ===',
        `- Índice Global ODS 8: ${ods.overallScore ?? 100}% (Nivel: ${ods.complianceLevel || 'ALTO'})`,
        `- Colaboradores Activos: ${erpCtx.totalActiveEmployees ?? 0} | Con Contrato Vigente: ${erpCtx.employeesWithActiveContract ?? 0}`,
        `- Sueldo Promedio: $${(erpCtx.averageSalaryUsd ?? 0).toFixed(2)} USD | SBU Vigente: $${SBU_ECUADOR_2026.toFixed(2)} USD`,
        `- Períodos Contables Abiertos: ${erpCtx.openAccountingPeriods ?? 0} | Asientos Contables NIIF: ${erpCtx.totalJournalEntries ?? 0}`
      );
      if (moduleTelemetry[moduleCode]) promptLines.push(moduleTelemetry[moduleCode]);
    }

    promptLines.push(
      '',
      '=== ARTÍCULOS Y SECCIONES EXTRAÍDAS DE LOS 4 PDFs OFICIALES ===',
      contextBlocks
    );
    if (liveCalculation) {
      promptLines.push(
        '',
        '=== VERIFICACIÓN MATEMÁTICA OFICIAL (DECIMAL.JS — 20 DÍGITOS ROUND_HALF_UP) ===',
        liveCalculation.formattedSummary
      );
    }
    return promptLines.join('\n');
  }

  cosineSimilarity(vecA, vecB) {
    if (
      !Array.isArray(vecA) ||
      !Array.isArray(vecB) ||
      vecA.length === 0 ||
      vecA.length !== vecB.length
    )
      return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  computeLiveLegalCalculation(query) {
    return computeLiveLegalCalculation(query);
  }

  generateSynthesizedAdvice(params) {
    return generateSynthesizedAdvice(params);
  }

  buildContextualActionPlan(query, erpCtx, ods) {
    return buildContextualActionPlan(query, erpCtx, ods);
  }
}

export default new SustainabilityRagService();
