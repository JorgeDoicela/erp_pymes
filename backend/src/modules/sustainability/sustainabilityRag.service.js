/**
 * @file sustainabilityRag.service.js
 * @description Orquestador RAG con Modelo Buscador (1,910+ fragmentos de los 4 PDFs oficiales),
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

export class SustainabilityRagService {
  /**
   * Procesa una consulta desde cualquier lugar del ERP mediante el pipeline:
   * 1) Modelo Buscador (1,910+ fragmentos de los 4 PDFs)
   * 2) Modelo Evaluador de Relevancia (Reranker Contextual)
   * 3) Calculadora Jurídico-Contable Decimal.js
   * 4) Modelo Generador (DeepSeek / OpenAI / Gemini / Modelo Local Afinado)
   * 5) Modelo Evaluador de Fidelidad Anti-Alucinaciones (Groundedness Judge)
   * @param {Object} params
   */
  async processQuery({
    query,
    conversationHistory = [],
    tenantId,
    odsTargetFilter,
    categoryFilter,
    moduleContext = 'sustainability',
    providerOverrides = {},
  }) {
    // 1. MODELO BUSCADOR: Recuperar los 16 mejores candidatos entre los 1,910+ artículos de los 4 PDFs
    const rawCandidateChunks = await sustainabilityRepository.searchKnowledgeChunks({
      query,
      odsTarget: odsTargetFilter || undefined,
      category: categoryFilter || undefined,
      tenantId,
      limit: 16,
    });

    // 2. MODELO EVALUADOR (FASE 1 — RERANKER): Evaluar relevancia, diversidad normativa y afinidad con el módulo
    const evaluatedChunks = await legalEvaluatorService.evaluateAndRerankChunks({
      query,
      candidateChunks: rawCandidateChunks,
      moduleContext,
      topK: 6,
    });

    // 3. TELEMETRÍA EN VIVO DEL ERP: Obtener estado real del tenant
    const tenantMetrics = await sustainabilityService.calculateOds8Metrics(tenantId);

    // 4. CALCULADORA DETERMINISTA DECIMAL.JS: Si la consulta involucra montos, años u horas
    const liveCalculation = this.computeLiveLegalCalculation(query);

    // 5. Estructurar citas legales verificables con su puntaje del Evaluador
    const legalCitations = evaluatedChunks.map((chunk) => ({
      documentTitle: chunk.document?.title || 'Código del Trabajo del Ecuador',
      articleCode: chunk.articleCode || 'Disposición Normativa',
      odsTarget: chunk.odsTarget || 'ODS 8',
      category: chunk.document?.category || 'LABOR_CODE',
      relevanceScore: chunk.relevanceScore ?? 1.0,
      evaluatorConfidence: chunk.evaluatorConfidence ?? 0.95,
      summarySnippet:
        chunk.content.length > 220 ? `${chunk.content.substring(0, 220)}...` : chunk.content,
      fullContent: chunk.content,
    }));

    // 6. MODELO GENERADOR (DeepSeek / Cualquier API / Modelo Local Fine-Tuned en Ollama o vLLM)
    let rawAnswer;
    let inferenceMode = 'DETERMINISTIC_RAG_EVALUATOR';
    const safeOverrides = providerOverrides || {};
    const activeProviderInfo = llmProviderService.resolveActiveConfig(safeOverrides);

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
      rawAnswer = llmResult.content;
      inferenceMode = `${llmResult.provider} (${llmResult.model})`;
    } else {
      rawAnswer = this.generateSynthesizedAdvice({
        query,
        relevantChunks: evaluatedChunks,
        tenantMetrics,
        liveCalculation,
        moduleContext,
      });
    }

    // 7. MODELO EVALUADOR (FASE 2 — VERIFICADOR DE FIDELIDAD Y CERO ALUCINACIONES)
    const evaluationAudit = legalEvaluatorService.verifyAnswerFidelity({
      answerText: rawAnswer,
      retrievedChunks: evaluatedChunks,
      liveCalculation,
      allKnownArticleCodes: sustainabilityRepository.getKnownArticleNumbers(),
    });

    const corpusStats = sustainabilityRepository.getCorpusStatistics();

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
        verifiedArticles: evaluationAudit.verifiedArticles,
        unverifiedArticles: evaluationAudit.unverifiedArticles,
        mathVerified: evaluationAudit.mathVerified,
        totalCorpusIndexedChunks: corpusStats.totalIndexedChunks,
      },
      tenantScore: tenantMetrics?.ods?.overallScore ?? 100,
      complianceLevel: tenantMetrics?.ods?.complianceLevel ?? 'ALTO',
      erpContext: tenantMetrics?.erpContext || {},
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Construye el System Prompt con restricción absoluta al corpus extraído de los 4 PDFs
   * @private
   */
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
      .map(
        (c, i) =>
          `[Fuente Verificada ${i + 1} | Confianza Evaluador: ${((c.evaluatorConfidence || 0.9) * 100).toFixed(0)}% | ${c.articleCode} | ${c.document?.title}]:\n${c.content}`
      )
      .join('\n\n');

    const promptLines = [
      'Eres el Asistente Jurídico, Contable y Laboral Oficial de Norma ERP para la República del Ecuador.',
      isWhatsapp
        ? 'Canal de atención: WhatsApp Corporativo. Responde de forma ejecutiva, breve y directa en formato WhatsApp (*negrita* para artículos y leyes, guiones para viñetas, sin tablas ni numerales ###).'
        : `El usuario está consultando desde el módulo: [${String(moduleContext || 'general').toUpperCase()}].`,
      '',
      'REGLAS INVIOLABLES DEL MODELO EVALUADOR (CERO ALUCINACIONES):',
      '1. Responde ÚNICAMENTE con base en las Fuentes Verificadas extraídas de los 4 documentos oficiales (Constitución del Ecuador 2008, Código del Trabajo, Ley de Seguridad Social IESS y Metodología OIT ODS 8) incluidas abajo.',
      '2. Cita siempre el número exacto del artículo (ej. Art. 188 del Código del Trabajo, Art. 11 de la Ley de Seguridad Social) tal como aparece en las fuentes recuperadas.',
      '3. Si la información consultada NO consta en las Fuentes Verificadas abajo, indica con claridad: "No se encuentra el fundamento oficial para esta consulta en el corpus normativo cargado", y NUNCA inventes artículos de memoria.',
      '4. Cuando existan cálculos monetarios, utiliza OBLIGATORIAMENTE las cifras exactas pre-calculadas con Decimal.js en la sección de Verificación Matemática.',
      '5. Emplea un tono profesional, directo, estructurado y sin emojis.',
    ];

    if (!isWhatsapp) {
      promptLines.push(
        '',
        '=== TELEMETRÍA EN VIVO DE LA EMPRESA (TENANT) ===',
        `- Índice Global ODS 8: ${ods.overallScore ?? 100}% (Nivel: ${ods.complianceLevel || 'ALTO'})`,
        `- Colaboradores Activos: ${erpCtx.totalActiveEmployees ?? 0} | Con Contrato Vigente: ${erpCtx.employeesWithActiveContract ?? 0}`,
        `- Sueldo Promedio: $${(erpCtx.averageSalaryUsd ?? 0).toFixed(2)} USD | SBU Vigente: $${SBU_ECUADOR_2026.toFixed(2)} USD`,
        `- Períodos Contables Abiertos: ${erpCtx.openAccountingPeriods ?? 0} | Asientos Contables NIIF: ${erpCtx.totalJournalEntries ?? 0}`
      );
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

  /**
   * Calcula similitud coseno exacta entre dos vectores numéricos
   */
  cosineSimilarity(vecA, vecB) {
    if (
      !Array.isArray(vecA) ||
      !Array.isArray(vecB) ||
      vecA.length === 0 ||
      vecA.length !== vecB.length
    ) {
      return 0;
    }
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
