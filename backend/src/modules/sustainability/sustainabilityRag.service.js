/**
 * @file sustainabilityRag.service.js
 * @description Orquestador RAG con Modelo Buscador (1,910+ fragmentos de los 4 PDFs oficiales),
 * Modelo Evaluador (Cross-Encoder Reranker + Verificador de Fidelidad), Calculadora Decimal.js
 * y Adaptador Universal de Modelos Grandes (DeepSeek, OpenAI, Gemini, Anthropic y Local Fine-Tuned GGUF).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Decimal } from 'decimal.js';
import sustainabilityRepository from './sustainability.repository.js';
import sustainabilityService, { SBU_ECUADOR_2026 } from './sustainability.service.js';
import llmProviderService from './llmProvider.service.js';
import legalEvaluatorService from './legalEvaluator.service.js';

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
    // 1. MODELO BUSCADOR: Recuperar los 14 mejores candidatos entre los 1,910+ artículos de los 4 PDFs
    const rawCandidateChunks = await sustainabilityRepository.searchKnowledgeChunks({
      query,
      odsTarget: odsTargetFilter,
      category: categoryFilter,
      tenantId,
      limit: 14,
    });

    // 2. MODELO EVALUADOR (FASE 1 — RERANKER): Evaluar relevancia y afinidad con el lugar del ERP
    const evaluatedChunks = legalEvaluatorService.evaluateAndRerankChunks({
      query,
      candidateChunks: rawCandidateChunks,
      moduleContext,
      topK: 5,
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
    let activeProviderInfo = llmProviderService.resolveActiveConfig(providerOverrides);

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
      providerOverrides,
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
      evaluationAudit: {
        status: evaluationAudit.status,
        groundednessScore: evaluationAudit.groundednessScore,
        verifiedArticles: evaluationAudit.verifiedArticles,
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

    const contextBlocks = evaluatedChunks
      .map(
        (c, i) =>
          `[Fuente Verificada ${i + 1} | Confianza Evaluador: ${((c.evaluatorConfidence || 0.9) * 100).toFixed(0)}% | ${c.articleCode} | ${c.document?.title}]:\n${c.content}`
      )
      .join('\n\n');

    return [
      'Eres el Asistente Jurídico, Contable y Laboral Oficial de Norma ERP para la República del Ecuador.',
      `El usuario está consultando desde el módulo: [${String(moduleContext || 'general').toUpperCase()}].`,
      '',
      'REGLAS INVIOLABLES DEL MODELO EVALUADOR (CERO ALUCINACIONES):',
      '1. Responde ÚNICAMENTE con base en las Fuentes Verificadas extraídas de los 4 documentos oficiales (Constitución del Ecuador 2008, Código del Trabajo, Ley de Seguridad Social IESS y Metodología OIT ODS 8) incluidas abajo.',
      '2. Cita siempre el número exacto del artículo (ej. Art. 188 del Código del Trabajo, Art. 11 de la Ley de Seguridad Social) tal como aparece en las fuentes recuperadas.',
      '3. Cuando existan cálculos monetarios, utiliza OBLIGATORIAMENTE las cifras exactas pre-calculadas con Decimal.js en la sección de Verificación Matemática.',
      '4. Emplea un tono profesional, directo, estructurado en Markdown y sin emojis.',
      '',
      '=== TELEMETRÍA EN VIVO DE LA EMPRESA (TENANT) ===',
      `- Índice Global ODS 8: ${ods.overallScore ?? 100}% (Nivel: ${ods.complianceLevel || 'ALTO'})`,
      `- Colaboradores Activos: ${erpCtx.totalActiveEmployees ?? 0} | Con Contrato Vigente: ${erpCtx.employeesWithActiveContract ?? 0}`,
      `- Sueldo Promedio: $${(erpCtx.averageSalaryUsd ?? 0).toFixed(2)} USD | SBU Vigente: $${SBU_ECUADOR_2026.toFixed(2)} USD`,
      `- Períodos Contables Abiertos: ${erpCtx.openAccountingPeriods ?? 0} | Asientos Contables NIIF: ${erpCtx.totalJournalEntries ?? 0}`,
      '',
      '=== ARTÍCULOS Y SECCIONES EXTRAÍDAS DE LOS 4 PDFs OFICIALES ===',
      contextBlocks,
      liveCalculation
        ? `\n=== VERIFICACIÓN MATEMÁTICA OFICIAL (DECIMAL.JS — 20 DÍGITOS ROUND_HALF_UP) ===\n${liveCalculation.formattedSummary}`
        : '',
    ].join('\n');
  }

  /**
   * Calcula similitud coseno exacta entre dos vectores numéricos
   * @param {number[]} vecA
   * @param {number[]} vecB
   * @returns {number}
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

  /**
   * Motor de Cálculo Jurídico y Contable Determinista con Decimal.js (20 dígitos, ROUND_HALF_UP)
   * Detecta parámetros numéricos en la consulta (sueldo, años, horas extras) y ejecuta la liquidación exacta.
   * @param {string} query
   */
  computeLiveLegalCalculation(query) {
    if (!query) return null;
    const qLower = query.toLowerCase();

    const salaryMatch =
      query.match(/\$\s*(\d+(?:[.,]\d+)?)/i) ||
      query.match(
        /(?:sueldo|salario|remuneraci[oó]n|gana|percibe)\s+(?:de\s+|mensual\s+de\s+)?\$?\s*(\d+(?:[.,]\d+)?)/i
      ) ||
      query.match(/(\d{3,5}(?:[.,]\d+)?)\s*(?:usd|d[oó]lares)/i);

    const parsedSalary = salaryMatch ? parseFloat(salaryMatch[1].replace(',', '.')) : null;
    const baseSalary =
      parsedSalary && parsedSalary >= 100 && parsedSalary <= 50000
        ? new Decimal(parsedSalary)
        : new Decimal(SBU_ECUADOR_2026);

    const yearsMatch = query.match(/(\d+)\s*a[ñn]os?/i);
    const monthsMatch = query.match(/(\d+)\s*mes(?:es)?/i);
    const years = yearsMatch ? parseInt(yearsMatch[1], 10) : null;
    const extraMonths = monthsMatch ? parseInt(monthsMatch[1], 10) : 0;

    const hoursMatch = query.match(/(\d+(?:[.,]\d+)?)\s*horas?/i);
    const numHours = hoursMatch ? parseFloat(hoursMatch[1].replace(',', '.')) : null;

    // 1. Caso Finiquito / Despido Intempestivo / Desahucio / Renuncia
    if (
      qLower.includes('liquidaci') ||
      qLower.includes('finiquito') ||
      qLower.includes('despido') ||
      qLower.includes('desahucio') ||
      qLower.includes('renuncia') ||
      qLower.includes('188') ||
      qLower.includes('185')
    ) {
      const effectiveYears = years !== null ? years : 3;
      const isUnfairDismissal =
        qLower.includes('despido') || qLower.includes('intempestivo') || qLower.includes('188');

      const desahucioAmount = baseSalary
        .times(0.25)
        .times(effectiveYears)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      let severanceMonths = 0;
      if (isUnfairDismissal) {
        const totalYearsWithFraction =
          extraMonths > 0 ? effectiveYears + 1 : Math.max(1, effectiveYears);
        severanceMonths = Math.min(25, Math.max(3, totalYearsWithFraction));
      }
      const severanceAmount = baseSalary
        .times(severanceMonths)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const propMonths = extraMonths > 0 ? extraMonths : 6;
      const thirteenthProp = baseSalary
        .times(propMonths)
        .dividedBy(12)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const fourteenthProp = new Decimal(SBU_ECUADOR_2026)
        .times(propMonths)
        .dividedBy(12)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const vacationProp = baseSalary
        .times(propMonths)
        .dividedBy(24)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const totalSettlement = desahucioAmount
        .plus(severanceAmount)
        .plus(thirteenthProp)
        .plus(fourteenthProp)
        .plus(vacationProp)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const formattedSummary = [
        `**Simulación Aritmética de Liquidación (` +
          `Sueldo Base: \`$${baseSalary.toFixed(2)}\` | Antigüedad: \`${effectiveYears} año(s)${extraMonths ? ` y ${extraMonths} mes(es)` : ''}\` | Modalidad: \`${isUnfairDismissal ? 'Despido Intempestivo' : 'Renuncia / Acuerdo Voluntario'}\`):**`,
        `- **Bonificación por Desahucio (Art. 185 — 25% × ${effectiveYears} años completos):** \`$${desahucioAmount.toFixed(2)} USD\``,
        isUnfairDismissal
          ? `- **Indemnización por Despido Intempestivo (Art. 188 — ${severanceMonths} remuneraciones):** \`$${severanceAmount.toFixed(2)} USD\``
          : `- **Indemnización Art. 188:** \`$0.00 USD\` (No aplica en renuncia voluntaria).`,
        `- **Proporcional Décimo Tercer Sueldo (${propMonths}/12 meses ref.):** \`$${thirteenthProp.toFixed(2)} USD\``,
        `- **Proporcional Décimo Cuarto Sueldo (${propMonths}/12 meses sobre SBU $${SBU_ECUADOR_2026.toFixed(2)}):** \`$${fourteenthProp.toFixed(2)} USD\``,
        `- **Proporcional Vacaciones No Gozadas (Art. 69 — 1/24):** \`$${vacationProp.toFixed(2)} USD\``,
        `- **TOTAL LIQUIDACIÓN ESTIMADA (Acta SUT):** \`$${totalSettlement.toFixed(2)} USD\``,
      ].join('\n');

      return {
        type: 'SETTLEMENT_CALCULATION',
        baseSalary: baseSalary.toNumber(),
        years: effectiveYears,
        extraMonths,
        desahucioAmount: desahucioAmount.toNumber(),
        severanceAmount: severanceAmount.toNumber(),
        thirteenthProp: thirteenthProp.toNumber(),
        fourteenthProp: fourteenthProp.toNumber(),
        vacationProp: vacationProp.toNumber(),
        totalSettlement: totalSettlement.toNumber(),
        formattedSummary,
      };
    }

    // 2. Caso Horas Extras / Suplementarias / Nocturnas
    if (
      qLower.includes('hora') ||
      qLower.includes('suplementaria') ||
      qLower.includes('extraordinaria') ||
      qLower.includes('nocturna') ||
      qLower.includes('sobretiempo')
    ) {
      const hours = numHours !== null && numHours > 0 ? new Decimal(numHours) : new Decimal(8);
      const hourlyBase = baseSalary.dividedBy(240);
      const supp50Hour = hourlyBase.times(1.5).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
      const extra100Hour = hourlyBase.times(2.0).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
      const night25Hour = hourlyBase.times(1.25).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);

      const totalSupp50 = hourlyBase
        .times(1.5)
        .times(hours)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const totalExtra100 = hourlyBase
        .times(2.0)
        .times(hours)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const totalNight25 = hourlyBase
        .times(0.25)
        .times(hours)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const formattedSummary = [
        `**Cálculo de Sobretiempos con Decimal.js (Sueldo Base: \`$${baseSalary.toFixed(2)}\` | Divisor Legal: \`240h\` | Cantidad: \`${hours.toFixed(1)}h\`):**`,
        `- **Valor Hora Ordinaria Diurna (\`$${baseSalary.toFixed(2)} / 240\`):** \`$${hourlyBase.toDecimalPlaces(4).toFixed(4)} USD\``,
        `- **Hora Suplementaria Diurna 50% (Art. 55.1 — Factor 1.50):** \`$${supp50Hour.toFixed(4)}/h\` → Total por ${hours.toFixed(1)}h: \`$${totalSupp50.toFixed(2)} USD\``,
        `- **Hora Extraordinaria Fin de Semana / Feriado 100% (Art. 55.2 — Factor 2.00):** \`$${extra100Hour.toFixed(4)}/h\` → Total por ${hours.toFixed(1)}h: \`$${totalExtra100.toFixed(2)} USD\``,
        `- **Recargo por Jornada Nocturna 25% (Art. 49 — 19h00 a 06h00):** Valor hora \`$${night25Hour.toFixed(4)}/h\` → Recargo puro por ${hours.toFixed(1)}h: \`$${totalNight25.toFixed(2)} USD\``,
      ].join('\n');

      return {
        type: 'OVERTIME_CALCULATION',
        baseSalary: baseSalary.toNumber(),
        hours: hours.toNumber(),
        hourlyRate: hourlyBase.toDecimalPlaces(4).toNumber(),
        totalSupp50: totalSupp50.toNumber(),
        totalExtra100: totalExtra100.toNumber(),
        totalNight25: totalNight25.toNumber(),
        formattedSummary,
      };
    }

    // 3. Caso Rol de Pagos, IESS o Asiento Contable NIIF
    if (
      qLower.includes('iess') ||
      qLower.includes('aporte') ||
      qLower.includes('asiento') ||
      qLower.includes('contab') ||
      qLower.includes('rol de pago') ||
      qLower.includes('fondos de reserva') ||
      parsedSalary !== null
    ) {
      const iessPersonal = baseSalary.times(0.0945).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const iessPatronal = baseSalary.times(0.1115).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const reserveFund = baseSalary
        .times(new Decimal(1).dividedBy(12))
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const thirteenthMonthly = baseSalary.dividedBy(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const fourteenthMonthly = new Decimal(SBU_ECUADOR_2026)
        .dividedBy(12)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const netSalary = baseSalary.minus(iessPersonal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const totalDebit = baseSalary.plus(iessPatronal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const totalIessPayable = iessPersonal
        .plus(iessPatronal)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const formattedSummary = [
        `**Desglose de Nómina, IESS y Asiento Contable NIIF (Materia Gravada: \`$${baseSalary.toFixed(2)} USD\`):**`,
        `- **Aporte Personal IESS (9.45% retenido al trabajador):** \`$${iessPersonal.toFixed(2)} USD\``,
        `- **Aporte Patronal IESS (11.15% costo empleador):** \`$${iessPatronal.toFixed(2)} USD\``,
        `- **Líquido a Recibir (Sueldo Neto sin beneficios mensualizados):** \`$${netSalary.toFixed(2)} USD\``,
        `- **Fondo de Reserva (8.33% desde mes 13):** \`$${reserveFund.toFixed(2)} USD\` | **Décimo 3ro Mensual:** \`$${thirteenthMonthly.toFixed(2)} USD\` | **Décimo 4to Mensual:** \`$${fourteenthMonthly.toFixed(2)} USD\``,
        `- **Asiento Contable de Diario (Partida Doble Cuadrada):**`,
        `  - \`DÉBITO\` 5.1.01 Sueldos y Salarios: \`$${baseSalary.toFixed(2)}\` | \`DÉBITO\` 5.1.03 Aporte Patronal IESS: \`$${iessPatronal.toFixed(2)}\` (\`Σ Débitos = $${totalDebit.toFixed(2)}\`)`,
        `  - \`CRÉDITO\` 2.1.03 IESS por Pagar (20.60%): \`$${totalIessPayable.toFixed(2)}\` | \`CRÉDITO\` 2.1.01 Bancos / Sueldos por Pagar: \`$${netSalary.toFixed(2)}\` (\`Σ Créditos = $${totalDebit.toFixed(2)}\`)`,
      ].join('\n');

      return {
        type: 'PAYROLL_ACCOUNTING_CALCULATION',
        baseSalary: baseSalary.toNumber(),
        iessPersonal: iessPersonal.toNumber(),
        iessPatronal: iessPatronal.toNumber(),
        netSalary: netSalary.toNumber(),
        reserveFund: reserveFund.toNumber(),
        totalDebit: totalDebit.toNumber(),
        formattedSummary,
      };
    }

    return null;
  }

  /**
   * Síntesis analítica estructurada cuando no hay API Key ni servidor LLM externo conectado,
   * garantizando que responda con los artículos exactos recuperados de los 4 PDFs y el Evaluador.
   * @private
   */
  generateSynthesizedAdvice({
    query,
    relevantChunks,
    tenantMetrics,
    liveCalculation,
    moduleContext,
  }) {
    const ods = tenantMetrics?.ods || {};
    const erpCtx = tenantMetrics?.erpContext || {};
    const score = ods.overallScore ?? 100;
    const formalRate = ods.indicators?.formalContractRate?.value ?? 100;
    const iessRate = ods.indicators?.socialSecurityCoverage?.value ?? 100;
    const salaryRate = ods.indicators?.salaryEquitabilityIndex?.value ?? 100;

    const sections = [];

    sections.push(
      `### Dictamen Jurídico y Técnico Verificado — Norma ERP (Módulo: ${String(moduleContext || 'general').toUpperCase()})\n` +
        `**Estado del Tenant:** Cumplimiento ODS 8: \`${score.toFixed(2)}%\` (${ods.complianceLevel || 'ALTO'}) · ` +
        `Plantilla Activa: \`${erpCtx.totalActiveEmployees ?? 0}\` · ` +
        `Contratos Vigentes: \`${formalRate}%\` · Cobertura IESS: \`${iessRate}%\` · SBU Conforme: \`${salaryRate}%\`.`
    );

    if (relevantChunks && relevantChunks.length > 0) {
      const legalLines = relevantChunks.slice(0, 4).map((chunk) => {
        const code = chunk.articleCode
          ? `**${chunk.articleCode}**`
          : `**${chunk.document?.title}**`;
        const conf = chunk.evaluatorConfidence
          ? ` · *Confianza Evaluador: ${(chunk.evaluatorConfidence * 100).toFixed(0)}%*`
          : '';
        return `- ${code} *(ODS ${chunk.odsTarget || '8.8'}${conf})*:\n  ${chunk.content}`;
      });
      sections.push(
        `#### 1. Artículos Exactos Recuperados de los 4 Documentos Oficiales\n${legalLines.join('\n\n')}`
      );
    }

    if (liveCalculation && liveCalculation.formattedSummary) {
      sections.push(
        `#### 2. Liquidación y Verificación Matemática (Decimal.js)\n${liveCalculation.formattedSummary}`
      );
    }

    const actionStepNum = liveCalculation ? 3 : 2;
    const actionLines = this.buildContextualActionPlan(query, erpCtx, ods);
    sections.push(
      `#### ${actionStepNum}. Protocolo Operativo en Norma ERP\n${actionLines.join('\n')}`
    );

    return sections.join('\n\n');
  }

  /**
   * Construye recomendaciones accionables conectadas con los módulos específicos de Norma ERP
   * @private
   */
  buildContextualActionPlan(query, erpCtx, ods) {
    const qLower = (query || '').toLowerCase();
    const actions = [];

    if (
      qLower.includes('contab') ||
      qLower.includes('asiento') ||
      qLower.includes('niif') ||
      qLower.includes('balance')
    ) {
      actions.push(
        `1. Verificar en el módulo de **Contabilidad Financiera** que exista un período \`OPEN\` (actualmente: \`${erpCtx.openAccountingPeriods ?? 0}\` abiertos y \`${erpCtx.totalJournalEntries ?? 0}\` asientos registrados).`,
        `2. Comprobar que el asiento de nómina valide la invariante de partida doble (\`Σ Débitos = Σ Créditos\`) antes de pasar a estado \`POSTED\`.`,
        `3. Conciliar las cuentas de pasivo \`IESS por Pagar (20.60%)\` y provisiones de décimos contra el estado de resultados mensual.`
      );
    } else if (
      qLower.includes('impuesto') ||
      qLower.includes('sri') ||
      qLower.includes('renta') ||
      qLower.includes('gastos personales')
    ) {
      actions.push(
        `1. Deducir el \`9.45%\` de aporte personal al IESS de los ingresos gravados anuales para determinar la base imponible en relación de dependencia.`,
        `2. Excluir de la base imponible del SRI el Décimo Tercer Sueldo, Décimo Cuarto Sueldo y Fondos de Reserva conforme al Art. 10 de la LORTI.`,
        `3. Aplicar la rebaja del \`18%\` sobre gastos personales proyectados según el número de cargas familiares registradas en el expediente del colaborador.`
      );
    } else if (
      qLower.includes('lopdp') ||
      qLower.includes('privacidad') ||
      qLower.includes('encript') ||
      qLower.includes('firma') ||
      qLower.includes('biometr')
    ) {
      actions.push(
        `1. Mantener activo el cifrado de campo \`AES-256-GCM\` para remuneraciones y coordenadas GPS truncadas a 4 decimales (tasa actual de consentimiento LOPDP: \`${erpCtx.trackingConsentRate ?? 100}%\`).`,
        `2. Emitir roles de pago y actas de finiquito con firma electrónica \`.p12\` o sello criptográfico \`SHA-256\` verificable mediante código QR.`,
        `3. Auditar los accesos a datos sensibles en el registro inmutable \`AuditLog\`.`
      );
    } else {
      actions.push(
        `1. Confirmar que el \`100%\` de la plantilla activa (\`${erpCtx.totalActiveEmployees ?? 0}\` colaboradores) mantenga contrato formalizado en el SUT y remuneración igual o superior al SBU (\`$${(ods.sbuReferenceUsd || SBU_ECUADOR_2026).toFixed(2)} USD\`).`,
        `2. Conciliar las horas extraordinarias geolocalizadas (\`${erpCtx.overtimeHoursTracked30d ?? 0}h\` en los últimos 30 días) con los haberes liquidados en nómina.`,
        `3. Declarar las planillas de aportes personales (\`9.45%\`), patronales (\`11.15%\`) y fondos de reserva (\`8.33%\`) en el IESS hasta el día 15 del mes siguiente para evitar responsabilidad patronal.`
      );
    }

    return actions;
  }
}

export default new SustainabilityRagService();
