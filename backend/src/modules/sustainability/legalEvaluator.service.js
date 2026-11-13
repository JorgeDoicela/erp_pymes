/**
 * @file legalEvaluator.service.js
 * @description Modelo Evaluador de Relevancia (Cross-Encoder Reranker) y Verificador de Fidelidad Legal
 * (Anti-Hallucination & Groundedness Judge) para asegurar respuestas 100% ceñidas a los 4 PDFs oficiales.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import neuralRetrieverService from './neuralRetriever.service.js';

const NORMATIVE_SOURCE_PATTERNS = [
  { category: 'CONSTITUTION', pattern: /\b(constitucion|constitucional|carta magna)\b/ },
  {
    category: 'LABOR_CODE',
    pattern:
      /\b(codigo del? trabajo|codigo laboral|fondos? de reserva|desahucio|despido|vacaciones|utilidades|decimo)\b/,
  },
  { category: 'IESS_REGULATION', pattern: /\b(iess|seguridad social|afiliacion)\b/ },
  { category: 'ODS_8_FRAMEWORK', pattern: /\b(oit|ods\s*8|trabajo decente|8\.[1-9])\b/ },
];

export function detectRequestedNormativeCategories(normQuery) {
  const query = String(normQuery || '');
  return NORMATIVE_SOURCE_PATTERNS.filter(({ pattern }) => pattern.test(query)).map(
    ({ category }) => category
  );
}

export function selectBalancedByCategory(items, limit, requestedCategories, _scoreField) {
  if (!Array.isArray(requestedCategories) || requestedCategories.length <= 1) {
    return items.slice(0, limit);
  }

  const selected = [];
  const seenIds = new Set();
  const minPerCategory = Math.max(1, Math.floor(limit / requestedCategories.length));

  // 1. Selección representativa garantizada de cada categoría solicitada
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

  // 2. Rellenar los cupos restantes hasta el límite con los fragmentos de mayor puntaje
  for (const item of items) {
    if (selected.length >= limit) break;
    if (!seenIds.has(item.id)) {
      selected.push(item);
      seenIds.add(item.id);
    }
  }

  return selected.slice(0, limit);
}

const MODULE_DOMAIN_AFFINITY = {
  payroll: ['PAYROLL', 'IESS', 'TAX_SRI', 'LABOR_CODE', 'IESS_REGULATION'],
  contracts: ['CONTRACTS', 'CONSTITUTION', 'LABOR_CODE'],
  offboarding: ['OFFBOARDING', 'LABOR_CODE', 'SIGNATURES'],
  attendance: ['ATTENDANCE', 'BIOMETRICS', 'GOVERNANCE', 'LABOR_CODE'],
  accounting: ['ACCOUNTING', 'TAX_SRI', 'IESS', 'INTERNAL_POLICY'],
  employees: ['CONTRACTS', 'GOVERNANCE', 'CONSTITUTION', 'LABOR_CODE', 'IESS_REGULATION'],
  performance: ['PERFORMANCE', 'ODS_8', 'ODS_8_FRAMEWORK'],
  recruitment: ['PERFORMANCE', 'CONSTITUTION', 'LABOR_CODE'],
  signatures: ['SIGNATURES', 'GOVERNANCE'],
  compliance: ['GOVERNANCE', 'CONSTITUTION', 'LABOR_CODE', 'IESS_REGULATION', 'INTERNAL_POLICY'],
  analytics: ['ODS_8', 'ODS_8_FRAMEWORK', 'PAYROLL', 'PERFORMANCE'],
  entrepreneurship: ['ODS_8', 'ODS_8_FRAMEWORK', 'TAX_SRI', 'CONTRACTS'],
  sustainability: ['ODS_8', 'ODS_8_FRAMEWORK', 'LABOR_CODE', 'IESS_REGULATION', 'CONSTITUTION'],
  whatsapp: ['LABOR_CODE', 'IESS_REGULATION', 'OFFBOARDING', 'ATTENDANCE', 'PAYROLL', 'CONTRACTS'],
};

export class LegalEvaluatorService {
  async evaluateAndRerankChunks({
    query,
    candidateChunks = [],
    moduleContext = 'sustainability',
    topK = 6,
  }) {
    if (!candidateChunks || candidateChunks.length === 0) return [];

    const normQuery = this.normalize(query);
    const queryTokens = normQuery.split(/\s+/).filter((t) => t.length >= 3);
    const queryBigrams = this.buildBigrams(queryTokens);
    const mentionedArticles = [...query.matchAll(/art(?:[ií]culo|\.)?\s*(\d+(?:\.\d+)?)/gi)].map(
      (m) => m[1]
    );
    const preferredDomains =
      MODULE_DOMAIN_AFFINITY[String(moduleContext || 'sustainability').toLowerCase()] || [];
    const maxInitialScore = Math.max(...candidateChunks.map((c) => c.relevanceScore || 1), 1);

    let liveCrossEncoderScores = null;
    try {
      if (neuralRetrieverService.hasCrossEncoderFiles()) {
        const candidatePassages = candidateChunks.map(
          (c) => `${c.articleCode || ''} (${c.document?.title || ''}): ${c.content}`
        );
        liveCrossEncoderScores = await neuralRetrieverService.rerankPairs(query, candidatePassages);
      }
    } catch {
      liveCrossEncoderScores = null;
    }

    const evaluated = candidateChunks.map((chunk, idx) => {
      const normContent = this.normalize(`${chunk.articleCode || ''} ${chunk.content}`);
      const contentTokens = normContent.split(/\s+/).filter((t) => t.length >= 3);
      const contentBigrams = new Set(this.buildBigrams(contentTokens));
      const liveCeScore =
        Array.isArray(liveCrossEncoderScores) && typeof liveCrossEncoderScores[idx] === 'number'
          ? liveCrossEncoderScores[idx]
          : null;

      const retrieverComponent = Math.min(
        0.38,
        ((chunk.relevanceScore || 0) / maxInitialScore) * 0.38
      );

      let matchedTokens = 0;
      for (const qt of queryTokens) {
        if (normContent.includes(qt)) matchedTokens++;
      }
      const tokenCoverage =
        queryTokens.length > 0 ? Math.min(0.18, (matchedTokens / queryTokens.length) * 0.18) : 0.1;

      let matchedBigrams = 0;
      for (const bg of queryBigrams) {
        if (contentBigrams.has(bg)) matchedBigrams++;
      }
      const bigramBonus =
        queryBigrams.length > 0 ? Math.min(0.12, (matchedBigrams / queryBigrams.length) * 0.12) : 0;

      let articleExactBonus = 0;
      if (mentionedArticles.length > 0 && chunk.articleCode) {
        const hasExactArt = mentionedArticles.some((num) =>
          new RegExp(`\\b${num.replace('.', '\\.')}\\b`).test(chunk.articleCode)
        );
        if (hasExactArt) articleExactBonus = 0.22;
      }

      const chunkDomain = chunk.metadata?.domain || chunk.document?.category || '';
      const contextBonus = preferredDomains.includes(chunkDomain) ? 0.08 : 0.02;
      const denseBonus =
        typeof chunk.denseSimilarity === 'number' && chunk.denseSimilarity > 0
          ? Math.min(0.14, chunk.denseSimilarity * 0.16)
          : 0;
      const crossEncoderBonus =
        liveCeScore !== null
          ? liveCeScore * 0.32
          : typeof chunk.trainedCrossEncoderPrior === 'number' && chunk.trainedCrossEncoderPrior > 0
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

      return {
        ...chunk,
        liveCrossEncoderScore: liveCeScore,
        evaluatorConfidence: Number(Math.min(0.99, Math.max(0.15, rawConfidence)).toFixed(4)),
      };
    });

    evaluated.sort((a, b) => b.evaluatorConfidence - a.evaluatorConfidence);
    const requestedCategories = detectRequestedNormativeCategories(normQuery);
    return selectBalancedByCategory(evaluated, topK, requestedCategories, 'evaluatorConfidence');
  }

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
        corpusSupportedArticles: [],
        unverifiedArticles: [],
        mathVerified: false,
      };
    }

    const citedMatches = [...answerText.matchAll(/Art(?:[ií]culo|\.)?\s*(\d+(?:\.\d+)?)/gi)];
    const citedNumbers = [...new Set(citedMatches.map((m) => m[1]))];
    const retrievedArticleText = retrievedChunks
      .map((c) => `${c.articleCode || ''} ${c.content}`)
      .join(' ');

    const verifiedArticles = [];
    const corpusSupportedArticles = [];
    const unverifiedArticles = [];

    const knownSet =
      allKnownArticleCodes instanceof Set
        ? allKnownArticleCodes
        : new Set(allKnownArticleCodes || []);

    for (const num of citedNumbers) {
      const regex = new RegExp(`\\b${num.replace('.', '\\.')}\\b`);
      if (regex.test(retrievedArticleText)) {
        verifiedArticles.push(`Art. ${num}`);
      } else if (
        knownSet.has(num) ||
        knownSet.has(`Art. ${num}`) ||
        knownSet.has(`Art ${num}`) ||
        knownSet.has(parseInt(num, 10)) ||
        knownSet.has(String(parseInt(num, 10)))
      ) {
        corpusSupportedArticles.push(`Art. ${num}`);
      } else {
        unverifiedArticles.push(`Art. ${num}`);
      }
    }

    let mathVerified = true;
    if (liveCalculation) {
      const candidateTotals = [
        liveCalculation.totalSettlement,
        liveCalculation.desahucioAmount,
        liveCalculation.severanceAmount,
        liveCalculation.totalDebit,
        liveCalculation.netSalary,
        liveCalculation.reserveFund,
        liveCalculation.iessPersonal,
        liveCalculation.iessPatronal,
        liveCalculation.totalOvertimePay,
        liveCalculation.totalSupp50,
        liveCalculation.totalExtra100,
      ].filter((val) => typeof val === 'number' && val > 0);

      if (candidateTotals.length > 0) {
        mathVerified = candidateTotals.some((expectedTotal) => {
          const formattedExpected = expectedTotal.toFixed(2);
          const formattedComma = expectedTotal.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const formattedEs = expectedTotal.toLocaleString('es-EC', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const formattedEsDot = expectedTotal
            .toFixed(2)
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
            .replace(/\.(\d{2})$/, ',$1');
          const rawInt = String(Math.round(expectedTotal));

          return (
            answerText.includes(formattedExpected) ||
            answerText.includes(formattedComma) ||
            answerText.includes(formattedEs) ||
            answerText.includes(formattedEsDot) ||
            answerText.includes(String(expectedTotal)) ||
            (expectedTotal >= 100 && answerText.includes(rawInt))
          );
        });
      }
    }

    const totalCited = citedNumbers.length;
    let citationRatio;
    if (totalCited > 0) {
      const effectiveVerified = verifiedArticles.length + corpusSupportedArticles.length * 0.9;
      citationRatio = Math.min(1.0, effectiveVerified / totalCited);
    } else {
      citationRatio = retrievedChunks.length > 0 ? 1.0 : 0.8;
    }

    const groundednessScore = Number(
      (citationRatio * 0.75 + (mathVerified ? 0.25 : 0.1)).toFixed(4)
    );

    let auditedAnswer = answerText;
    if (unverifiedArticles.length > 0) {
      const verifiedList =
        verifiedArticles.length > 0 ? verifiedArticles.join(', ') : 'ninguno directo';
      auditedAnswer += `\n\n---\n*Nota de Auditoría del Evaluador Legal (Anti-Alucinación):*\n- *Artículos verificados en el corpus oficial:* ${verifiedList}\n- *Referencias no halladas en el corpus recuperado:* ${unverifiedArticles.join(', ')}`;
    }
    if (liveCalculation && !mathVerified) {
      auditedAnswer += `\n\n---\n*Verificación Matemática Oficial del Evaluador (Decimal.js):*\n${liveCalculation.formattedSummary}`;
    }

    return {
      status:
        unverifiedArticles.length === 0 && mathVerified
          ? 'VERIFIED_BY_EVALUATOR'
          : 'AUDITED_WITH_CORRECTION',
      groundednessScore,
      verifiedArticles,
      corpusSupportedArticles,
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
