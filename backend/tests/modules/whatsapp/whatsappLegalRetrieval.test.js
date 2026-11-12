/**
 * @file whatsappLegalRetrieval.test.js
 * @description Pruebas de integración para la recuperación léxica-semántica y fidelidad jurídica en WhatsApp.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect } from 'vitest';
import sustainabilityRepository from '../../../src/modules/sustainability/sustainability.repository.js';
import legalEvaluatorService from '../../../src/modules/sustainability/legalEvaluator.service.js';
import sustainabilityRagService from '../../../src/modules/sustainability/sustainabilityRag.service.js';

describe('WhatsApp Legal Retrieval & Grounding Quality Suite', () => {
  describe('1. Lematización y Filtrado de Stopwords en Consultas Coloquiales', () => {
    it('debe recuperar Art. 188 (Despido Intempestivo) ante "me despidieron que me corresponde"', async () => {
      const results = await sustainabilityRepository.searchKnowledgeChunks({
        query: 'me despidieron que me corresponde',
        limit: 5,
      });

      expect(results.length).toBeGreaterThan(0);
      const articleCodes = results.map((r) => r.articleCode);
      const hasDismissalArticle = articleCodes.some(
        (code) => code.includes('188') || code.includes('195')
      );
      expect(hasDismissalArticle).toBe(true);

      // No debe tener como primer resultado la Corte Constitucional
      expect(results[0].articleCode).not.toContain('443');
    });

    it('debe recuperar Art. 169 y Art. 185 (Desahucio) ante "si renuncio que me toca"', async () => {
      const results = await sustainabilityRepository.searchKnowledgeChunks({
        query: 'si renuncio que me toca',
        limit: 5,
      });

      expect(results.length).toBeGreaterThan(0);
      const articleCodes = results.map((r) => r.articleCode);
      const hasResignationArticle = articleCodes.some(
        (code) => code.includes('169') || code.includes('185')
      );
      expect(hasResignationArticle).toBe(true);
    });

    it('debe priorizar Código del Trabajo Art. 188 sobre Constitución Art. 188 cuando no se especifica Constitución', async () => {
      const results = await sustainabilityRepository.searchKnowledgeChunks({
        query: 'que dice el articulo 188',
        limit: 3,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].articleCode).toContain('188');
      expect(results[0].document?.category).toBe('LABOR_CODE');
    });

    it('debe recuperar Art. 55 para cálculo de horas extras', async () => {
      const results = await sustainabilityRepository.searchKnowledgeChunks({
        query: 'como se calculan las horas extras',
        limit: 3,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].articleCode).toContain('55');
    });
  });

  describe('2. Evaluación y Afinidad de Dominio en WhatsApp', () => {
    it('debe aplicar afinidad preferente al Código del Trabajo para el contexto whatsapp', async () => {
      const candidates = await sustainabilityRepository.searchKnowledgeChunks({
        query: 'horas extraordinarias y suplementarias Art. 55',
        limit: 6,
      });

      const reranked = await legalEvaluatorService.evaluateAndRerankChunks({
        query: 'horas extraordinarias y suplementarias Art. 55',
        candidateChunks: candidates,
        moduleContext: 'whatsapp',
        topK: 3,
      });

      expect(reranked.length).toBeGreaterThan(0);
      expect(reranked[0].articleCode).toContain('55');
      expect(reranked[0].evaluatorConfidence).toBeGreaterThan(0.6);
    });

    it('debe detectar como no verificado un artículo que el LLM invente si no está en los fragmentos recuperados', () => {
      const retrievedChunks = [
        {
          articleCode: 'Código del Trabajo Art. 188',
          content: 'Indemnización por despido intempestivo...',
        },
      ];

      const audit = legalEvaluatorService.verifyAnswerFidelity({
        answerText: 'Según el Art. 188 y el Art. 42 del Código, se debe pagar indemnización.',
        retrievedChunks,
      });

      expect(audit.verifiedArticles).toContain('Art. 188');
      expect(audit.unverifiedArticles).toContain('Art. 42');
      expect(audit.status).toBe('AUDITED_WITH_CORRECTION');
    });
  });

  describe('3. RAG Grounding Prompt en WhatsApp', () => {
    it('debe generar prompt sin ruido de telemetría contable para el contexto whatsapp', () => {
      const prompt = sustainabilityRagService.buildStrictGroundedSystemPrompt({
        evaluatedChunks: [
          {
            articleCode: 'Art. 188',
            content: 'El despido intempestivo se indemniza...',
            evaluatorConfidence: 0.95,
            document: { title: 'Código del Trabajo' },
          },
        ],
        tenantMetrics: {
          erpContext: { openAccountingPeriods: 5, totalJournalEntries: 100 },
          ods: { overallScore: 90, complianceLevel: 'ALTO' },
        },
        liveCalculation: null,
        moduleContext: 'whatsapp',
      });

      expect(prompt).toContain('WhatsApp Corporativo');
      expect(prompt).not.toContain('Períodos Contables Abiertos');
      expect(prompt).not.toContain('Asientos Contables NIIF');
      expect(prompt).toContain('Art. 188');
    });
  });
});
