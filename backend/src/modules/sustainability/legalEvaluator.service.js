/**
 * @file legalEvaluator.service.js
 * @description Modelo Evaluador de Relevancia (Cross-Encoder Reranker) y Verificador de Fidelidad Legal
 * (Anti-Hallucination & Groundedness Judge) para asegurar respuestas 100% ceñidas a los 4 PDFs oficiales.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

const NORMATIVE_SOURCE_PATTERNS = [
  { category: 'CONSTITUTION', pattern: /\b(constitucion|constitucional|carta magna)\b/ },
  { category: 'LABOR_CODE', pattern: /\b(codigo del? trabajo|codigo laboral)\b/ },
  { category: 'IESS_REGULATION', pattern: /\b(iess|seguridad social)\b/ },
  { category: 'ODS_8_FRAMEWORK', pattern: /\b(oit|ods\s*8|trabajo decente|8\.[1-9])\b/ },
];

export function detectRequestedNormativeCategories(normQuery) {
  const query = String(normQuery || '');
  return NORMATIVE_SOURCE_PATTERNS.filter(({ pattern }) => pattern.test(query)).map(
    ({ category }) => category
  );
}

export function selectBalancedByCategory(items, limit, requestedCategories, scoreField) {
  if (!Array.isArray(requestedCategories) || requestedCategories.length <= 1) {
    return items.slice(0, limit);
  }

  const selected = [];
  const seenIds = new Set();
  const minPerCategory = Math.max(2, Math.floor(limit / requestedCategories.length));

  for (const category of requestedCategories) {
    let taken = 0;
    for (const item of items) {
      if (item.document?.category === category && !seenIds.has(item.id)) {
        selected.push(item);
        seenIds.add(item.id);
        taken++;
        if (taken >= minPerCategory) break;
      }
    }
  }

  for (const item of items) {
    if (selected.length >= limit) break;
    if (!seenIds.has(item.id)) {
      selected.push(item);
      seenIds.add(item.id);
    }
  }

  return selected.sort((a, b) => (b[scoreField] || 0) - (a[scoreField] || 0)).slice(0, limit);
}

// Mapa de afinidad entre los módulos/vistas del ERP y las categorías normativas
const MODULE_DOMAIN_AFFINITY = {
  payroll: ['PAYROLL', 'IESS', 'TAX_SRI', 'LABOR_CODE', 'IESS_REGULATION'],
  contracts: ['CONTRACTS', 'CONSTITUTION', 'LABOR_CODE'],
  offboarding: ['OFFBOARDING', 'LABOR_CODE', 'SIGNATURES'],
  attendance: ['ATTENDANCE', 'BIOMETRICS', 'GOVERNANCE', 'LABOR_CODE'],
  accounting: ['ACCOUNTING', 'TAX_SRI', 'IESS', 'INTERNAL_POLICY'],
  employees: ['CONTRACTS', 'GOVERNANCE', 'CONSTITUTION', 'LABOR_CODE'],
  performance: ['PERFORMANCE', 'ODS_8', 'ODS_8_FRAMEWORK'],
  recruitment: ['PERFORMANCE', 'CONSTITUTION', 'LABOR_CODE'],
  signatures: ['SIGNATURES', 'GOVERNANCE'],
  sustainability: ['ODS_8', 'ODS_8_FRAMEWORK', 'LABOR_CODE', 'IESS_REGULATION', 'CONSTITUTION'],
};

export class LegalEvaluatorService {
  /**
   * 1. EVALUADOR DE RELEVANCIA (Cross-Encoder Reranker):
   * Evalúa los fragmentos recuperados por el Modelo Buscador, califica su pertinencia en [0, 1]
   * considerando bigramas exactos, citación de artículos y el lugar del ERP donde está el usuario.
   * @param {Object} params
   */
  evaluateAndRerankChunks({
    query,
    candidateChunks = [],
    moduleContext = 'sustainability',
    topK = 6,
  }) {
    if (!candidateChunks || candidateChunks.length === 0) return [];

    const normQuery = this.normalize(query);
    const queryTokens = normQuery.split(/\s+/).filter((t) => t.length >= 3);
    const queryBigrams = this.buildBigrams(queryTokens);

    // Extraer números de artículos mencionados en la pregunta
    const mentionedArticles = [...query.matchAll(/art(?:[ií]culo|\.)?\s*(\d+(?:\.\d+)?)/gi)].map(
      (m) => m[1]
    );

    const preferredDomains =
      MODULE_DOMAIN_AFFINITY[String(moduleContext || 'sustainability').toLowerCase()] || [];

    const maxInitialScore = Math.max(...candidateChunks.map((c) => c.relevanceScore || 1), 1);

    const evaluated = candidateChunks.map((chunk) => {
      const normContent = this.normalize(`${chunk.articleCode || ''} ${chunk.content}`);
      const contentTokens = normContent.split(/\s+/).filter((t) => t.length >= 3);
      const contentBigrams = new Set(this.buildBigrams(contentTokens));

      // A. Puntaje base normalizado del Modelo Buscador (0.0 a 0.45)
      const retrieverComponent = Math.min(
        0.45,
        ((chunk.relevanceScore || 0) / maxInitialScore) * 0.45
      );

      // B. Cobertura de términos clave de la consulta (0.0 a 0.25)
      let matchedTokens = 0;
      for (const qt of queryTokens) {
        if (normContent.includes(qt)) matchedTokens++;
      }
      const tokenCoverage =
        queryTokens.length > 0 ? Math.min(0.25, (matchedTokens / queryTokens.length) * 0.25) : 0.15;

      // C. Coincidencia de bigramas / frases jurídicas exactas (0.0 a 0.15)
      let matchedBigrams = 0;
      for (const bg of queryBigrams) {
        if (contentBigrams.has(bg)) matchedBigrams++;
      }
      const bigramBonus =
        queryBigrams.length > 0 ? Math.min(0.15, (matchedBigrams / queryBigrams.length) * 0.15) : 0;

      // D. Coincidencia exacta de número de artículo (Boost directo +0.25)
      let articleExactBonus = 0;
      if (mentionedArticles.length > 0 && chunk.articleCode) {
        const hasExactArt = mentionedArticles.some((num) =>
          new RegExp(`\\b${num.replace('.', '\\.')}\\b`).test(chunk.articleCode)
        );
        if (hasExactArt) articleExactBonus = 0.25;
      }

      // E. Afinidad con el lugar/módulo del ERP desde donde consulta el usuario (+0.10)
      const chunkDomain = chunk.metadata?.domain || chunk.document?.category || '';
      const contextBonus = preferredDomains.includes(chunkDomain) ? 0.1 : 0.02;

      // F. Puntaje neuronal del Bi-Encoder y Cross-Encoder entrenados en Colab (si están presentes en el chunk)
      const denseBonus =
        typeof chunk.denseSimilarity === 'number' && chunk.denseSimilarity > 0
          ? Math.min(0.12, chunk.denseSimilarity * 0.15)
          : 0;
      const crossEncoderBonus =
        typeof chunk.trainedCrossEncoderPrior === 'number' && chunk.trainedCrossEncoderPrior > 0
          ? Math.min(0.08, chunk.trainedCrossEncoderPrior * 0.08)
          : 0;

      const rawConfidence =
        retrieverComponent +
        tokenCoverage +
        bigramBonus +
        articleExactBonus +
        contextBonus +
        denseBonus +
        crossEncoderBonus;
      const evaluatorConfidence = Number(Math.min(0.99, Math.max(0.15, rawConfidence)).toFixed(4));

      return {
        ...chunk,
        evaluatorConfidence,
      };
    });

    evaluated.sort((a, b) => b.evaluatorConfidence - a.evaluatorConfidence);
    const requestedCategories = detectRequestedNormativeCategories(normQuery);
    return selectBalancedByCategory(evaluated, topK, requestedCategories, 'evaluatorConfidence');
  }

  /**
   * 2. EVALUADOR DE FIDELIDAD Y CERO ALUCINACIONES (Groundedness Judge):
   * Audita la respuesta final antes de entregarla al usuario, verificando que los artículos citados
   * pertenezcan al corpus legal y que los valores numéricos coincidan con Decimal.js.
   * @param {Object} params
   */
  verifyAnswerFidelity({
    answerText,
    retrievedChunks = [],
    liveCalculation = null,
    allKnownArticleCodes = new Set(),
  }) {
    if (!answerText) {
      return {
        status: 'EMPTY',
        groundednessScore: 0,
        verifiedArticles: [],
        unverifiedArticles: [],
        mathVerified: false,
      };
    }

    // 1. Extraer todos los artículos citados en la respuesta generada
    const citedMatches = [...answerText.matchAll(/Art(?:[ií]culo|\.)?\s*(\d+(?:\.\d+)?)/gi)];
    const citedNumbers = [...new Set(citedMatches.map((m) => m[1]))];

    const retrievedArticleText = retrievedChunks
      .map((c) => `${c.articleCode || ''} ${c.content}`)
      .join(' ');

    const verifiedArticles = [];
    const unverifiedArticles = [];

    for (const num of citedNumbers) {
      const regex = new RegExp(`\\b${num.replace('.', '\\.')}\\b`);
      const inRetrieved = regex.test(retrievedArticleText);
      const inGlobalCorpus = allKnownArticleCodes.has(num);

      if (inRetrieved || inGlobalCorpus) {
        verifiedArticles.push(`Art. ${num}`);
      } else {
        unverifiedArticles.push(`Art. ${num}`);
      }
    }

    // 2. Verificar consistencia matemática si hubo cálculo con Decimal.js
    let mathVerified = true;
    if (liveCalculation) {
      const candidateTotals = [
        liveCalculation.totalSettlement,
        liveCalculation.totalDebit,
        liveCalculation.netSalary,
        liveCalculation.totalOvertimePay,
        liveCalculation.totalSupp50,
      ].filter((val) => typeof val === 'number');

      if (candidateTotals.length > 0) {
        mathVerified = candidateTotals.some((expectedTotal) => {
          const formattedExpected = expectedTotal.toFixed(2);
          const formattedComma = expectedTotal.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          return (
            answerText.includes(formattedExpected) ||
            answerText.includes(formattedComma) ||
            answerText.includes(String(expectedTotal))
          );
        });
      }
    }

    const totalCited = citedNumbers.length;
    const citationRatio =
      totalCited > 0
        ? verifiedArticles.length / totalCited
        : retrievedChunks.length > 0
          ? 1.0
          : 0.8;

    const groundednessScore = Number(
      (citationRatio * 0.75 + (mathVerified ? 0.25 : 0.1)).toFixed(4)
    );

    // Si el LLM externo omitió el desglose exacto de Decimal.js o citó algo no verificado, anexar nota de auditoría
    let auditedAnswer = answerText;
    if (unverifiedArticles.length > 0) {
      const verifiedList =
        verifiedArticles.length > 0 ? verifiedArticles.join(', ') : 'ninguno directo';
      auditedAnswer += `\n\n---\n#### Nota de Auditoría del Evaluador Legal (Anti-Alucinación)\n- **Artículos verificados en el corpus oficial:** ${verifiedList}\n- **Referencias no halladas en el corpus recuperado:** ${unverifiedArticles.join(', ')}`;
    }
    if (liveCalculation && !mathVerified) {
      auditedAnswer += `\n\n---\n#### Verificación Matemática Oficial del Evaluador (Decimal.js)\n${liveCalculation.formattedSummary}`;
    }

    return {
      status:
        unverifiedArticles.length === 0 && mathVerified
          ? 'VERIFIED_BY_EVALUATOR'
          : 'AUDITED_WITH_CORRECTION',
      groundednessScore,
      verifiedArticles,
      unverifiedArticles,
      mathVerified,
      auditedAnswer,
    };
  }

  normalize(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  buildBigrams(tokens) {
    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      bigrams.push(`${tokens[i]}_${tokens[i + 1]}`);
    }
    return bigrams;
  }
}

export default new LegalEvaluatorService();
