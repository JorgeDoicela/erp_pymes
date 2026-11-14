/**
 * @file whatsappMultiTenantSkills.test.js
 * @description Suite de pruebas unitarias e integración para las habilidades agénticas multi-tenant de WhatsApp:
 * - REQUEST_SALARY_ADVANCE (Decimal.js tope 50% sueldo + 2FA)
 * - REQUEST_PERMISSION (Permiso Médico, Calamidad Doméstica Art. 42.30 CT, Licencia Parental sin afectar vacaciones)
 * - REVIEW_PENDING_REQUESTS (Aprobación/Rechazo gerencial RBAC por tenantId con 2FA)
 * - PAYROLL_SLIP_QUERY, SWITCH_TENANT_COMMAND y TENANT_METRICS_QUERY enriquecido
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsappAiService } from '../../../src/modules/whatsapp/whatsappAi.service.js';
import { WhatsappConfirmationService } from '../../../src/modules/whatsapp/whatsappConfirmation.service.js';
import { WhatsappSecurityService } from '../../../src/modules/whatsapp/whatsappSecurity.service.js';
import { WhatsappSkillRegistry } from '../../../src/modules/whatsapp/skills/whatsappSkill.registry.js';
import { RequestVacationSkill } from '../../../src/modules/whatsapp/skills/requestVacation.skill.js';
import { RequestSalaryAdvanceSkill } from '../../../src/modules/whatsapp/skills/requestSalaryAdvance.skill.js';
import { RequestPermissionSkill } from '../../../src/modules/whatsapp/skills/requestPermission.skill.js';
import { ReviewPendingRequestsSkill } from '../../../src/modules/whatsapp/skills/reviewPendingRequests.skill.js';
import { WHATSAPP_INTENTS } from '../../../src/modules/whatsapp/whatsapp.constants.js';
import { WHATSAPP_SESSION_STATUS } from '../../../src/modules/whatsapp/whatsappActionSession.repository.js';

function createInMemorySessionRepo() {
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

describe('WhatsApp Multi-Tenant Agentic Skills & Queries Suite', () => {
  const tenantAlpha = { id: 'tenant-alpha', name: 'Textiles Andinos S.A.', ruc: '1790011223001' };

  const employeeAlpha = {
    id: 'emp-alpha-01',
    firstName: 'Valeria',
    lastName: 'Mendoza',
    email: 'valeria.mendoza@textiles.ec',
    identityCard: '1723456789',
    department: 'Producción',
    position: 'Supervisora',
    role: 'employee',
    phone: '0991122334',
    vacationDays: 15,
    whatsappConsent: true,
    tenantId: tenantAlpha.id,
    tenant: tenantAlpha,
  };

  const hrAlpha = {
    ...employeeAlpha,
    id: 'hr-alpha-01',
    firstName: 'Roberto',
    lastName: 'Salazar',
    email: 'roberto.hr@textiles.ec',
    identityCard: '0911223344',
    role: 'hr',
    department: 'Talento Humano',
  };

  let sessionRepo;
  let security;
  let lastSentOtp;
  let emailSenderMock;
  let auditorMock;
  let repoMock;
  let salaryAdvanceServiceMock;
  let absenceServiceMock;
  let llmProviderMock;
  let ragServiceMock;
  let aiService;

  beforeEach(() => {
    sessionRepo = createInMemorySessionRepo();
    security = new WhatsappSecurityService();
    lastSentOtp = null;

    emailSenderMock = {
      sendEmail: vi.fn(async ({ html }) => {
        const match = html.match(/>(\d{6})</);
        if (match) lastSentOtp = match[1];
        return { success: true };
      }),
    };

    auditorMock = { log: vi.fn(async () => ({})) };

    repoMock = {
      getEmployeeActiveBaseSalary: vi.fn(async () => 1000),
      getEmployeeAttendanceToday: vi.fn(async () => null),
      getTenantSummaryMetrics: vi.fn(async () => ({
        totalActiveEmployees: 24,
        activeContracts: 22,
        totalAttendancesToday: 19,
        pendingAbsenceRequests: 2,
        pendingSalaryAdvances: 1,
      })),
      getEmployeeLatestPayrollAndRequests: vi.fn(async () => ({
        latestPayrollDetail: {
          baseSalary: 1000,
          workedDays: 30,
          overtimeAmount: 45.5,
          netSalary: 951.0,
          payroll: { period: new Date('2026-10-01T00:00:00Z'), status: 'PAID' },
        },
        recentAbsences: [
          {
            id: 'abs-01',
            type: 'Permiso Médico',
            startDate: new Date('2026-10-15T12:00:00Z'),
            endDate: new Date('2026-10-15T12:00:00Z'),
            status: 'APPROVED',
          },
        ],
        recentAdvances: [
          {
            id: 'adv-01',
            amount: 200,
            installments: 2,
            status: 'PENDING',
          },
        ],
      })),
      getPendingTenantRequestsForReview: vi.fn(async () => ({
        pendingAbsences: [
          {
            id: 'abs-pend-1',
            type: 'Vacaciones',
            startDate: new Date('2026-12-01T12:00:00Z'),
            endDate: new Date('2026-12-05T12:00:00Z'),
            reason: 'Viaje familiar',
            employee: { id: 'emp-1', firstName: 'Carlos', lastName: 'Vega', department: 'Ventas' },
          },
        ],
        pendingAdvances: [
          {
            id: 'adv-pend-2',
            amount: 300,
            installments: 2,
            reason: 'Reparacion vehicular',
            employee: {
              id: 'emp-2',
              firstName: 'Lucia',
              lastName: 'Paredes',
              department: 'Operaciones',
            },
          },
        ],
      })),
    };

    salaryAdvanceServiceMock = {
      requestAdvance: vi.fn(async ({ employeeId, amount, installments, reason }) => ({
        id: 'adv-created-99',
        employeeId,
        amount,
        installments,
        monthlyDeduction: amount / installments,
        reason,
        status: 'PENDING',
      })),
      approveAdvance: vi.fn(async (id, adminId) => ({
        id,
        status: 'APPROVED',
        approvedBy: adminId,
      })),
      rejectAdvance: vi.fn(async (id, reason) => ({
        id,
        status: 'REJECTED',
        rejectionReason: reason,
      })),
    };

    absenceServiceMock = {
      validateVacationDraft: vi.fn(),
      createRequest: vi.fn(async (data) => ({
        id: 'perm-created-77',
        ...data,
        status: 'PENDING',
      })),
      updateRequestStatus: vi.fn(async ({ id, status, adminComment }) => ({
        id,
        status,
        adminComment,
      })),
    };

    llmProviderMock = {
      generateChatCompletion: vi.fn(async () => {
        throw new Error('LLM offline - force deterministic parser');
      }),
    };

    ragServiceMock = {
      processQuery: vi.fn(async () => ({
        answer: 'Respuesta legal verificada.',
        legalCitations: [],
      })),
    };

    const confirmationService = new WhatsappConfirmationService(
      sessionRepo,
      security,
      emailSenderMock,
      auditorMock
    );

    const skillRegistry = new WhatsappSkillRegistry([
      new RequestVacationSkill(absenceServiceMock, llmProviderMock),
      new RequestSalaryAdvanceSkill(salaryAdvanceServiceMock, repoMock, llmProviderMock),
      new RequestPermissionSkill(absenceServiceMock, llmProviderMock),
      new ReviewPendingRequestsSkill(absenceServiceMock, salaryAdvanceServiceMock, repoMock),
    ]);

    aiService = new WhatsappAiService(
      llmProviderMock,
      ragServiceMock,
      repoMock,
      confirmationService,
      skillRegistry,
      sessionRepo
    );
  });

  it('clasifica correctamente las nuevas intenciones agénticas y consultas multi-tenant sin confundirlas con consultas legales', () => {
    expect(
      aiService.classifyIntent(
        'Solicito un anticipo de $300 a 2 cuotas por emergencia',
        employeeAlpha
      )
    ).toBe(WHATSAPP_INTENTS.SALARY_ADVANCE_ACTION);

    expect(
      aiService.classifyIntent(
        'Quiero pedir permiso medico para el 2026-11-25 por cita IESS',
        employeeAlpha
      )
    ).toBe(WHATSAPP_INTENTS.PERMISSION_REQUEST_ACTION);

    expect(
      aiService.classifyIntent(
        'Necesito reportar calamidad domestica del 2026-11-20 al 2026-11-22',
        employeeAlpha
      )
    ).toBe(WHATSAPP_INTENTS.PERMISSION_REQUEST_ACTION);

    expect(aiService.classifyIntent('Revisar solicitudes pendientes de mi empresa', hrAlpha)).toBe(
      WHATSAPP_INTENTS.REVIEW_REQUESTS_ACTION
    );

    expect(
      aiService.classifyIntent('Como salio mi ultimo rol de pagos y mis solicitudes', employeeAlpha)
    ).toBe(WHATSAPP_INTENTS.PAYROLL_SLIP_QUERY);

    expect(aiService.classifyIntent('cambiar empresa', employeeAlpha)).toBe(
      WHATSAPP_INTENTS.SWITCH_TENANT_COMMAND
    );

    // Consulta legal explícita sobre calamidad doméstica debe ir a LEGAL_QUERY
    expect(
      aiService.classifyIntent(
        'Que dice el Codigo del Trabajo sobre calamidad domestica',
        employeeAlpha
      )
    ).toBe(WHATSAPP_INTENTS.LEGAL_QUERY);
  });

  it('REQUEST_SALARY_ADVANCE: rechaza anticipo cuando la cuota mensual supera el 50% del sueldo base del colaborador en su tenant', async () => {
    // Sueldo base = $1000 -> Tope mensual 50% = $500. Solicita $700 a 1 cuota ($700/mes > $500/mes)
    const reply = await aiService.generateResponse({
      text: 'Quiero solicitar un anticipo de $700 a 1 cuota por compra de equipo',
      employee: employeeAlpha,
      phoneKey: '593991122334',
      messageId: 'wamid.adv.reject',
    });

    expect(reply).toContain('No es posible procesar su solicitud de anticipo');
    expect(reply).toContain('$700.00');
    expect(reply).toContain('$500.00');
    expect(salaryAdvanceServiceMock.requestAdvance).not.toHaveBeenCalled();
  });

  it('REQUEST_SALARY_ADVANCE: ejecuta flujo completo de anticipo con cálculo Decimal.js y doble confirmación 2FA', async () => {
    // Solicita $400 a 2 cuotas ($200/mes <= $500/mes)
    const draftReply = await aiService.generateResponse({
      text: 'Solicito un anticipo de $400 en 2 cuotas por gastos medicos familiares',
      employee: employeeAlpha,
      phoneKey: '593991122334',
      messageId: 'wamid.adv.draft',
    });

    expect(draftReply).toContain('*Resumen de Solicitud de Anticipo de Sueldo*');
    expect(draftReply).toContain('$400.00');
    expect(draftReply).toContain('2 cuota(s)');
    expect(draftReply).toContain('$200.00');
    expect(lastSentOtp).toMatch(/^\d{6}$/);

    // Confirmar con cédula completa (1723456789) + OTP enviado por correo
    const confirmReply = await aiService.generateResponse({
      text: `CONFIRMAR 1723456789 ${lastSentOtp}`,
      employee: employeeAlpha,
      phoneKey: '593991122334',
      messageId: 'wamid.adv.confirm',
    });

    expect(confirmReply).toContain('*Solicitud de Anticipo Registrada*');
    expect(confirmReply).toContain('adv-created-99');
    expect(salaryAdvanceServiceMock.requestAdvance).toHaveBeenCalledWith({
      employeeId: employeeAlpha.id,
      amount: 400,
      installments: 2,
      reason: 'gastos medicos familiares',
    });
  });

  it('REQUEST_PERMISSION: registra permiso médico / calamidad doméstica con 2FA sin descontar vacaciones', async () => {
    const draftReply = await aiService.generateResponse({
      text: 'Quiero pedir permiso medico para el 2026-11-28 por cita medica en el IESS',
      employee: employeeAlpha,
      phoneKey: '593991122334',
      messageId: 'wamid.perm.draft',
    });

    expect(draftReply).toContain('*Resumen de Solicitud de Permiso Médico*');
    expect(draftReply).toContain('0 dias (No descuenta de su saldo de vacaciones)');
    expect(lastSentOtp).toMatch(/^\d{6}$/);

    const confirmReply = await aiService.generateResponse({
      text: `CONFIRMAR 1723456789 ${lastSentOtp}`,
      employee: employeeAlpha,
      phoneKey: '593991122334',
      messageId: 'wamid.perm.confirm',
    });

    expect(confirmReply).toContain('*Solicitud de Permiso Médico Registrada*');
    expect(absenceServiceMock.createRequest).toHaveBeenCalledWith({
      employeeId: employeeAlpha.id,
      tenantId: tenantAlpha.id,
      type: 'Permiso Médico',
      startDate: '2026-11-28',
      endDate: '2026-11-28',
      reason: 'cita medica en el IESS',
      allowPastDates: true,
    });
  });

  it('REVIEW_PENDING_REQUESTS: bloquea por RBAC a colaboradores sin rol directivo y permite a RRHH/Admin aprobar con 2FA', async () => {
    // 1. Intento de colaborador normal -> Bloqueado por RBAC
    const unauthorizedReply = await aiService.generateResponse({
      text: 'Revisar solicitudes pendientes',
      employee: employeeAlpha,
      phoneKey: '593991122334',
      messageId: 'wamid.rev.unauth',
    });
    expect(unauthorizedReply).toContain('Acceso denegado');

    // 2. RRHH solicita revisar pendientes -> Lista numerada del tenant
    const listReply = await aiService.generateResponse({
      text: 'Revisar solicitudes pendientes',
      employee: hrAlpha,
      phoneKey: '593987654321',
      messageId: 'wamid.rev.list',
    });
    expect(listReply).toContain('*Solicitudes Pendientes en Textiles Andinos S.A.:*');
    expect(listReply).toContain('Carlos Vega');
    expect(listReply).toContain('Lucia Paredes');

    // 3. RRHH selecciona aprobar la solicitud #2 (Anticipo de Lucia Paredes)
    const draftApproveReply = await aiService.generateResponse({
      text: 'Aprobar 2 por flujo de caja disponible',
      employee: hrAlpha,
      phoneKey: '593987654321',
      messageId: 'wamid.rev.select',
    });
    expect(draftApproveReply).toContain('*Resumen de Resolucion Gerencial (APROBAR)*');
    expect(draftApproveReply).toContain('Lucia Paredes');
    expect(lastSentOtp).toMatch(/^\d{6}$/);

    // 4. RRHH confirma con su cédula completa (0911223344) + OTP
    const finalApproveReply = await aiService.generateResponse({
      text: `CONFIRMAR 0911223344 ${lastSentOtp}`,
      employee: hrAlpha,
      phoneKey: '593987654321',
      messageId: 'wamid.rev.confirm',
    });
    expect(finalApproveReply).toContain('*Resolucion Registrada Exitosamente*');
    expect(salaryAdvanceServiceMock.approveAdvance).toHaveBeenCalledWith(
      'adv-pend-2',
      hrAlpha.id,
      tenantAlpha.id
    );
  });

  it('responde consultas de último rol de pagos (PAYROLL_SLIP_QUERY) y métricas enriquecidas del tenant', async () => {
    const payrollReply = await aiService.generateResponse({
      text: 'Quiero ver mi ultimo rol de pagos y mis solicitudes',
      employee: employeeAlpha,
      phoneKey: '593991122334',
    });
    expect(payrollReply).toContain('*Ultimo Rol de Pagos (2026-10):*');
    expect(payrollReply).toContain('*$951.00*');
    expect(payrollReply).toContain('Permiso Médico');
    expect(payrollReply).toContain('$200.00 (2 cuota(s)): *PENDING*');

    const metricsReply = await aiService.generateResponse({
      text: 'Metricas de la empresa',
      employee: hrAlpha,
      phoneKey: '593987654321',
    });
    expect(metricsReply).toContain('*Contratos Vigentes:* 22');
    expect(metricsReply).toContain('*Anticipos de Sueldo por Aprobar:* 1');
  });
});
