/**
 * @file whatsappAndAiStressQuality.test.js
 * @description Suite Exhaustiva de Calidad, Resiliencia, Detección Anti-Alucinaciones y Seguridad Criptográfica.
 * Cubre:
 *  1. Detección Anti-Alucinaciones y Auditoría Matemática en LegalEvaluatorService.
 *  2. Inferencia Densa, Vectorización de Pasajes y Similitud Cosenial en NeuralRetrieverService.
 *  3. Seguridad Criptográfica, Rate Limiting y Protección contra Replay en WhatsApp.
 *  4. Ciclo de Vida Multi-Turno Completo de Habilidades Agénticas 2FA.
 *  5. Telemetría de Diagnóstico del Ecosistema de IA y WhatsApp.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import legalEvaluatorService from '../../src/modules/sustainability/legalEvaluator.service.js';
import neuralRetrieverService from '../../src/modules/sustainability/neuralRetriever.service.js';
import { WhatsappSecurityService } from '../../src/modules/whatsapp/whatsappSecurity.service.js';
import { WhatsappConfirmationService } from '../../src/modules/whatsapp/whatsappConfirmation.service.js';
import { WHATSAPP_SESSION_STATUS } from '../../src/modules/whatsapp/whatsappActionSession.repository.js';
import whatsappService from '../../src/modules/whatsapp/whatsapp.service.js';

// Activar modelos ONNX durante esta suite
process.env.ENABLE_NEURAL_ONNX_TEST = 'true';

describe('Suite de Calidad Extrema: Anti-Alucinaciones, Inferencia Neuronal y Seguridad 2FA', () => {
  afterAll(() => {
    delete process.env.ENABLE_NEURAL_ONNX_TEST;
  });

  // ============================================================================
  // 1. AUDITORÍA ANTI-ALUCINACIONES Y VERIFICACIÓN MATEMÁTICA (LEGAL EVALUATOR)
  // ============================================================================
  describe('1. Juez Anti-Alucinaciones y Fidelidad Legal (LegalEvaluatorService)', () => {
    const mockRetrievedChunks = [
      {
        articleCode: 'Código del Trabajo Art. 188',
        content:
          'Art. 188.- Indemnización por despido intempestivo.- El empleador que despidiere intempestivamente al trabajador, será condenado a indemnizarlo...',
      },
      {
        articleCode: 'Código del Trabajo Art. 185',
        content:
          'Art. 185.- Bonificaciones por desahucio.- En los casos de terminación de la relación laboral por desahucio...',
      },
    ];

    it('debe aprobar con status VERIFIED_BY_EVALUATOR cuando todos los artículos citados constan en los fragmentos', () => {
      const generatedAnswer =
        'De conformidad con el Art. 188 y el Art. 185 del Código del Trabajo, le corresponde indemnización por despido intempestivo y bonificación por desahucio.';

      const audit = legalEvaluatorService.verifyAnswerFidelity({
        answerText: generatedAnswer,
        retrievedChunks: mockRetrievedChunks,
      });

      expect(audit.status).toBe('VERIFIED_BY_EVALUATOR');
      expect(audit.groundednessScore).toBeGreaterThanOrEqual(0.9);
      expect(audit.verifiedArticles).toEqual(expect.arrayContaining(['Art. 188', 'Art. 185']));
      expect(audit.unverifiedArticles).toHaveLength(0);
      expect(audit.auditedAnswer).not.toContain('Nota de Auditoría');
    });

    it('debe detectar alucinación de artículos de legislaciones extranjeras o no recuperadas e inyectar advertencia', () => {
      const hallucinatedAnswer =
        'Según el Art. 188 del Código del Trabajo y el Art. 123 de la Ley de Trabajo, tiene derecho a indemnización.';

      const audit = legalEvaluatorService.verifyAnswerFidelity({
        answerText: hallucinatedAnswer,
        retrievedChunks: mockRetrievedChunks,
      });

      expect(audit.status).toBe('AUDITED_WITH_CORRECTION');
      expect(audit.verifiedArticles).toContain('Art. 188');
      expect(audit.unverifiedArticles).toContain('Art. 123');
      expect(audit.auditedAnswer).toContain(
        'Nota de Auditoría del Evaluador Legal (Anti-Alucinación)'
      );
      expect(audit.auditedAnswer).toContain('Art. 123');
    });

    it('debe detectar discrepancia aritmética frente a Decimal.js e inyectar el cálculo verificado', () => {
      const liveCalculation = {
        totalSettlement: 4250.0,
        formattedSummary:
          '- Desahucio: $850.00\n- Despido Intempestivo: $3,400.00\n- Total Liquidación Oficial: $4,250.00',
      };

      const inaccurateAnswer =
        'En base al Art. 188, el monto estimado a recibir asciende a la suma de $5,000.00 USD.';

      const audit = legalEvaluatorService.verifyAnswerFidelity({
        answerText: inaccurateAnswer,
        retrievedChunks: mockRetrievedChunks,
        liveCalculation,
      });

      expect(audit.mathVerified).toBe(false);
      expect(audit.status).toBe('AUDITED_WITH_CORRECTION');
      expect(audit.auditedAnswer).toContain(
        'Verificación Matemática Oficial del Evaluador (Decimal.js)'
      );
      expect(audit.auditedAnswer).toContain('$4,250.00');
    });
  });

  // ============================================================================
  // 2. INFERENCIA NEURONAL DENSA, EMBEDDINGS Y SIMILITUD COSENIAL
  // ============================================================================
  describe('2. Inferencia Densa, Embeddings y Fallback Seguro (NeuralRetrieverService)', () => {
    function computeCosineSimilarity(vecA, vecB) {
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

    const hasBiEncoder = neuralRetrieverService.hasBiEncoderFiles();

    it('debe gestionar la disponibilidad de modelos o degradar limpiamente a null', async () => {
      if (!hasBiEncoder) {
        expect(neuralRetrieverService.hasBiEncoderFiles()).toBe(false);
        const result = await neuralRetrieverService.embedPassage('texto de prueba');
        expect(result).toBeNull();
      } else {
        expect(neuralRetrieverService.hasBiEncoderFiles()).toBe(true);
      }
    });

    it.runIf(hasBiEncoder)(
      'embedPassage debe vectorizar pasajes oficiales con prefijo E5 en 768 dimensiones',
      async () => {
        const passage =
          'Art. 55.- Remuneración por horas suplementarias y extraordinarias.- Por convenio entre las partes, el empleador podrá pagar horas de sobretiempo con recargo del 50% o 100%.';

        const embedding = await neuralRetrieverService.embedPassage(passage);
        expect(Array.isArray(embedding)).toBe(true);
        expect(embedding).toHaveLength(768);
      },
      30000
    );

    it.runIf(hasBiEncoder)(
      'la similitud cosenial semántica debe ser significativamente mayor para pasajes afines que para pasajes ajenos',
      async () => {
        const queryVec = await neuralRetrieverService.embedQuery(
          'cuanto me pagan por trabajar horas extras en feriado'
        );
        const relevantPassageVec = await neuralRetrieverService.embedPassage(
          'Art. 55.- El trabajo extraordinario realizado en sábados, domingos o días feriados se pagará con el 100% de recargo.'
        );
        const irrelevantPassageVec = await neuralRetrieverService.embedPassage(
          'Art. 418 de la Constitución sobre los tratados internacionales ratificados por la Presidencia de la República.'
        );

        const simRelevant = computeCosineSimilarity(queryVec, relevantPassageVec);
        const simIrrelevant = computeCosineSimilarity(queryVec, irrelevantPassageVec);

        expect(simRelevant).toBeGreaterThan(simIrrelevant);
        expect(simRelevant - simIrrelevant).toBeGreaterThan(0.05);
      },
      30000
    );
  });

  // ============================================================================
  // 3. SEGURIDAD CRIPTOGRÁFICA, DEDUPLICACIÓN E IDEMPOTENCIA EN WHATSAPP
  // ============================================================================
  describe('3. Criptografía, Rate Limiting e Idempotencia (WhatsappSecurityService)', () => {
    let security;

    beforeEach(() => {
      security = new WhatsappSecurityService();
    });

    it('debe detectar y bloquear mensajes duplicados en la ventana de idempotencia (Replay Attack)', () => {
      const messageId = 'wamid.HBgLMTIzNDU2Nzg5MA==';

      expect(security.isDuplicateMessage(messageId)).toBe(false);
      expect(security.isDuplicateMessage(messageId)).toBe(true);
    });

    it('debe aplicar Rate Limiting estricto si un remitente excede el umbral de mensajes por minuto', () => {
      const phone = '593987654321';

      for (let i = 0; i < security.MAX_REQUESTS_PER_MINUTE; i++) {
        expect(security.checkRateLimit(phone)).toBe(true);
      }

      expect(security.checkRateLimit(phone)).toBe(false);
    });

    it('verifyIdentityCard y verifyIdentityLast4 deben operar en tiempo constante y rechazar longitudes inválidas', () => {
      expect(security.verifyIdentityCard('1723456789', '1723456789')).toBe(true);
      expect(security.verifyIdentityCard('1723456789', '1723459999')).toBe(false);
      expect(security.verifyIdentityCard('1723456789', '6789')).toBe(false);
      expect(security.verifyIdentityCard('1723456789', '17234567890123')).toBe(false);
      expect(security.verifyIdentityCard(null, '1723456789')).toBe(false);
      expect(security.verifyIdentityLast4('1723456789', '6789')).toBe(true);
      expect(security.verifyIdentityLast4('1723456789', '9999')).toBe(false);
      expect(security.verifyIdentityLast4('1723456789', '678')).toBe(false);
      expect(security.verifyIdentityLast4('1723456789', '67890')).toBe(false);
      expect(security.verifyIdentityLast4(null, '6789')).toBe(false);
    });

    it('hashOtp y verifyOtpHash deben validar OTP con salt de sesión y resistir timing attacks', () => {
      const sessionId = 'session-uuid-777';
      const otp = '948201';

      const hash = security.hashOtp(sessionId, otp);
      expect(security.verifyOtpHash(sessionId, otp, hash)).toBe(true);
      expect(security.verifyOtpHash(sessionId, '000000', hash)).toBe(false);
      expect(security.verifyOtpHash('otra-sesion', otp, hash)).toBe(false);
      expect(security.verifyOtpHash(sessionId, '12345', hash)).toBe(false);
    });
  });

  // ============================================================================
  // 4. CICLO DE VIDA MULTI-TURNO COMPLETO DE HABILIDADES AGÉNTICAS 2FA
  // ============================================================================
  describe('4. Flujo Agéntico 2FA Completo (WhatsappConfirmationService)', () => {
    let mockSessionRepo;
    let mockSecurity;
    let mockClient;
    let confirmationService;

    const mockEmployee = {
      id: 'emp-101',
      tenantId: 'tenant-101',
      firstName: 'Ana',
      lastName: 'Gómez',
      identityCard: '0987654321',
      email: 'ana.gomez@empresa.ec',
      phone: '593991234567',
      tenant: { name: 'Empresa Test' },
    };

    beforeEach(() => {
      mockSessionRepo = {
        saveDraftSession: vi
          .fn()
          .mockResolvedValue({ id: 'sess-888', status: 'COLLECTING_PARAMS' }),
        createSession: vi.fn().mockResolvedValue({ id: 'sess-888', status: 'COLLECTING_PARAMS' }),
        findOpenSession: vi.fn(),
        markPendingConfirmation: vi.fn().mockResolvedValue(true),
        markStatus: vi.fn().mockResolvedValue(true),
        cancelOpenSessions: vi.fn().mockResolvedValue({ count: 1 }),
        registerFailedAttempt: vi.fn().mockResolvedValue({ locked: false, attempts: 1 }),
      };

      mockSecurity = new WhatsappSecurityService();
      mockClient = {
        sendTextMessage: vi.fn().mockResolvedValue({ success: true }),
      };

      confirmationService = new WhatsappConfirmationService(
        mockSessionRepo,
        mockSecurity,
        mockClient
      );
    });

    it('saveCollectingDraft debe persistir el borrador en estado COLLECTING_PARAMS', async () => {
      const draft = await confirmationService.saveCollectingDraft({
        employee: mockEmployee,
        phoneKey: '593991234567',
        skillName: 'REQUEST_VACATION',
        partialPayload: { startDate: '2026-12-01' },
      });

      expect(draft).toBeDefined();
      expect(mockSessionRepo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WHATSAPP_SESSION_STATUS.COLLECTING_PARAMS,
          skillName: 'REQUEST_VACATION',
        })
      );
    });

    it('handlePendingConfirmation debe cancelar la sesión si el colaborador envía "cancelar"', async () => {
      const activeSession = {
        id: 'sess-888',
        tenantId: mockEmployee.tenantId,
        employeeId: mockEmployee.id,
        status: WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
        payload: { startDate: '2026-12-01', endDate: '2026-12-05' },
        expiresAt: new Date(Date.now() + 600000),
      };

      const reply = await confirmationService.handlePendingConfirmation({
        text: 'cancelar',
        employee: mockEmployee,
        phoneKey: '593991234567',
        activeSession,
      });

      expect(reply).toContain('cancelada');
      expect(mockSessionRepo.markStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sess-888',
          status: WHATSAPP_SESSION_STATUS.CANCELLED,
        })
      );
    });

    it('handlePendingConfirmation debe rechazar cédula errónea e incrementar intentos fallidos', async () => {
      const activeSession = {
        id: 'sess-888',
        tenantId: mockEmployee.tenantId,
        employeeId: mockEmployee.id,
        status: WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
        payload: { startDate: '2026-12-01', endDate: '2026-12-05' },
        otpHash: 'hash-mock',
        expiresAt: new Date(Date.now() + 600000),
      };

      // Cédula real es 0987654321; usuario envía 0987659999 con OTP 123456
      const reply = await confirmationService.handlePendingConfirmation({
        text: 'CONFIRMAR 0987659999 123456',
        employee: mockEmployee,
        phoneKey: '593991234567',
        activeSession,
      });

      expect(reply).toMatch(/no coinciden/i);
      expect(mockSessionRepo.registerFailedAttempt).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 5. DIAGNÓSTICO DE INTEGRACIÓN DE WHATSAPP Y PROVEEDORES DE IA
  // ============================================================================
  describe('5. Telemetría de Diagnóstico y Conectividad (WhatsappService)', () => {
    it('getDiagnosticStatus debe reportar salud de WhatsApp y del proveedor de IA activo', () => {
      const status = whatsappService.getDiagnosticStatus();

      expect(status).toHaveProperty('whatsapp');
      expect(status).toHaveProperty('ai');
      expect(status.whatsapp).toHaveProperty('isConfigured');
      expect(status.ai).toHaveProperty('activeProvider');
      expect(status.ai).toHaveProperty('model');
    });
  });
});
