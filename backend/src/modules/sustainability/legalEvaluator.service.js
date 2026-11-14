/**
 * @file legalEvaluator.service.js
 * @description Modelo Evaluador de Relevancia (Cross-Encoder Reranker) y Verificador de Fidelidad Legal
 * (Anti-Hallucination & Groundedness Judge) para asegurar respuestas 100% ceñidas a los 4 PDFs oficiales.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import neuralRetrieverService from './neuralRetriever.service.js';
import {
  NON_LABOR_EXCLUSION_PATTERNS,
  ECUADOR_LEGAL_DOMAIN_SIGNALS,
  SPANISH_STOPWORDS,
  detectRequestedNormativeCategories,
  selectBalancedByCategory,
  resolveMandatoryCoRetrievalArticles,
  ensureMandatoryArticlesInSelection,
} from './legalRetrieval.helper.js';

export { detectRequestedNormativeCategories, selectBalancedByCategory };

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
    const queryTokens = normQuery
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !SPANISH_STOPWORDS.has(t));
    const queryBigrams = this.buildBigrams(queryTokens);
    const mentionedArticles = [...query.matchAll(/art(?:[ií]culo|\.)?\s*(\d+(?:\.\d+)?)/gi)].map(
      (m) => m[1]
    );
    const mandatoryCoArticles = resolveMandatoryCoRetrievalArticles(normQuery);
    const mandatoryNumbers = mandatoryCoArticles.map((spec) => String(spec).split('::').pop());
    const targetArticles = [...new Set([...mentionedArticles, ...mandatoryNumbers])];
    const preferredDomains =
      MODULE_DOMAIN_AFFINITY[String(moduleContext || 'sustainability').toLowerCase()] || [];
    const maxInitialScore = Math.max(...candidateChunks.map((c) => c.relevanceScore || 1), 1);
    const liveCrossEncoderScores = await this.computeLiveCrossEncoderScores(query, candidateChunks);

    const evaluated = candidateChunks.map((chunk, idx) =>
      this.scoreSingleCandidateChunk({
        chunk,
        queryTokens,
        queryBigrams,
        targetArticles,
        preferredDomains,
        maxInitialScore,
        liveCeScore: Array.isArray(liveCrossEncoderScores) ? liveCrossEncoderScores[idx] : null,
      })
    );

    evaluated.sort((a, b) => b.evaluatorConfidence - a.evaluatorConfidence);
    const requestedCategories = detectRequestedNormativeCategories(normQuery);
    if (mandatoryCoArticles.length > 0) {
      return ensureMandatoryArticlesInSelection(evaluated, mandatoryCoArticles, topK);
    }
    return selectBalancedByCategory(evaluated, topK, requestedCategories, 'evaluatorConfidence');
  }

  async computeLiveCrossEncoderScores(query, candidateChunks) {
    try {
      if (neuralRetrieverService.hasCrossEncoderFiles()) {
        const passages = candidateChunks.map(
          (c) => `${c.articleCode || ''} (${c.document?.title || ''}): ${c.content}`
        );
        return await neuralRetrieverService.rerankPairs(query, passages);
      }
    } catch {
      return null;
    }
    return null;
  }

  scoreSingleCandidateChunk({
    chunk,
    queryTokens,
    queryBigrams,
    targetArticles,
    preferredDomains,
    maxInitialScore,
    liveCeScore,
  }) {
    const normContent = this.normalize(`${chunk.articleCode || ''} ${chunk.content}`);
    const contentTokens = normContent.split(/\s+/).filter((t) => t.length >= 3);
    const contentBigrams = new Set(this.buildBigrams(contentTokens));
    const retrieverComponent = Math.min(
      0.38,
      ((chunk.relevanceScore || 0) / maxInitialScore) * 0.38
    );
    const matchedTokens = queryTokens.filter((qt) => normContent.includes(qt)).length;
    const tokenCoverage =
      queryTokens.length > 0 ? Math.min(0.18, (matchedTokens / queryTokens.length) * 0.18) : 0.1;
    const matchedBigrams = queryBigrams.filter((bg) => contentBigrams.has(bg)).length;
    const bigramBonus =
      queryBigrams.length > 0 ? Math.min(0.12, (matchedBigrams / queryBigrams.length) * 0.12) : 0;

    const hasExactArt =
      targetArticles.length > 0 &&
      chunk.articleCode &&
      targetArticles.some((num) =>
        new RegExp(`\\bart(?:[ií]culo|\\.)?\\s*${num.replace('.', '\\.')}\\b`, 'i').test(
          chunk.articleCode.trim()
        )
      );
    const articleExactBonus = hasExactArt ? 0.22 : 0;
    const chunkDomain = chunk.metadata?.domain || chunk.document?.category || '';
    const contextBonus = preferredDomains.includes(chunkDomain) ? 0.08 : 0.02;
    const denseBonus =
      typeof chunk.denseSimilarity === 'number' && chunk.denseSimilarity > 0
        ? Math.min(0.14, chunk.denseSimilarity * 0.16)
        : 0;
    const crossEncoderBonus =
      typeof liveCeScore === 'number'
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
      matchedQueryTokens: matchedTokens,
      liveCrossEncoderScore: typeof liveCeScore === 'number' ? liveCeScore : null,
      evaluatorConfidence: Number(Math.min(0.99, Math.max(0.15, rawConfidence)).toFixed(4)),
    };
  }

  assessRetrievalSufficiency({ query, evaluatedChunks = [] }) {
    if (!evaluatedChunks || evaluatedChunks.length === 0) {
      return {
        isOutOfScope: true,
        reason: 'NO_CHUNKS_RETRIEVED',
        maxTokenCoverage: 0,
        maxDenseSimilarity: 0,
      };
    }
    const normQuery = this.normalize(query);
    if (NON_LABOR_EXCLUSION_PATTERNS.test(normQuery)) {
      return {
        isOutOfScope: true,
        reason: 'NON_LABOR_EXCLUSION',
        maxTokenCoverage: 0,
        maxDenseSimilarity: 0,
      };
    }
    const hasLegalDomainSignal =
      ECUADOR_LEGAL_DOMAIN_SIGNALS.test(normQuery) || /\bart(?:iculo|\.)?\s*\d+/i.test(query || '');
    const maxDenseSimilarity = Math.max(
      ...evaluatedChunks.map((c) => Number(c.denseSimilarity || 0)),
      0
    );
    const maxRelevanceScore = Math.max(
      ...evaluatedChunks.map((c) => Number(c.relevanceScore || 0)),
      0
    );
    const maxMatchedTokens = Math.max(
      ...evaluatedChunks.map((c) => Number(c.matchedQueryTokens || 0)),
      0
    );

    if (!hasLegalDomainSignal && (maxMatchedTokens <= 2 || maxRelevanceScore < 75)) {
      return {
        isOutOfScope: true,
        reason: 'OUT_OF_CORPUS_DOMAIN',
        maxTokenCoverage: maxMatchedTokens,
        maxDenseSimilarity,
      };
    }
    return {
      isOutOfScope: false,
      reason: 'SUFFICIENT_CONTEXT',
      topConfidence: evaluatedChunks[0]?.evaluatorConfidence || 0,
      maxTokenCoverage: maxMatchedTokens,
      maxDenseSimilarity,
    };
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
        citationAccuracy: 0,
        temporalValidity: 1,
        verifiedArticles: [],
        corpusSupportedArticles: [],
        unverifiedArticles: [],
        repealedCitationsWarning: [],
        mathVerified: false,
      };
    }

    const {
      citedNumbers,
      verifiedArticles,
      corpusSupportedArticles,
      unverifiedArticles,
      repealedCitationsWarning,
    } = this.classifyCitedArticles({ answerText, retrievedChunks, allKnownArticleCodes });
    const mathVerified = this.verifyMathematicalConsistency(answerText, liveCalculation);

    const totalCited = citedNumbers.length;
    const citationAccuracy =
      totalCited > 0
        ? Number((verifiedArticles.length / totalCited).toFixed(4))
        : retrievedChunks.length > 0
          ? 1.0
          : 0.85;
    const citationRatio =
      totalCited > 0
        ? Math.min(
            1.0,
            (verifiedArticles.length + corpusSupportedArticles.length * 0.45) / totalCited
          )
        : retrievedChunks.length > 0
          ? 0.95
          : 0.8;
    const temporalValidity = repealedCitationsWarning.length === 0 ? 1.0 : 0.5;
    const avgChunkConfidence =
      retrievedChunks.length > 0
        ? retrievedChunks.reduce((acc, c) => acc + (c.evaluatorConfidence || 0.85), 0) /
          retrievedChunks.length
        : 0.8;
    const rawGroundedness =
      citationRatio * 0.55 +
      (mathVerified ? 0.2 : 0.05) +
      temporalValidity * 0.15 +
      avgChunkConfidence * 0.1;
    const groundednessScore = Number(Math.min(0.99, Math.max(0.1, rawGroundedness)).toFixed(4));

    const auditedAnswer = this.appendAuditNotes({
      answerText,
      verifiedArticles,
      corpusSupportedArticles,
      unverifiedArticles,
      repealedCitationsWarning,
      liveCalculation,
      mathVerified,
    });
    const isClean =
      unverifiedArticles.length === 0 &&
      corpusSupportedArticles.length === 0 &&
      repealedCitationsWarning.length === 0 &&
      mathVerified;

    return {
      status: isClean ? 'VERIFIED_BY_EVALUATOR' : 'AUDITED_WITH_CORRECTION',
      groundednessScore,
      citationAccuracy,
      temporalValidity,
      verifiedArticles,
      corpusSupportedArticles,
      unverifiedArticles,
      repealedCitationsWarning,
      mathVerified,
      auditedAnswer,
    };
  }

  classifyCitedArticles({ answerText, retrievedChunks, allKnownArticleCodes }) {
    const citedNumbers = [
      ...new Set(
        [...answerText.matchAll(/Art(?:[ií]culo|\.)?\s*(\d+(?:\.\d+)?)/gi)].map((m) => m[1])
      ),
    ];
    const retrievedHeaderCodes = retrievedChunks.map((c) => String(c.articleCode || '')).join(' ');
    const retrievedFullText = retrievedChunks
      .map((c) => `${c.articleCode || ''} ${c.content}`)
      .join(' ');
    const knownSet =
      allKnownArticleCodes instanceof Set
        ? allKnownArticleCodes
        : new Set(allKnownArticleCodes || []);
    const answerMentionsRepealed =
      /\b(derogad[oa]s?|no\s+se\s+encuentra\s+vigente|inaplicable|suprimid[oa])\b/i.test(
        answerText
      );

    const verifiedArticles = [];
    const corpusSupportedArticles = [];
    const unverifiedArticles = [];
    const repealedCitationsWarning = [];

    for (const num of citedNumbers) {
      const escapedNum = num.replace('.', '\\.');
      const baseNum = num.includes('.') ? num.split('.')[0] : null;
      const headerRegex = new RegExp(`\\bArt(?:[ií]culo|\\.)?\\s*${escapedNum}\\b`, 'i');
      const baseHeaderRegex = baseNum
        ? new RegExp(`\\bArt(?:[ií]culo|\\.)?\\s*${baseNum}\\b`, 'i')
        : null;
      const matchingChunk = retrievedChunks.find((c) => headerRegex.test(c.articleCode || ''));

      if (matchingChunk?.metadata?.isRepealed && !answerMentionsRepealed) {
        repealedCitationsWarning.push(`Art. ${num}`);
      }
      if (
        headerRegex.test(retrievedHeaderCodes) ||
        (baseHeaderRegex && baseHeaderRegex.test(retrievedHeaderCodes)) ||
        new RegExp(`\\b${escapedNum}\\b`).test(retrievedFullText)
      ) {
        verifiedArticles.push(`Art. ${num}`);
      } else if (
        knownSet.has(num) ||
        knownSet.has(`Art. ${num}`) ||
        knownSet.has(String(parseInt(num, 10)))
      ) {
        corpusSupportedArticles.push(`Art. ${num}`);
      } else {
        unverifiedArticles.push(`Art. ${num}`);
      }
    }
    return {
      citedNumbers,
      verifiedArticles,
      corpusSupportedArticles,
      unverifiedArticles,
      repealedCitationsWarning,
    };
  }

  verifyMathematicalConsistency(answerText, liveCalculation) {
    if (!liveCalculation) return true;
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
    if (candidateTotals.length === 0) return true;

    return candidateTotals.some((val) => {
      const fixed = val.toFixed(2);
      const comma = val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const es = val.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const esDot = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(/\.(\d{2})$/, ',$1');
      return (
        answerText.includes(fixed) ||
        answerText.includes(comma) ||
        answerText.includes(es) ||
        answerText.includes(esDot) ||
        answerText.includes(String(val)) ||
        (val >= 100 && answerText.includes(String(Math.round(val))))
      );
    });
  }

  appendAuditNotes({
    answerText,
    verifiedArticles,
    corpusSupportedArticles,
    unverifiedArticles,
    repealedCitationsWarning,
    liveCalculation,
    mathVerified,
  }) {
    let auditedAnswer = answerText;
    if (
      unverifiedArticles.length > 0 ||
      corpusSupportedArticles.length > 0 ||
      repealedCitationsWarning.length > 0
    ) {
      const verifiedList =
        verifiedArticles.length > 0 ? verifiedArticles.join(', ') : 'ninguno directo';
      const notes = [
        `*Nota de Auditoría del Evaluador Legal (Anti-Alucinación):*`,
        `- *Artículos verificados con texto íntegro en el contexto recuperado:* ${verifiedList}`,
      ];
      if (corpusSupportedArticles.length > 0) {
        notes.push(
          `- *Artículos existentes en el corpus pero ausentes en los fragmentos primarios de esta consulta:* ${corpusSupportedArticles.join(', ')}`
        );
      }
      if (unverifiedArticles.length > 0) {
        notes.push(
          `- *Referencias no halladas en el corpus recuperado:* ${unverifiedArticles.join(', ')}`
        );
      }
      if (repealedCitationsWarning.length > 0) {
        notes.push(
          `- *Alerta de Vigencia Temporal:* ${repealedCitationsWarning.join(', ')} registra nota de derogación en el corpus oficial; verifique la normativa sustitutiva vigente.`
        );
      }
      auditedAnswer += `\n\n---\n${notes.join('\n')}`;
    }
    if (liveCalculation && !mathVerified) {
      auditedAnswer += `\n\n---\n*Verificación Matemática Oficial del Evaluador (Decimal.js):*\n${liveCalculation.formattedSummary}`;
    }
    return auditedAnswer;
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
    for (let i = 0; i < tokens.length - 1; i++) bigrams.push(`${tokens[i]}_${tokens[i + 1]}`);
    return bigrams;
  }
}

export default new LegalEvaluatorService();
