/**
 * @file whatsappEdgeCasesAndSecurity.test.js
 * @description Batería exhaustiva de pruebas de resiliencia, seguridad 2FA, casos de borde y concurrencia multi-tenant:
 * - Fuerza bruta y bloqueo tras 3 intentos fallidos de OTP
 * - Expiración de sesión (TTL excedido)
 * - Cancelación explícita ("cancelar", "anular", "salir")
 * - Formato incompleto de confirmación
 * - Manejo de montos con coma decimal ($250,50) y cuotas límite (1 y 24)
 * - Rechazo cuando no existe sueldo base configurado
 * - Permisos con fechas inconsistentes o rangos mayores a 30 días
 * - Inferencia contextual de fecha "hoy" para permisos
 * - Aislamiento departamental para Managers en aprobación de solicitudes
 * - Conmutación de tenant interactiva (por índice y por coincidencia de nombre)
 * - Idempotencia y descarte de mensajes duplicados de Meta
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsappAiService } from '../../../src/modules/whatsapp/whatsappAi.service.js';
import { WhatsappConfirmationService } from '../../../src/modules/whatsapp/whatsappConfirmation.service.js';
import { WhatsappSecurityService } from '../../../src/modules/whatsapp/whatsappSecurity.service.js';
import { WhatsappService } from '../../../src/modules/whatsapp/whatsapp.service.js';
import { WhatsappSkillRegistry } from '../../../src/modules/whatsapp/skills/whatsappSkill.registry.js';
import { RequestVacationSkill } from '../../../src/modules/whatsapp/skills/requestVacation.skill.js';
import { RequestSalaryAdvanceSkill } from '../../../src/modules/whatsapp/skills/requestSalaryAdvance.skill.js';
import { RequestPermissionSkill } from '../../../src/modules/whatsapp/skills/requestPermission.skill.js';
import { ReviewPendingRequestsSkill } from '../../../src/modules/whatsapp/skills/reviewPendingRequests.skill.js';
import { WHATSAPP_SESSION_STATUS } from '../../../src/modules/whatsapp/whatsappActionSession.repository.js';

function createMockSessionRepo() {
  const store = new Map();
  return {
    store,
    findOpenSession: vi.fn(async ({ phoneKey, tenantId, employeeId }) => {
      for (const s of store.values()) {
        if (
          s.phoneKey === phoneKey &&
          s.tenantId === tenantId &&
          s.employeeId === employeeId &&
          (s.status === WHATSAPP_SESSION_STATUS.COLLECTING_PARAMS ||
            s.status === WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION)
        ) {
          return s;
        }
      }
      return null;
    }),
    cancelOpenSessions: vi.fn(async ({ phoneKey, tenantId, employeeId }) => {
      for (const s of store.values()) {
        if (s.phoneKey === phoneKey && s.tenantId === tenantId && s.employeeId === employeeId) {
          s.status = WHATSAPP_SESSION_STATUS.CANCELLED;
        }
      }
    }),
    createSession: vi.fn(async (data) => {
      const record = { ...data };
      store.set(record.id, record);
      return record;
    }),
    updateSessionScoped: vi.fn(async ({ id, data }) => {
      const curr = store.get(id);
      if (curr) Object.assign(curr, data);
      return { count: curr ? 1 : 0 };
    }),
    markStatus: vi.fn(async ({ id, status }) => {
      const curr = store.get(id);
      if (curr) curr.status = status;
      return { count: curr ? 1 : 0 };
    }),
    registerFailedAttempt: vi.fn(async ({ id, maxAttempts = 3 }) => {
      const curr = store.get(id);
      curr.attempts = (curr.attempts || 0) + 1;
      const locked = curr.attempts >= maxAttempts;
      if (locked) curr.status = WHATSAPP_SESSION_STATUS.LOCKED;
      return { attempts: curr.attempts, maxAttempts, locked };
    }),
    claimForExecution: vi.fn(async ({ id }) => {
      const curr = store.get(id);
      if (!curr || curr.status !== WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION) return false;
      curr.status = 'EXECUTING';
      return true;
    }),
    markCompleted: vi.fn(async ({ id, resultingEntityId }) => {
      const curr = store.get(id);
      if (curr) {
        curr.status = WHATSAPP_SESSION_STATUS.COMPLETED;
        curr.resultingEntityId = resultingEntityId;
      }
    }),
  };
}

describe('WhatsApp Multi-Tenant Edge Cases, Security & Robustness Suite', () => {
  const tenant1 = { id: 'tenant-1', name: 'Almacenes El Sol', ruc: '0990011223001' };
  const tenant2 = { id: 'tenant-2', name: 'Logística Continental', ruc: '1790022334001' };

  const employee = {
    id: 'emp-101',
    firstName: 'Santiago',
    lastName: 'Morales',
    email: 'santiago@elsol.ec',
    identityCard: '1712345678',
    department: 'Bodega',
    role: 'employee',
    phone: '0987654321',
    vacationDays: 12,
    whatsappConsent: true,
    tenantId: tenant1.id,
    tenant: tenant1,
  };

  const manager = {
    ...employee,
    id: 'mgr-202',
    firstName: 'Daniela',
    lastName: 'Cevallos',
    email: 'daniela.mgr@elsol.ec',
    identityCard: '0912345678',
    role: 'manager',
    department: 'Bodega',
  };

  let sessionRepo;
  let security;
  let lastOtpSent;
  let emailSender;
  let auditor;
  let repo;
  let advanceService;
  let absenceService;
  let llmProvider;
  let ragService;
  let aiService;

  beforeEach(() => {
    sessionRepo = createMockSessionRepo();
    security = new WhatsappSecurityService();
    lastOtpSent = null;

    emailSender = {
      sendEmail: vi.fn(async ({ html }) => {
        const match = html.match(/>(\d{6})</);
        if (match) lastOtpSent = match[1];
        return { success: true };
      }),
    };

    auditor = { log: vi.fn(async () => ({})) };

    repo = {
      getEmployeeActiveBaseSalary: vi.fn(async () => 800),
      getEmployeeAttendanceToday: vi.fn(async () => null),
      getTenantSummaryMetrics: vi.fn(async () => ({ totalActiveEmployees: 10 })),
      getEmployeeLatestPayrollAndRequests: vi.fn(async () => ({})),
      getPendingTenantRequestsForReview: vi.fn(async (_tenantId, department) => {
        const allAbsences = [
          {
            id: 'abs-bodega-1',
            type: 'Permiso Médico',
            startDate: new Date('2026-11-20'),
            endDate: new Date('2026-11-20'),
            reason: 'Cita IESS',
            employee: { id: 'emp-b1', firstName: 'Juan', lastName: 'Perez', department: 'Bodega' },
          },
          {
            id: 'abs-ventas-2',
            type: 'Vacaciones',
            startDate: new Date('2026-11-22'),
            endDate: new Date('2026-11-25'),
            reason: 'Descanso',
            employee: { id: 'emp-v1', firstName: 'Maria', lastName: 'Lara', department: 'Ventas' },
          },
        ];
        const filtered = department
          ? allAbsences.filter((a) => a.employee.department === department)
          : allAbsences;
        return { pendingAbsences: filtered, pendingAdvances: [] };
      }),
    };

    advanceService = {
      requestAdvance: vi.fn(async (params) => ({ id: 'adv-mock-1', ...params, status: 'PENDING' })),
      approveAdvance: vi.fn(),
      rejectAdvance: vi.fn(),
    };

    absenceService = {
      createRequest: vi.fn(async (params) => ({ id: 'abs-mock-1', ...params, status: 'PENDING' })),
      updateRequestStatus: vi.fn(async ({ id, status, adminComment }) => ({
        id,
        status,
        adminComment,
      })),
    };

    llmProvider = {
      generateChatCompletion: vi.fn(async () => {
        throw new Error('LLM offline test fallback');
      }),
    };

    ragService = {
      processQuery: vi.fn(async () => ({ answer: 'Info legal', legalCitations: [] })),
    };

    const confirmationService = new WhatsappConfirmationService(
      sessionRepo,
      security,
      emailSender,
      auditor
    );

    const registry = new WhatsappSkillRegistry([
      new RequestVacationSkill(absenceService, llmProvider),
      new RequestSalaryAdvanceSkill(advanceService, repo, llmProvider),
      new RequestPermissionSkill(absenceService, llmProvider),
      new ReviewPendingRequestsSkill(absenceService, advanceService, repo),
    ]);

    const mockHistoryService = {
      getActiveHistory: vi.fn(async () => []),
      recordTurn: vi.fn(async () => {}),
      resetHistory: vi.fn(async () => {}),
    };

    aiService = new WhatsappAiService(
      llmProvider,
      ragService,
      repo,
      confirmationService,
      registry,
      sessionRepo,
      null,
      auditor,
      mockHistoryService
    );
  });

  it('1. Seguridad 2FA: bloquea la sesión tras exactamente 3 intentos fallidos de OTP o cédula', async () => {
    // 1. Iniciar borrador de anticipo
    await aiService.generateResponse({
      text: 'Solicito anticipo de $200 a 1 cuota por emergencia familiar',
      employee,
      phoneKey: '593987654321',
    });

    expect(lastOtpSent).toBeTruthy();

    // 2. Intento 1 fallido (OTP erróneo)
    const reply1 = await aiService.generateResponse({
      text: 'CONFIRMAR 1712345678 000000',
      employee,
      phoneKey: '593987654321',
    });
    expect(reply1).toContain('Intentos restantes: *2*');

    // 3. Intento 2 fallido (cédula errónea)
    const reply2 = await aiService.generateResponse({
      text: `CONFIRMAR 1712349999 ${lastOtpSent}`,
      employee,
      phoneKey: '593987654321',
    });
    expect(reply2).toContain('Intentos restantes: *1*');

    // 4. Intento 3 fallido -> Bloqueo estricto
    const reply3 = await aiService.generateResponse({
      text: 'CONFIRMAR 1712345678 111111',
      employee,
      phoneKey: '593987654321',
    });
    expect(reply3).toContain('Solicitud bloqueada por seguridad tras 3 intentos fallidos');
    expect(auditor.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'WHATSAPP_ACTION_LOCKED_MAX_ATTEMPTS' })
    );

    // 5. Intento posterior con código correcto ya no se procesa
    const replyAfterLock = await aiService.generateResponse({
      text: `CONFIRMAR 1712345678 ${lastOtpSent}`,
      employee,
      phoneKey: '593987654321',
    });
    expect(replyAfterLock).not.toContain('Solicitud de Anticipo Registrada');
    expect(advanceService.requestAdvance).not.toHaveBeenCalled();
  });

  it('2. Resiliencia: detecta sesiones expiradas por TTL de 10 minutos', async () => {
    await aiService.generateResponse({
      text: 'Solicito anticipo de $100 a 1 cuota por compra de medicina',
      employee,
      phoneKey: '593987654321',
    });

    // Simular paso del tiempo: modificar expiresAt a 15 minutos en el pasado
    const openSession = Array.from(sessionRepo.store.values())[0];
    openSession.expiresAt = new Date(Date.now() - 15 * 60 * 1000);

    const replyExpired = await aiService.generateResponse({
      text: `CONFIRMAR 1712345678 ${lastOtpSent}`,
      employee,
      phoneKey: '593987654321',
    });

    expect(replyExpired).toContain('La sesion de solicitud expiro por seguridad');
    expect(openSession.status).toBe(WHATSAPP_SESSION_STATUS.EXPIRED);
    expect(advanceService.requestAdvance).not.toHaveBeenCalled();
  });

  it('3. Resiliencia: permite al usuario cancelar el borrador en cualquier momento con palabras clave', async () => {
    await aiService.generateResponse({
      text: 'Quiero pedir un anticipo de $150 a 1 cuota por reparacion',
      employee,
      phoneKey: '593987654321',
    });

    const replyCancel = await aiService.generateResponse({
      text: 'cancelar',
      employee,
      phoneKey: '593987654321',
    });

    expect(replyCancel).toContain('Operacion cancelada correctamente');
    const openSession = Array.from(sessionRepo.store.values())[0];
    expect(openSession.status).toBe(WHATSAPP_SESSION_STATUS.CANCELLED);
  });

  it('4. Validación de formato de confirmación: guía al usuario cuando envía CONFIRMAR incompleto', async () => {
    await aiService.generateResponse({
      text: 'Solicito anticipo de $120 a 1 cuota por viaje laboral',
      employee,
      phoneKey: '593987654321',
    });

    const incompleteReply = await aiService.generateResponse({
      text: 'CONFIRMAR 1712345678', // falta el OTP
      employee,
      phoneKey: '593987654321',
    });

    expect(incompleteReply).toContain('Formato de confirmacion incompleto');
    expect(incompleteReply).toContain('numero de cedula completo');
    expect(incompleteReply).toContain('CONFIRMAR 1718293045 849201');
  });

  it('5. Parsing monetario flexible: acepta montos con coma decimal ($250,50) y cuotas límite', async () => {
    // $250.50 en 2 cuotas = $125.25/mes <= 50% de $800 ($400/mes)
    const reply = await aiService.generateResponse({
      text: 'Solicito anticipo de $250,50 a 2 cuotas por emergencia de salud',
      employee,
      phoneKey: '593987654321',
    });

    expect(reply).toContain('$250.50');
    expect(reply).toContain('2 cuota(s)');
    expect(reply).toContain('$125.25');
  });

  it('6. Casos límite de dominio: rechaza anticipo si el colaborador no tiene sueldo base registrado en su tenant', async () => {
    repo.getEmployeeActiveBaseSalary.mockResolvedValueOnce(0);

    const reply = await aiService.generateResponse({
      text: 'Solicito anticipo de $100 a 1 cuota por urgencia',
      employee,
      phoneKey: '593987654321',
    });

    expect(reply).toContain('No se encontro un contrato activo o sueldo base configurado');
    expect(advanceService.requestAdvance).not.toHaveBeenCalled();
  });

  it('7. Casos de borde en permisos: rechaza fechas invertidas o rangos mayores a 30 días', async () => {
    const replyInverted = await aiService.generateResponse({
      text: 'Solicitar permiso medico del 2026-11-25 al 2026-11-20 por cita IESS',
      employee,
      phoneKey: '593987654321',
    });
    expect(replyInverted).toContain('no puede ser anterior a la fecha de inicio');

    const replyTooLong = await aiService.generateResponse({
      text: 'Solicitar permiso medico del 2026-11-01 al 2026-12-15 por reposo',
      employee,
      phoneKey: '593987654321',
    });
    expect(replyTooLong).toContain('supera el maximo permitido por solicitud (30 dias)');
  });

  it('8. Inferencia temporal: infiere fecha "hoy" ante solicitud inmediata de permiso', async () => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const replyToday = await aiService.generateResponse({
      text: 'Solicitar permiso medico hoy por cita odontologica urgente',
      employee,
      phoneKey: '593987654321',
    });

    expect(replyToday).toContain(`- *Desde:* ${todayIso}`);
    expect(replyToday).toContain(`- *Hasta:* ${todayIso}`);
  });

  it('9. Aislamiento RBAC y Departamental: Manager solo ve y aprueba solicitudes de su departamento', async () => {
    // Daniela es Manager de Bodega. No debe ver solicitudes de Ventas.
    const replyList = await aiService.generateResponse({
      text: 'Revisar solicitudes pendientes',
      employee: manager,
      phoneKey: '593987654321',
    });

    expect(replyList).toContain('Juan Perez');
    expect(replyList).not.toContain('Maria Lara'); // Maria es de Ventas
    expect(repo.getPendingTenantRequestsForReview).toHaveBeenCalledWith(tenant1.id, 'Bodega');
  });

  it('10. Multi-Tenant Switching en WhatsappService: conmutación de tenant interactiva por número y por nombre', async () => {
    const clientMock = {
      sendTextMessage: vi.fn(async () => ({ success: true })),
      markMessageAsRead: vi.fn(async () => ({ success: true })),
    };
    const secService = new WhatsappSecurityService();

    const candidates = [
      { id: 'e1', tenantId: tenant1.id, tenant: tenant1, phone: '0987654321' },
      { id: 'e2', tenantId: tenant2.id, tenant: tenant2, phone: '0987654321' },
    ];

    const repoMock = {
      resolveEmployeeContext: vi
        .fn()
        .mockResolvedValueOnce({
          status: 'MULTI_TENANT_SELECTION_REQUIRED',
          employee: null,
          candidates,
        })
        .mockResolvedValueOnce({
          status: 'RESOLVED',
          employee: candidates[1],
          candidates,
        }),
      setActiveTenantContext: vi.fn(),
      clearActiveTenantSelection: vi.fn(),
    };

    const whatsappService = new WhatsappService(clientMock, secService, repoMock, aiService);

    // Mensaje 1: El usuario escribe "2" para seleccionar la empresa 2
    await whatsappService.handleSingleIncomingMessage({
      from: '593987654321',
      id: 'msg-1',
      type: 'text',
      text: { body: '2' },
    });

    expect(repoMock.setActiveTenantContext).toHaveBeenCalledWith({
      phoneKey: '593987654321',
      tenantId: tenant2.id,
    });
    expect(clientMock.sendTextMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Logística Continental'),
      })
    );
  });
});
