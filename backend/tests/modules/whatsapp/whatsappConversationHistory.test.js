/**
 * @file whatsappConversationHistory.test.js
 * @description Suite rigurosa de pruebas unitarias y de integración para el seguimiento de contexto conversacional en WhatsApp:
 * - Aislamiento multi-tenant (purga ante cambio de tenant)
 * - Expiración estricta por TTL de inactividad (15 min)
 * - Ventana deslizante de 6 mensajes (3 turnos)
 * - Comandos de reseteo explícito ("nueva consulta", "olvida lo anterior")
 * - Inyección y persistencia en el RAG Legal y consultas personales
 * - Resiliencia ante fallos transitorios de persistencia
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsappConversationHistoryService } from '../../../src/modules/whatsapp/whatsappConversationHistory.service.js';
import { WhatsappAiService } from '../../../src/modules/whatsapp/whatsappAi.service.js';
import {
  WHATSAPP_CONVERSATION_HISTORY_MAX_MESSAGES,
  WHATSAPP_CONVERSATION_HISTORY_TTL_MS,
  RESET_CONVERSATION_FEEDBACK_MESSAGE,
} from '../../../src/modules/whatsapp/whatsapp.constants.js';

function createInMemoryHistoryRepo() {
  const store = new Map();

  return {
    store,
    getContext: vi.fn(async (phoneKey) => {
      const data = store.get(phoneKey);
      if (!data) return null;
      return {
        id: `ctx-${phoneKey}`,
        phoneKey,
        activeTenantId: data.activeTenantId || null,
        conversationHistoryJson: data.conversationHistoryJson || null,
        lastInteractionAt: data.lastInteractionAt || null,
      };
    }),
    saveHistory: vi.fn(async ({ phoneKey, tenantId, history, lastInteractionAt }) => {
      const existing = store.get(phoneKey) || {};
      const updated = {
        ...existing,
        phoneKey,
        activeTenantId: tenantId || existing.activeTenantId || null,
        conversationHistoryJson: history,
        lastInteractionAt,
      };
      store.set(phoneKey, updated);
      return updated;
    }),
    clearHistory: vi.fn(async (phoneKey) => {
      const existing = store.get(phoneKey);
      if (existing) {
        existing.conversationHistoryJson = null;
        existing.lastInteractionAt = null;
        store.set(phoneKey, existing);
      }
      return { count: 1 };
    }),
  };
}

describe('WhatsApp Conversation History & Context Tracking Suite', () => {
  const phoneKey = '593987654321';
  const tenantId = 'tenant-sol-001';
  const otherTenantId = 'tenant-luna-002';

  let mockRepo;
  let historyService;

  beforeEach(() => {
    mockRepo = createInMemoryHistoryRepo();
    historyService = new WhatsappConversationHistoryService(mockRepo);
  });

  describe('1. Ciclo de Vida y Ventana Deslizante (Max 6 Mensajes)', () => {
    it('debe iniciar con historial vacío para un número telefónico nuevo', async () => {
      const history = await historyService.getActiveHistory({ phoneKey, tenantId });
      expect(history).toEqual([]);
      expect(mockRepo.getContext).toHaveBeenCalledWith(phoneKey);
    });

    it('debe registrar un turno de conversación (user + assistant) y recuperarlo fielmente', async () => {
      const now = new Date('2026-11-13T10:00:00.000Z');

      await historyService.recordTurn({
        phoneKey,
        tenantId,
        userText: '¿Cuántos días de vacaciones me corresponden al primer año?',
        assistantText: 'Según el Art. 69 del Código del Trabajo, le corresponden 15 días.',
        now,
      });

      const history = await historyService.getActiveHistory({ phoneKey, tenantId, now });
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        role: 'user',
        content: '¿Cuántos días de vacaciones me corresponden al primer año?',
      });
      expect(history[1]).toEqual({
        role: 'assistant',
        content: 'Según el Art. 69 del Código del Trabajo, le corresponden 15 días.',
      });
    });

    it('debe truncar a exactamente 6 mensajes cuando se registran 4 o más turnos (ventana deslizante)', async () => {
      const startTime = new Date('2026-11-13T10:00:00.000Z').getTime();

      // Insertar 4 turnos sucesivos (8 mensajes en total)
      for (let i = 1; i <= 4; i++) {
        const turnTime = new Date(startTime + i * 60 * 1000);
        await historyService.recordTurn({
          phoneKey,
          tenantId,
          userText: `Pregunta turno ${i}`,
          assistantText: `Respuesta turno ${i}`,
          now: turnTime,
        });
      }

      const history = await historyService.getActiveHistory({
        phoneKey,
        tenantId,
        now: new Date(startTime + 5 * 60 * 1000),
      });

      expect(history).toHaveLength(WHATSAPP_CONVERSATION_HISTORY_MAX_MESSAGES); // 6 mensajes
      // El turno 1 fue descartado; el historial inicia en el turno 2
      expect(history[0].content).toBe('Pregunta turno 2');
      expect(history[history.length - 1].content).toBe('Respuesta turno 4');
    });
  });

  describe('2. Control Estricto de TTL por Inactividad (15 Minutos)', () => {
    it('debe mantener el historial activo si han pasado 14 minutos (dentro de la ventana)', async () => {
      const t0 = new Date('2026-11-13T12:00:00.000Z');
      await historyService.recordTurn({
        phoneKey,
        tenantId,
        userText: 'Consulta laboral',
        assistantText: 'Respuesta laboral',
        now: t0,
      });

      const t14 = new Date(t0.getTime() + 14 * 60 * 1000); // 14 minutos después
      const history = await historyService.getActiveHistory({ phoneKey, tenantId, now: t14 });

      expect(history).toHaveLength(2);
      expect(mockRepo.clearHistory).not.toHaveBeenCalled();
    });

    it('debe expirar y purgar automáticamente el historial si han transcurrido 16 minutos (> 15 min TTL)', async () => {
      const t0 = new Date('2026-11-13T12:00:00.000Z');
      await historyService.recordTurn({
        phoneKey,
        tenantId,
        userText: 'Consulta sobre despido intempestivo',
        assistantText: 'Fundamento según Art. 188...',
        now: t0,
      });

      const t16 = new Date(t0.getTime() + (WHATSAPP_CONVERSATION_HISTORY_TTL_MS + 60000)); // 16 min
      const history = await historyService.getActiveHistory({ phoneKey, tenantId, now: t16 });

      expect(history).toEqual([]);
      expect(mockRepo.clearHistory).toHaveBeenCalledWith(phoneKey);

      // Verificación de que en la BD/store quedó purgado
      const stored = await mockRepo.getContext(phoneKey);
      expect(stored.conversationHistoryJson).toBeNull();
      expect(stored.lastInteractionAt).toBeNull();
    });
  });

  describe('3. Aislamiento Multi-Tenant Estricto (Prevención de Fuga de Datos)', () => {
    it('debe purgar inmediatamente el historial si el teléfono cambia de empresa activa', async () => {
      const t0 = new Date('2026-11-13T14:00:00.000Z');

      // Colaborador interactúa en Empresa A (Almacenes El Sol)
      await historyService.recordTurn({
        phoneKey,
        tenantId,
        userText: '¿Cuál es el horario en El Sol?',
        assistantText: 'De 08:00 a 17:00 en Almacenes El Sol.',
        now: t0,
      });

      // Misma persona cambia a Empresa B (Logística Continental)
      const historyInCompanyB = await historyService.getActiveHistory({
        phoneKey,
        tenantId: otherTenantId,
        now: t0,
      });

      // No debe existir filtración de la Empresa A en la Empresa B
      expect(historyInCompanyB).toEqual([]);
      expect(mockRepo.clearHistory).toHaveBeenCalledWith(phoneKey);
    });
  });

  describe('4. Comandos de Reseteo y Sanitización', () => {
    it('debe filtrar y sanitizar elementos malformados o con roles no válidos en el contexto almacenado', async () => {
      mockRepo.store.set(phoneKey, {
        activeTenantId: tenantId,
        conversationHistoryJson: [
          null,
          { role: 'system', content: 'hack prompt' },
          { role: 'user', content: '   ' },
          { role: 'user', content: 'Consulta legítima' },
          { role: 'invalid_role', content: 'respuesta inválida' },
          { role: 'assistant', content: 'Respuesta legítima' },
          { role: 'assistant', content: null },
        ],
        lastInteractionAt: new Date(),
      });

      const history = await historyService.getActiveHistory({ phoneKey, tenantId });
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({ role: 'user', content: 'Consulta legítima' });
      expect(history[1]).toEqual({ role: 'assistant', content: 'Respuesta legítima' });
    });

    it('debe truncar textos excesivamente largos para proteger la memoria y límites de tokens', async () => {
      const veryLongQuery = 'a'.repeat(3000);
      const veryLongAnswer = 'b'.repeat(5000);

      await historyService.recordTurn({
        phoneKey,
        tenantId,
        userText: veryLongQuery,
        assistantText: veryLongAnswer,
      });

      const history = await historyService.getActiveHistory({ phoneKey, tenantId });
      expect(history).toHaveLength(2);
      expect(history[0].content.length).toBe(1000); // Truncado a 1000 chars
      expect(history[1].content.length).toBe(2500); // Truncado a 2500 chars
    });

    it('debe aislar concurrentemente historiales de diferentes teléfonos sin colisión', async () => {
      const phone1 = '593911111111';
      const phone2 = '593922222222';

      await historyService.recordTurn({
        phoneKey: phone1,
        tenantId,
        userText: 'Mensaje de Teléfono 1',
        assistantText: 'Respuesta a Teléfono 1',
      });

      await historyService.recordTurn({
        phoneKey: phone2,
        tenantId,
        userText: 'Mensaje de Teléfono 2',
        assistantText: 'Respuesta a Teléfono 2',
      });

      const h1 = await historyService.getActiveHistory({ phoneKey: phone1, tenantId });
      const h2 = await historyService.getActiveHistory({ phoneKey: phone2, tenantId });

      expect(h1).toHaveLength(2);
      expect(h1[0].content).toBe('Mensaje de Teléfono 1');

      expect(h2).toHaveLength(2);
      expect(h2[0].content).toBe('Mensaje de Teléfono 2');
    });

    it('debe tolerar llamadas con phoneKey null o indefinido sin romper', async () => {
      expect(await historyService.getActiveHistory({ phoneKey: null })).toEqual([]);
      await expect(
        historyService.recordTurn({ phoneKey: null, userText: 'hola', assistantText: 'mundo' })
      ).resolves.not.toThrow();
      await expect(historyService.resetHistory({ phoneKey: null })).resolves.not.toThrow();
    });

    it('debe limpiar el historial cuando se ejecuta resetHistory explícitamente', async () => {
      await historyService.recordTurn({
        phoneKey,
        tenantId,
        userText: 'Tema anterior',
        assistantText: 'Respuesta anterior',
      });

      await historyService.resetHistory({ phoneKey });

      const history = await historyService.getActiveHistory({ phoneKey, tenantId });
      expect(history).toEqual([]);
    });

    it('debe tolerar fallos del repositorio sin arrojar excepciones no controladas', async () => {
      const faultyRepo = {
        getContext: vi.fn(async () => {
          throw new Error('Database connection timeout');
        }),
        saveHistory: vi.fn(async () => {
          throw new Error('Deadlock detected');
        }),
        clearHistory: vi.fn(async () => {
          throw new Error('Connection refused');
        }),
      };

      const resilientService = new WhatsappConversationHistoryService(faultyRepo);

      // No debe lanzar excepción
      const history = await resilientService.getActiveHistory({ phoneKey, tenantId });
      expect(history).toEqual([]);

      await expect(
        resilientService.recordTurn({
          phoneKey,
          tenantId,
          userText: 'Pregunta',
          assistantText: 'Respuesta',
        })
      ).resolves.not.toThrow();

      await expect(resilientService.resetHistory({ phoneKey })).resolves.not.toThrow();
    });
  });

  describe('5. Orquestación Integral con WhatsappAiService y RAG Legal', () => {
    const employee = {
      id: 'emp-505',
      firstName: 'Andrea',
      lastName: 'Paredes',
      email: 'andrea@elsol.ec',
      phone: '0987654321',
      role: 'employee',
      department: 'Contabilidad',
      position: 'Analista Contable',
      vacationDays: 10,
      whatsappConsent: true,
      tenantId: 'tenant-sol-001',
      tenant: { id: 'tenant-sol-001', name: 'Almacenes El Sol' },
    };

    it('debe responder al comando de reinicio "nueva consulta" limpiando el contexto', async () => {
      const mockHistory = {
        getActiveHistory: vi.fn(async () => []),
        recordTurn: vi.fn(async () => {}),
        resetHistory: vi.fn(async () => {}),
      };

      const aiService = new WhatsappAiService(
        null, // llmProvider
        null, // ragService
        null, // repo
        null, // confirmationService
        null, // skillRegistry
        null, // sessionRepo
        null, // consentService
        null, // auditor
        mockHistory
      );

      const reply = await aiService.generateResponse({
        text: 'Nueva consulta',
        employee,
        phoneKey,
      });

      expect(mockHistory.resetHistory).toHaveBeenCalledWith({ phoneKey });
      expect(reply).toBe(RESET_CONVERSATION_FEEDBACK_MESSAGE);
    });

    it('debe responder al comando "olvida lo anterior" reseteando el historial', async () => {
      const mockHistory = {
        getActiveHistory: vi.fn(async () => []),
        recordTurn: vi.fn(async () => {}),
        resetHistory: vi.fn(async () => {}),
      };

      const aiService = new WhatsappAiService(
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        mockHistory
      );

      const reply = await aiService.generateResponse({
        text: 'olvida lo anterior por favor',
        employee,
        phoneKey,
      });

      expect(mockHistory.resetHistory).toHaveBeenCalledWith({ phoneKey });
      expect(reply).toBe(RESET_CONVERSATION_FEEDBACK_MESSAGE);
    });

    it('debe pasar el historial previo al RAG Legal y registrar el nuevo turno generado', async () => {
      const previousTurns = [
        { role: 'user', content: '¿Qué es el desahucio?' },
        {
          role: 'assistant',
          content: 'Es el aviso por escrito de terminación de contrato según el Art. 184.',
        },
      ];

      const mockHistory = {
        getActiveHistory: vi.fn(async () => previousTurns),
        recordTurn: vi.fn(async () => {}),
        resetHistory: vi.fn(async () => {}),
      };

      const mockRagService = {
        processQuery: vi.fn(async () => ({
          answer:
            'La bonificación del desahucio es del 25% de la última remuneración por cada año de servicio.',
          legalCitations: [{ articleCode: 'Art. 185', documentTitle: 'Código del Trabajo' }],
        })),
      };

      const aiService = new WhatsappAiService(
        null,
        mockRagService,
        null,
        null,
        null,
        null,
        null,
        null,
        mockHistory
      );

      const question = '¿Y a cuánto equivale la bonificación?';
      const response = await aiService.generateResponse({
        text: question,
        employee,
        phoneKey,
      });

      // 1. Debe haber consultado el historial activo
      expect(mockHistory.getActiveHistory).toHaveBeenCalledWith({
        phoneKey,
        tenantId: employee.tenantId,
      });

      // 2. Debe haberle enviado el historial al motor RAG
      expect(mockRagService.processQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: question,
          conversationHistory: previousTurns,
          tenantId: employee.tenantId,
        })
      );

      // 3. Debe haber registrado el nuevo turno con el asistente
      expect(mockHistory.recordTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneKey,
          tenantId: employee.tenantId,
          userText: question,
          assistantText: expect.stringContaining('Art. 185'),
        })
      );

      expect(response).toContain('Art. 185');
    });
  });
});
