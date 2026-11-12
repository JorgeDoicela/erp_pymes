/**
 * @file sustainabilityModule.test.js
 * @description Pruebas unitarias e integración para el módulo de Sostenibilidad ODS 8,
 * Motor RAG Híbrido Multi-Dominio, Desencriptación AES-256-GCM y Pipeline de Fine-Tuning Qwen 2.5.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encryptSalary } from '../../../src/core/security/encryption.js';
import sustainabilityService, {
  SBU_ECUADOR_2026,
} from '../../../src/modules/sustainability/sustainability.service.js';
import sustainabilityRagService from '../../../src/modules/sustainability/sustainabilityRag.service.js';
import sustainabilityFineTuningService from '../../../src/modules/sustainability/sustainabilityFineTuning.service.js';
import sustainabilityRepository from '../../../src/modules/sustainability/sustainability.repository.js';
import legalEvaluatorService from '../../../src/modules/sustainability/legalEvaluator.service.js';
import llmProviderService from '../../../src/modules/sustainability/llmProvider.service.js';

describe('Módulo de Sostenibilidad ODS 8, RAG Multi-Dominio y Fine-Tuning', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Desencriptación de Salarios AES-256-GCM y Cálculo de KPIs ODS 8', () => {
    it('debe desencriptar correctamente salarios cifrados con AES-256-GCM para auditar el SBU ($460.00)', () => {
      const encryptedValid = encryptSalary(850.5);
      const encryptedSubSbu = encryptSalary(380.0);

      const resolvedValid = sustainabilityService.resolveEmployeeNumericSalary({
        salary: encryptedValid,
      });
      const resolvedSubSbu = sustainabilityService.resolveEmployeeNumericSalary({
        salary: encryptedSubSbu,
      });

      expect(resolvedValid).toBe(850.5);
      expect(resolvedSubSbu).toBe(380.0);
      expect(resolvedSubSbu).toBeLessThan(SBU_ECUADOR_2026);
    });

    it('debe calcular con precisión Decimal.js los 5 indicadores ODS 8 y detectar sueldos bajo el SBU', async () => {
      vi.spyOn(sustainabilityRepository, 'getOds8AggregatedData').mockResolvedValue({
        totalEmployees: 10,
        employeesWithActiveContract: 9,
        allActiveEmployees: [
          ...Array.from({ length: 9 }, (_, i) => ({
            id: `emp_${i}`,
            salary: encryptSalary(650),
            trackingConsent: true,
            contracts: [{ id: `c_${i}`, salary: 650, type: 'Indefinido' }],
          })),
          {
            id: 'emp_sub_sbu',
            salary: encryptSalary(400), // Inferior a $460 SBU
            trackingConsent: false,
            contracts: [],
          },
        ],
        recentPayrolls: [
          {
            id: 'pay_1',
            details: [
              {
                id: 'det_1',
                baseSalary: 650,
                overtimeHours: 4,
                overtimeAmount: 20.31,
                deductions: JSON.stringify([{ name: 'Aporte Personal IESS 9.45%', amount: 61.43 }]),
                netSalary: 608.88,
                signatureStatus: 'SIGNED',
              },
            ],
          },
        ],
        recentAttendances: [
          { id: 'att_1', employeeId: 'emp_1', overtimeHours: 4, status: 'PRESENT' },
        ],
        recentOffboardings: [
          {
            id: 'off_1',
            status: 'COMPLETED',
            severanceAmount: 1950,
            desahucioAmount: 487.5,
            totalSettlement: 2650.0,
          },
        ],
        erpSummary: {
          openAccountingPeriods: 1,
          totalJournalEntries: 24,
          openJobVacancies: 2,
          totalPerformanceEvaluations: 15,
          activeEntrepreneurships: 3,
        },
      });

      const result = await sustainabilityService.calculateOds8Metrics('tenant_ecuador_01');

      expect(result.ods.indicators.formalContractRate.value).toBe(90.0);
      expect(result.ods.indicators.socialSecurityCoverage.value).toBe(100.0);
      expect(result.ods.indicators.salaryEquitabilityIndex.value).toBe(90.0);
      expect(result.ods.indicators.salaryEquitabilityIndex.status).toBe('NEEDS_ATTENTION');
      expect(result.ods.indicators.overtimeCompensationRatio.value).toBe(1.0);
      expect(result.ods.indicators.verifiedLegalSettlements.value).toBe(100.0);
      // Ponderación: 90*0.25 (22.5) + 100*0.25 (25) + 90*0.20 (18) + 100*0.15 (15) + 100*0.15 (15) = 95.5
      expect(result.ods.overallScore).toBe(95.5);
      expect(result.erpContext.subSbuEmployeesCount).toBe(1);
      expect(result.erpContext.totalJournalEntries).toBe(24);
    });
  });

  describe('2. Motor de Recuperación Semántica BM25/TF-IDF Multi-Dominio', () => {
    it('debe recuperar con alta precisión artículos de despido intempestivo (Art. 188) y desahucio (Art. 185)', async () => {
      const chunks = await sustainabilityRepository.searchKnowledgeChunks({
        query:
          '¿Cómo se calcula la indemnización por despido intempestivo del Art. 188 y desahucio?',
        limit: 4,
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].articleCode).toContain('188');
      expect(chunks[0].relevanceScore).toBeGreaterThan(10);
    });

    it('debe recuperar artículos de la Constitución de la República del Ecuador y de la Ley de Seguridad Social (IESS)', async () => {
      const constChunks = await sustainabilityRepository.searchKnowledgeChunks({
        query: 'derecho al trabajo irrenunciabilidad Art. 326 Constitución del Ecuador',
        limit: 4,
      });

      expect(constChunks.length).toBeGreaterThan(0);
      expect(
        constChunks.some(
          (c) => c.articleCode?.includes('326') || c.document?.title?.includes('Constitución')
        )
      ).toBe(true);

      const iessChunks = await sustainabilityRepository.searchKnowledgeChunks({
        query: 'mora patronal responsabilidad patronal Ley de Seguridad Social IESS Art. 73',
        limit: 4,
      });
      expect(iessChunks.length).toBeGreaterThan(0);
      expect(
        iessChunks.some(
          (c) => c.articleCode?.includes('73') || c.document?.category === 'IESS_REGULATION'
        )
      ).toBe(true);
    });

    it('debe recuperar secciones del Manual Metodológico OIT sobre Indicadores de Trabajo Decente (ODS 8)', async () => {
      const oitChunks = await sustainabilityRepository.searchKnowledgeChunks({
        query: 'indicadores de trabajo decente OIT empleo y remuneración ODS 8',
        limit: 4,
      });
      expect(oitChunks.length).toBeGreaterThan(0);
      expect(
        oitChunks.some(
          (c) => c.document?.category === 'ODS_8_FRAMEWORK' || c.articleCode?.includes('OIT')
        )
      ).toBe(true);
    });
  });

  describe('3. Motor RAG y Calculadora Jurídico-Contable en Tiempo Real (Decimal.js)', () => {
    it('debe calcular con exactitud una liquidación por despido intempestivo con sueldo de $850 y 4 años y 2 meses', () => {
      const calc = sustainabilityRagService.computeLiveLegalCalculation(
        '¿Cuánto corresponde pagar por despido intempestivo a un empleado con sueldo de $850 y 4 años y 2 meses de servicio?'
      );

      expect(calc).not.toBeNull();
      expect(calc.type).toBe('SETTLEMENT_CALCULATION');
      expect(calc.baseSalary).toBe(850);
      // Desahucio Art. 185: 4 años completos * 25% * 850 = $850.00
      expect(calc.desahucioAmount).toBe(850);
      // Despido Art. 188: 4 años y 2 meses -> fracción cuenta como 5 años = 5 * 850 = $4250.00
      expect(calc.severanceAmount).toBe(4250);
    });

    it('debe calcular el rol de pagos y cuadrar el asiento contable NIIF por partida doble', () => {
      const calc = sustainabilityRagService.computeLiveLegalCalculation(
        'Genera el asiento contable de rol de pagos e IESS para un sueldo de $1200 USD'
      );

      expect(calc).not.toBeNull();
      expect(calc.type).toBe('PAYROLL_ACCOUNTING_CALCULATION');
      expect(calc.iessPersonal).toBe(113.4); // 1200 * 9.45%
      expect(calc.iessPatronal).toBe(133.8); // 1200 * 11.15%
      expect(calc.netSalary).toBe(1086.6); // 1200 - 113.40
      expect(calc.totalDebit).toBe(1333.8); // 1200 + 133.80
    });
  });

  describe('4. Generador de Dataset Multi-Dominio para Fine-Tuning (Qwen 2.5 / ChatML)', () => {
    it('debe generar más de 180 muestras cubriendo todos los dominios del ERP con formato ChatML válido', async () => {
      const dataset = await sustainabilityFineTuningService.generateDataset({
        targetModel: 'qwen2.5',
      });

      expect(dataset.totalSamples).toBeGreaterThanOrEqual(180);
      expect(dataset.domainsCovered.length).toBe(9);

      const sample = dataset.samples[0];
      expect(sample.instruction).toBeDefined();
      expect(sample.output).toBeDefined();
      expect(Array.isArray(sample.messages)).toBe(true);
      expect(sample.messages.length).toBe(3);
      expect(sample.text).toContain('<|im_start|>system');
      expect(sample.text).toContain('<|im_start|>user');
      expect(sample.text).toContain('<|im_start|>assistant');
    });
  });

  describe('5. Corpus Completo de los 4 PDFs (1,895 Artículos), Modelo Evaluador y Adaptador DeepSeek/Local', () => {
    it('debe tener indexados los 1,880+ artículos extraídos de los 4 PDFs oficiales sin omitir ninguno y activo el índice híbrido denso', () => {
      const stats = sustainabilityRepository.getCorpusStatistics();
      expect(stats.totalIndexedChunks).toBeGreaterThanOrEqual(1880);
      expect(stats.totalKnownArticles).toBeGreaterThan(400);
      expect(stats.hasTrainedEmbeddings).toBe(true);
      expect(stats.trainedArticlesCount).toBeGreaterThanOrEqual(1850);
      expect(stats.trainedQueryVocabSize).toBeGreaterThanOrEqual(500);
    });

    it('debe re-ordenar fragmentos con el Modelo Evaluador (Cross-Encoder) y auditar alucinaciones', async () => {
      const candidates = await sustainabilityRepository.searchKnowledgeChunks({
        query: 'liquidación de despido intempestivo Art. 188 y desahucio Art. 185',
        limit: 10,
      });

      const reranked = legalEvaluatorService.evaluateAndRerankChunks({
        query: 'liquidación de despido intempestivo Art. 188 y desahucio Art. 185',
        candidateChunks: candidates,
        moduleContext: 'offboarding',
        topK: 5,
      });

      expect(reranked.length).toBeGreaterThan(0);
      expect(reranked[0].evaluatorConfidence).toBeGreaterThan(0.5);

      const knownSet = sustainabilityRepository.getKnownArticleNumbers();
      const groundedAudit = legalEvaluatorService.verifyAnswerFidelity({
        answerText:
          'Conforme al Art. 188 y Art. 185 del Código del Trabajo, corresponde indemnización y bonificación.',
        retrievedChunks: reranked,
        liveCalculation: null,
        allKnownArticleCodes: knownSet,
      });

      expect(groundedAudit.status).toBe('VERIFIED_BY_EVALUATOR');
      expect(groundedAudit.groundednessScore).toBeGreaterThanOrEqual(0.8);

      const hallucinatedAudit = legalEvaluatorService.verifyAnswerFidelity({
        answerText:
          'Según el Art. 188 y el inexistente Art. 9999 del Código, se aplica la indemnización.',
        retrievedChunks: reranked,
        liveCalculation: null,
        allKnownArticleCodes: knownSet,
      });
      expect(hallucinatedAudit.unverifiedArticles).toContain('Art. 9999');
      expect(hallucinatedAudit.auditedAnswer).toContain(
        'Nota de Auditoría del Evaluador Legal (Anti-Alucinación)'
      );
    });

    it('debe garantizar aislamiento multi-tenant LOPDP cuando no se proporciona tenantId y soportar exportación del corpus PDF completo', async () => {
      const emptyTenantData = await sustainabilityRepository.getOds8AggregatedData(null);
      expect(emptyTenantData.totalEmployees).toBe(0);
      expect(emptyTenantData.allActiveEmployees).toEqual([]);

      const fullCorpusDataset = await sustainabilityFineTuningService.generateDataset({
        targetModel: 'qwen2.5',
        includeFullPdfCorpus: true,
      });
      expect(fullCorpusDataset.totalSamples).toBeGreaterThanOrEqual(3800);
    });

    it('debe soportar configuración para DeepSeek API, OpenAI, Gemini y Modelos Locales Fine-Tuneados (Ollama / vLLM)', () => {
      const deepseekCfg = llmProviderService.resolveActiveConfig({
        provider: 'deepseek',
        apiKey: 'sk-test-deepseek',
      });
      expect(deepseekCfg.providerKey).toBe('deepseek');
      expect(deepseekCfg.model).toBe('deepseek-chat');
      expect(deepseekCfg.isConfigured).toBe(true);

      const localOllamaCfg = llmProviderService.resolveActiveConfig({
        provider: 'local_ollama',
        model: 'ecuador-erp-ai',
        baseUrl: 'http://127.0.0.1:11434',
      });
      expect(localOllamaCfg.providerKey).toBe('local_ollama');
      expect(localOllamaCfg.model).toBe('ecuador-erp-ai');
      expect(localOllamaCfg.isConfigured).toBe(true);

      const prevProvider = process.env.AI_PROVIDER;
      const prevModel = process.env.AI_MODEL;
      process.env.AI_PROVIDER = 'deepseek';
      process.env.AI_MODEL = 'deepseek-chat';
      try {
        const hfCfg = llmProviderService.resolveActiveConfig({
          provider: 'huggingface',
          apiKey: 'hf_test_token',
        });
        expect(hfCfg.providerKey).toBe('huggingface');
        expect(hfCfg.model).toBe('Qwen/Qwen2.5-72B-Instruct');
        expect(hfCfg.baseUrl).toBe('https://router.huggingface.co/v1');
      } finally {
        process.env.AI_PROVIDER = prevProvider;
        process.env.AI_MODEL = prevModel;
      }
    });
  });
});
