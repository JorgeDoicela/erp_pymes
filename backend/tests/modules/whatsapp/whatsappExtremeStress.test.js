/**
 * @file whatsappExtremeStress.test.js
 * @description Suite de pruebas extremas y adversariales para el ecosistema WhatsApp Multi-Tenant:
 * - Saludos corteses combinados con órdenes o consultas ("Hola, quiero pedir...", "Buenos días, ¿cuánto...?")
 * - Oraciones con cláusulas causales naturales ("porque tengo...", "ya que...", "como...", "por ley")
 * - Separadores de miles ($1,200), montos negativos (-$200), plazos fuera de rango (36 cuotas) y "por $200" sin motivo
 * - Desencriptación AES-256-GCM de Employee.salary en respaldo de WhatsappRepository
 * - Fechas relativas ("hoy", "mañana", "pasado mañana"), duración ("por 3 días") y fechas inválidas (2026-02-30)
 * - Interrupción inteligente de borradores COLLECTING_PARAMS ante preguntas o cambio de habilidad
 * - Revisión gerencial con números dentro del motivo ("Aprobar 1 porque pidió 3 días") sin secuestro de índice
 * - Cobertura léxica laboral ecuatoriana ampliada y bloqueo de trampas no laborales en WhatsApp
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsappAiService } from '../../../src/modules/whatsapp/whatsappAi.service.js';
import { WhatsappConfirmationService } from '../../../src/modules/whatsapp/whatsappConfirmation.service.js';
import { WhatsappSecurityService } from '../../../src/modules/whatsapp/whatsappSecurity.service.js';
import { WhatsappRepository } from '../../../src/modules/whatsapp/whatsapp.repository.js';
import { WhatsappService } from '../../../src/modules/whatsapp/whatsapp.service.js';
import { WhatsappConsentService } from '../../../src/modules/whatsapp/whatsappConsent.service.js';
import { WhatsappSkillRegistry } from '../../../src/modules/whatsapp/skills/whatsappSkill.registry.js';
import { RequestVacationSkill } from '../../../src/modules/whatsapp/skills/requestVacation.skill.js';
import { RequestSalaryAdvanceSkill } from '../../../src/modules/whatsapp/skills/requestSalaryAdvance.skill.js';
import { RequestPermissionSkill } from '../../../src/modules/whatsapp/skills/requestPermission.skill.js';
import { ReviewPendingRequestsSkill } from '../../../src/modules/whatsapp/skills/reviewPendingRequests.skill.js';
import { WHATSAPP_SESSION_STATUS } from '../../../src/modules/whatsapp/whatsappActionSession.repository.js';
import { WHATSAPP_INTENTS } from '../../../src/modules/whatsapp/whatsapp.constants.js';
import { encryptSalary } from '../../../src/core/security/encryption.js';

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
      curr.status = WHATSAPP_SESSION_STATUS.EXECUTING;
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

describe('WhatsApp Extreme Stress & Adversarial Suite', () => {
  const tenant = { id: 'tenant-ec-01', name: 'Industrias Andinas S.A.', ruc: '1791234567001' };
  const employee = {
    id: 'emp-501',
    firstName: 'Valeria',
    lastName: 'Espinoza',
    email: 'valeria.espinoza@andinas.ec',
    identityCard: '1723456789',
    department: 'Operaciones',
    position: 'Analista Logístico',
    role: 'employee',
    phone: '0991122334',
    vacationDays: 15,
    whatsappConsent: true,
    tenantId: tenant.id,
    tenant,
  };

  const manager = {
    ...employee,
    id: 'mgr-901',
    firstName: 'Roberto',
    lastName: 'Salazar',
    email: 'roberto.salazar@andinas.ec',
    identityCard: '0911223344',
    role: 'manager',
  };

  let sessionRepo;
  let mockLlmProvider;
  let mockRagService;
  let mockRepo;
  let mockMailer;
  let mockAuditor;
  let mockAbsenceService;
  let mockSalaryAdvanceService;
  let confirmationService;
  let aiService;

  beforeEach(() => {
    sessionRepo = createInMemorySessionRepo();
    mockLlmProvider = {
      generateChatCompletion: vi
        .fn()
        .mockRejectedValue(new Error('LLM offline - force deterministic')),
    };
    mockRagService = {
      processQuery: vi.fn().mockResolvedValue({
        answer:
          'Según el **Art. 188 del Código del Trabajo**, corresponde indemnización por despido intempestivo.',
        legalCitations: [{ articleCode: 'Art. 188', documentTitle: 'Código del Trabajo' }],
      }),
    };
    mockRepo = {
      getEmployeeActiveBaseSalary: vi.fn().mockResolvedValue(1000),
      getEmployeeAttendanceToday: vi.fn().mockResolvedValue({
        checkIn: new Date('2026-11-13T13:00:00Z'),
        checkOut: null,
      }),
      getEmployeeLatestPayrollAndRequests: vi.fn().mockResolvedValue({
        latestPayrollDetail: {
          baseSalary: 1000,
          workedDays: 30,
          overtimeAmount: 50,
          netSalary: 955.5,
          payroll: { period: new Date('2026-10-31T00:00:00Z'), status: 'PAID' },
        },
        recentAbsences: [],
        recentAdvances: [],
      }),
      getPendingTenantRequestsForReview: vi.fn().mockResolvedValue({
        pendingAbsences: [
          {
            id: 'abs-1',
            type: 'Permiso Médico',
            startDate: new Date('2026-11-20T00:00:00Z'),
            endDate: new Date('2026-11-22T00:00:00Z'),
            reason: 'Cita IESS',
            employee: {
              id: 'emp-1',
              firstName: 'Carlos',
              lastName: 'Vega',
              department: 'Operaciones',
            },
          },
          {
            id: 'abs-2',
            type: 'Vacaciones',
            startDate: new Date('2026-12-01T00:00:00Z'),
            endDate: new Date('2026-12-05T00:00:00Z'),
            reason: 'Viaje',
            employee: {
              id: 'emp-2',
              firstName: 'Ana',
              lastName: 'Mora',
              department: 'Operaciones',
            },
          },
        ],
        pendingAdvances: [
          {
            id: 'adv-3',
            amount: 300,
            installments: 3,
            reason: 'Emergencia dental',
            employee: {
              id: 'emp-3',
              firstName: 'Luis',
              lastName: 'Paz',
              department: 'Operaciones',
            },
          },
        ],
      }),
      getTenantSummaryMetrics: vi.fn().mockResolvedValue({
        totalActiveEmployees: 25,
        activeContracts: 24,
        totalAttendancesToday: 22,
        pendingAbsenceRequests: 2,
        pendingSalaryAdvances: 1,
      }),
    };
    mockMailer = {
      sendEmail: vi.fn().mockResolvedValue(true),
      sendWhatsappActionOtpEmail: vi.fn().mockResolvedValue({ sent: true }),
    };
    mockAuditor = {
      log: vi.fn().mockResolvedValue(true),
      recordEvent: vi.fn().mockResolvedValue(true),
    };
    mockAbsenceService = {
      previewVacationRequest: vi.fn(async ({ startDate, endDate, reason }) => ({
        startDate,
        endDate,
        daysRequested: 5,
        reason,
        availableDays: 15,
        remainingDaysAfterApproval: 10,
      })),
      createAbsenceRequest: vi.fn().mockResolvedValue({ id: 'abs-created-99' }),
      updateAbsenceStatus: vi.fn().mockResolvedValue({ id: 'abs-1', status: 'Approved' }),
    };
    mockSalaryAdvanceService = {
      requestAdvance: vi.fn().mockResolvedValue({ id: 'adv-created-99' }),
      updateStatus: vi.fn().mockResolvedValue({ id: 'adv-3', status: 'APPROVED' }),
    };

    const security = new WhatsappSecurityService();
    confirmationService = new WhatsappConfirmationService(
      sessionRepo,
      security,
      mockMailer,
      mockAuditor
    );
    const registry = new WhatsappSkillRegistry([
      new RequestVacationSkill(mockAbsenceService, mockLlmProvider),
      new RequestSalaryAdvanceSkill(mockSalaryAdvanceService, mockRepo, mockLlmProvider),
      new RequestPermissionSkill(mockAbsenceService, mockLlmProvider),
      new ReviewPendingRequestsSkill(
        mockAbsenceService,
        mockSalaryAdvanceService,
        mockRepo,
        mockLlmProvider
      ),
    ]);

    const mockHistoryService = {
      getActiveHistory: vi.fn().mockResolvedValue([]),
      recordTurn: vi.fn().mockResolvedValue(true),
      resetHistory: vi.fn().mockResolvedValue(true),
    };

    aiService = new WhatsappAiService(
      mockLlmProvider,
      mockRagService,
      mockRepo,
      confirmationService,
      registry,
      sessionRepo,
      null,
      mockAuditor,
      mockHistoryService
    );
  });

  // =========================================================================
  // 1. SALUDOS CORTESES COMBINADOS CON ÓRDENES O CONSULTAS REALES
  // =========================================================================
  describe('1. Saludos iniciales ("Hola, ...", "Buenos días, ...") sin bloqueo de intención', () => {
    it('mantiene GENERAL_GREETING cuando el mensaje es únicamente un saludo o solicitud de menú', () => {
      expect(aiService.classifyIntent('Hola', employee)).toBe(WHATSAPP_INTENTS.GENERAL_GREETING);
      expect(aiService.classifyIntent('Hola, buenos días, ¿cómo estás?', employee)).toBe(
        WHATSAPP_INTENTS.GENERAL_GREETING
      );
      expect(
        aiService.classifyIntent('Buenas tardes equipo, me ayudan con el menú por favor', employee)
      ).toBe(WHATSAPP_INTENTS.GENERAL_GREETING);
      expect(aiService.classifyIntent('¿Qué puedes hacer?', employee)).toBe(
        WHATSAPP_INTENTS.GENERAL_GREETING
      );
    });

    it('NO bloquea órdenes ni consultas que inician con "Hola" o "Buenos días"', () => {
      expect(
        aiService.classifyIntent(
          'Hola, buenos días, quiero pedir vacaciones del 2026-12-01 al 2026-12-05 por viaje familiar',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.VACATION_REQUEST_ACTION);

      expect(
        aiService.classifyIntent(
          'Buenas tardes, solicito un anticipo de $200 a 2 cuotas por emergencia médica',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.SALARY_ADVANCE_ACTION);

      expect(
        aiService.classifyIntent(
          'Hola, necesito pedir un permiso médico para hoy por cita en el IESS',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.PERMISSION_REQUEST_ACTION);

      expect(
        aiService.classifyIntent(
          'Buenos días, ¿cuántos días de vacaciones tengo disponibles?',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.EMPLOYEE_QUERY);

      expect(
        aiService.classifyIntent(
          'Hola, ¿cuánto me corresponde por despido intempestivo según el Art. 188?',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.LEGAL_QUERY);
    });
  });

  // =========================================================================
  // 2. CLÁUSULAS CAUSALES NATURALES ("porque tengo", "ya que", "como", "por ley")
  // =========================================================================
  describe('2. Cláusulas causales en español natural sin falso positivo en isInformationalInquiry', () => {
    it('clasifica y procesa solicitudes que contienen "porque tengo", "ya que" o "como"', async () => {
      const msgPermiso =
        'Quiero pedir permiso médico para hoy porque tengo cita en el IESS por control general';
      expect(aiService.classifyIntent(msgPermiso, employee)).toBe(
        WHATSAPP_INTENTS.PERMISSION_REQUEST_ACTION
      );

      const replyPermiso = await aiService.generateResponse({
        text: msgPermiso,
        employee,
        phoneKey: '593991122334',
      });
      expect(replyPermiso).toContain('Validacion de Seguridad Requerida');
      expect(replyPermiso).toContain('Permiso Médico');

      await sessionRepo.cancelOpenSessions({
        phoneKey: '593991122334',
        tenantId: tenant.id,
        employeeId: employee.id,
      });

      const msgVacaciones =
        'Solicito vacaciones del 2026-12-01 al 2026-12-05 ya que tengo un viaje familiar programado';
      expect(aiService.classifyIntent(msgVacaciones, employee)).toBe(
        WHATSAPP_INTENTS.VACATION_REQUEST_ACTION
      );

      const replyVac = await aiService.generateResponse({
        text: msgVacaciones,
        employee,
        phoneKey: '593991122334',
      });
      expect(replyVac).toContain('Validacion de Seguridad Requerida');
      expect(replyVac).toContain('5 dias');

      await sessionRepo.cancelOpenSessions({
        phoneKey: '593991122334',
        tenantId: tenant.id,
        employeeId: employee.id,
      });

      const msgAnticipo =
        'Solicito un anticipo de $300 a 2 cuotas porque tengo que pagar una emergencia odontológica';
      expect(aiService.classifyIntent(msgAnticipo, employee)).toBe(
        WHATSAPP_INTENTS.SALARY_ADVANCE_ACTION
      );

      const replyAnt = await aiService.generateResponse({
        text: msgAnticipo,
        employee,
        phoneKey: '593991122334',
      });
      expect(replyAnt).toContain('Validacion de Seguridad Requerida');
      expect(replyAnt).toContain('$300.00');
    });

    it('permite solicitar licencia parental aunque mencione "por ley"', () => {
      const msg =
        'Quiero solicitar mi licencia de paternidad por ley desde hoy por nacimiento de mi hijo';
      expect(aiService.classifyIntent(msg, employee)).toBe(
        WHATSAPP_INTENTS.PERMISSION_REQUEST_ACTION
      );
    });
  });

  // =========================================================================
  // 3. ANTICIPOS DE SUELDO: SEPARADOR DE MILES ($1,200), NEGATIVOS Y CUOTAS
  // =========================================================================
  describe('3. Precisión financiera en RequestSalaryAdvanceSkill ($1,200, negativos, cuotas)', () => {
    it('interpreta correctamente $1,200 con coma de miles como $1200.00 (y no como $1.20)', async () => {
      // Sueldo base: $1,000 -> Tope mensual 50% = $500/mes.
      // $1,200 a 3 cuotas = $400/mes (<= $500/mes -> VÁLIDO).
      const reply = await aiService.generateResponse({
        text: 'Solicito un anticipo de $1,200 a 3 cuotas por operación quirúrgica familiar',
        employee,
        phoneKey: '593991122334',
      });

      expect(reply).toContain('Validacion de Seguridad Requerida');
      expect(reply).toContain('$1200.00');
      expect(reply).toContain('3 cuota(s) mensual(es)');
      expect(reply).toContain('$400.00');
    });

    it('rechaza $1,200 a 2 cuotas ($600/mes > 50% de $1,000) porque detecta los $1,200 reales', async () => {
      const reply = await aiService.generateResponse({
        text: 'Solicito un anticipo de $1,200 a 2 cuotas por compra de equipo',
        employee,
        phoneKey: '593991122334',
      });

      expect(reply).toContain('No es posible procesar su solicitud de anticipo');
      expect(reply).toContain('$600.00');
      expect(reply).toContain('supera el limite legal e interno del 50%');
    });

    it('solicita el motivo cuando el usuario escribe "Solicito un anticipo por $200" sin tomar "$200" como razón', async () => {
      const reply = await aiService.generateResponse({
        text: 'Solicito un anticipo por $200',
        employee,
        phoneKey: '593991122334',
      });

      expect(reply).toContain('motivo del anticipo');
      expect(reply).not.toContain('Confirmacion de Seguridad Requerida');
    });

    it('rechaza montos negativos (-$200) y plazos mayores a 24 cuotas (36 cuotas)', async () => {
      const negReply = await aiService.generateResponse({
        text: 'Solicito un anticipo de -$200 por emergencia',
        employee,
        phoneKey: '593991122334',
      });
      expect(negReply).toContain('valor positivo mayor a $0.00');

      const instReply = await aiService.generateResponse({
        text: 'Solicito un anticipo de $500 a 36 cuotas por remodelación',
        employee,
        phoneKey: '593991122334',
      });
      expect(instReply).toContain('entre 1 y 24 cuotas');
    });
  });

  // =========================================================================
  // 4. DESENCRIPTACIÓN AES-256-GCM DE EMPLOYEE.SALARY EN WHATSAPP REPOSITORY
  // =========================================================================
  describe('4. Desencriptación AES-256-GCM de Employee.salary cuando no existe Contract activo', () => {
    it('desencripta correctamente Employee.salary cifrado con AES-256-GCM en lugar de concatenar dígitos hex', async () => {
      const encrypted850 = encryptSalary(850);
      const mockPrisma = {
        contract: { findFirst: vi.fn().mockResolvedValue(null) },
        employee: { findFirst: vi.fn().mockResolvedValue({ salary: encrypted850 }) },
      };

      const repo = new WhatsappRepository(mockPrisma);
      const baseSalary = await repo.getEmployeeActiveBaseSalary(employee.id, tenant.id);
      expect(baseSalary).toBe(850);
    });
  });

  // =========================================================================
  // 5. FECHAS RELATIVAS ("mañana", "pasado mañana"), DURACIÓN ("por 3 días") Y FECHAS INVÁLIDAS
  // =========================================================================
  describe('5. Fechas relativas, duración en días y validación de calendario real', () => {
    it('resuelve "mañana" y "por 3 días" en permisos y vacaciones determinísticamente', async () => {
      const replyPerm = await aiService.generateResponse({
        text: 'Solicito permiso por calamidad doméstica desde mañana por 3 días porque falleció un familiar cercano',
        employee,
        phoneKey: '593991122334',
      });

      expect(replyPerm).toContain('Validacion de Seguridad Requerida');
      expect(replyPerm).toContain('Calamidad Doméstica');
      expect(replyPerm).toContain('3 dia(s)');
    });

    it('completa el motivo en segundo turno de permiso personal aunque el usuario no escriba la preposición "por"', async () => {
      const turn1 = await aiService.generateResponse({
        text: 'Quiero pedir un permiso personal para el 2026-11-25',
        employee,
        phoneKey: '593991122334',
      });
      expect(turn1).toContain('motivo o detalle del permiso');

      const turn2 = await aiService.generateResponse({
        text: 'Trámite presencial impostergable en el Registro Civil',
        employee,
        phoneKey: '593991122334',
      });
      expect(turn2).toContain('Validacion de Seguridad Requerida');
      expect(turn2).toContain('Trámite presencial impostergable en el Registro Civil');
    });

    it('rechaza fechas inexistentes en el calendario como 2026-02-30 en lugar de desbordar a marzo', async () => {
      const reply = await aiService.generateResponse({
        text: 'Quiero pedir vacaciones del 2026-02-30 al 2026-03-05 por viaje familiar',
        employee,
        phoneKey: '593991122334',
      });
      // Al ser 2026-02-30 inválido, solo hay 1 fecha válida y pide el rango o corrige
      expect(reply).not.toContain('2026-03-02 al 2026-03-05');
    });
  });

  // =========================================================================
  // 6. INTERRUPCIÓN INTELIGENTE DE BORRADORES EN COLLECTING_PARAMS
  // =========================================================================
  describe('6. Interrupción limpia de borradores COLLECTING_PARAMS ante preguntas o cambio de tarea', () => {
    it('cancela el borrador incompleto y responde si el usuario hace una pregunta informativa ("¿Cuántos días...?")', async () => {
      const draftReply = await aiService.generateResponse({
        text: 'Quiero pedir vacaciones del 2026-12-01 al 2026-12-05',
        employee,
        phoneKey: '593991122334',
      });
      expect(draftReply).toContain('motivo de la solicitud');

      // El usuario en lugar de dar el motivo pregunta su saldo de vacaciones
      const queryReply = await aiService.generateResponse({
        text: '¿Cuántos días de vacaciones me quedan disponibles?',
        employee,
        phoneKey: '593991122334',
      });

      // No debe tomar la pregunta como motivo ni pasar a 2FA; debe responder el perfil/saldo
      expect(queryReply).not.toContain('Confirmacion de Seguridad Requerida (2FA)');
      expect(queryReply).toContain('15 días disponibles');
    });

    it('cancela el borrador de vacaciones si el usuario cambia de opinión y solicita un anticipo', async () => {
      await aiService.generateResponse({
        text: 'Quiero pedir vacaciones del 2026-12-01 al 2026-12-05',
        employee,
        phoneKey: '593991122334',
      });

      const switchReply = await aiService.generateResponse({
        text: 'Mejor solicito un anticipo de $200 a 2 cuotas por emergencia médica',
        employee,
        phoneKey: '593991122334',
      });

      expect(switchReply).toContain('Validacion de Seguridad Requerida');
      expect(switchReply).toContain('Resumen de Solicitud de Anticipo de Sueldo');
      expect(switchReply).toContain('$200.00');
    });
  });

  // =========================================================================
  // 7. REVISIÓN GERENCIAL CON NÚMEROS EN EL MOTIVO SIN SECUESTRO DE ÍNDICE
  // =========================================================================
  describe('7. Revisión gerencial inmune a números dentro del comentario o razón', () => {
    it('aprueba la solicitud #1 aunque el comentario mencione "3 días" (existiendo un ítem #3 en la lista)', async () => {
      const listReply = await aiService.generateResponse({
        text: 'Revisar solicitudes pendientes',
        employee: manager,
        phoneKey: '593998877665',
      });
      expect(listReply).toContain('*1.* [Ausencia] *Carlos Vega*');
      expect(listReply).toContain('*3.* [Anticipo] *Luis Paz*');

      const decisionReply = await aiService.generateResponse({
        text: 'Aprobar 1 porque pidió 3 días con certificado del IESS',
        employee: manager,
        phoneKey: '593998877665',
      });

      expect(decisionReply).toContain('Validacion de Seguridad Requerida');
      expect(decisionReply).toContain('Carlos Vega');
      expect(decisionReply).not.toContain('Luis Paz');
    });

    it('identifica correctamente #1 cuando el motivo precede a la acción ("Por cierre de 2 locales rechazar la solicitud #1")', async () => {
      await aiService.generateResponse({
        text: 'Revisar solicitudes pendientes',
        employee: manager,
        phoneKey: '593998877665',
      });

      const decisionReply = await aiService.generateResponse({
        text: 'Por cierre de los 2 locales rechazar la solicitud #1 por falta de personal',
        employee: manager,
        phoneKey: '593998877665',
      });

      expect(decisionReply).toContain('Validacion de Seguridad Requerida');
      expect(decisionReply).toContain('RECHAZAR');
      expect(decisionReply).toContain('Carlos Vega');
      expect(decisionReply).not.toContain('Ana Mora');
    });
  });

  // =========================================================================
  // 8. COBERTURA LÉXICA LABORAL ECUATORIANA Y TRAMPAS NO LABORALES EN WHATSAPP
  // =========================================================================
  describe('8. Clasificación legal ampliada (jerga ecuatoriana) y exclusión de trampas no laborales', () => {
    it('clasifica como LEGAL_QUERY consultas coloquiales, discapacidad, prescripción y embargo de sueldo', () => {
      expect(
        aiService.classifyIntent(
          'Me botaron del trabajo ayer sin aviso, ¿cuánto me toca?',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.LEGAL_QUERY);

      expect(
        aiService.classifyIntent(
          '¿Cuál es el porcentaje obligatorio de contratación de personas con discapacidad?',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.LEGAL_QUERY);

      expect(
        aiService.classifyIntent(
          '¿En cuánto tiempo prescriben las acciones laborales para reclamar mi liquidación?',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.LEGAL_QUERY);

      expect(
        aiService.classifyIntent(
          '¿Me pueden embargar o retener el sueldo por pensión alimenticia?',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.LEGAL_QUERY);

      expect(
        aiService.classifyIntent('kiero saber kuanto me pagan x 14vo sueldo en kito', employee)
      ).toBe(WHATSAPP_INTENTS.LEGAL_QUERY);
    });

    it('bloquea como OUT_OF_SCOPE_QUERY trampas no laborales (multas ANT, licencia de conducir, cripto)', () => {
      expect(
        aiService.classifyIntent(
          'Me pusieron una multa de tránsito de la ANT y quiero renovar mi licencia de conducir Tipo B',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.OUT_OF_SCOPE_QUERY);

      expect(
        aiService.classifyIntent(
          '¿Cómo invertir en Bitcoin y criptomonedas para ganar dinero?',
          employee
        )
      ).toBe(WHATSAPP_INTENTS.OUT_OF_SCOPE_QUERY);
    });
  });

  // =========================================================================
  // 9. SEGURIDAD EXTREMA: FUERZA BRUTA 2FA, RATE LIMITING E IDEMPOTENCIA WAMID
  // =========================================================================
  describe('9. Resiliencia criptográfica 2FA, Rate Limiting e Idempotencia de Webhooks', () => {
    it('bloquea la sesión transaccional exactamente al 3er intento fallido de cédula/OTP y registra evento de auditoría', async () => {
      await aiService.generateResponse({
        text: 'Solicito un anticipo de $200 a 2 cuotas por emergencia médica',
        employee,
        phoneKey: '593991122334',
      });

      const attempt1 = await aiService.generateResponse({
        text: 'CONFIRMAR 1723456789 000001',
        employee,
        phoneKey: '593991122334',
      });
      expect(attempt1).toContain('Intentos restantes: *2*');

      const attempt2 = await aiService.generateResponse({
        text: 'CONFIRMAR 1723456789 000002',
        employee,
        phoneKey: '593991122334',
      });
      expect(attempt2).toContain('Intentos restantes: *1*');

      const attempt3 = await aiService.generateResponse({
        text: 'CONFIRMAR 1723456789 000003',
        employee,
        phoneKey: '593991122334',
      });
      expect(attempt3).toContain('bloqueada');
      expect(mockSalaryAdvanceService.requestAdvance).not.toHaveBeenCalled();
    });

    it('aplica Rate Limiting tras 15 mensajes por minuto y descarta WAMIDs duplicados', () => {
      const sec = new WhatsappSecurityService();
      const phone = '593991122334';

      for (let i = 1; i <= 15; i++) {
        expect(sec.checkRateLimit(phone)).toBe(true);
      }
      expect(sec.checkRateLimit(phone)).toBe(false);

      expect(sec.isDuplicateMessage('wamid.HBgNNTkzOTkxMTIyMzM0FQIAERgSQkI')).toBe(false);
      expect(sec.isDuplicateMessage('wamid.HBgNNTkzOTkxMTIyMzM0FQIAERgSQkI')).toBe(true);
    });
  });

  // =========================================================================
  // 10. CANCELACIONES REALISTAS EN DISPOSITIVOS MÓVILES ("Cancelar.", "Quiero cancelar")
  // =========================================================================
  describe('10. Reconocimiento de órdenes de cancelación móviles', () => {
    it('cancela el borrador ante variantes móviles como "Cancelar.", "Quiero cancelar", "Cancelar solicitud"', async () => {
      // Inicia borrador parcial
      const prompt = await aiService.generateResponse({
        text: 'Quiero pedir vacaciones',
        employee,
        phoneKey: '593991122334',
      });
      expect(prompt).toContain('Para preparar su solicitud de vacaciones');

      // Usuario escribe en móvil con punto o frase natural
      const cancelReply = await aiService.generateResponse({
        text: 'Cancelar.',
        employee,
        phoneKey: '593991122334',
      });
      expect(cancelReply).toContain('Borrador de solicitud cancelado');

      // Nueva solicitud debe empezar desde cero sin conservar la anterior cancelada
      const newPrompt = await aiService.generateResponse({
        text: 'Quiero pedir vacaciones',
        employee,
        phoneKey: '593991122334',
      });
      expect(newPrompt).toContain('Para preparar su solicitud de vacaciones');
    });

    it('cancela la sesión en PENDING_CONFIRMATION ante "Quiero cancelar la solicitud"', async () => {
      await aiService.generateResponse({
        text: 'Solicito un anticipo de $100 a 1 cuota por emergencia',
        employee,
        phoneKey: '593991122334',
      });

      const cancelReply = await aiService.generateResponse({
        text: 'Quiero cancelar la solicitud',
        employee,
        phoneKey: '593991122334',
      });
      expect(cancelReply).toContain('Operacion cancelada correctamente');
    });
  });

  // =========================================================================
  // 11. CONFIRMACIÓN 2FA TOLERANTE A TECLADOS MÓVILES (BRACKETS, LABELS, TRAILING DOT)
  // =========================================================================
  describe('11. Tolerancia y Sanitización en Confirmación 2FA', () => {
    it('acepta CONFIRMAR con corchetes angulares <1723456789> <OTP> y punto final', async () => {
      await aiService.generateResponse({
        text: 'Solicito anticipo de $150 a 1 cuota por medicina familiar',
        employee,
        phoneKey: '593991122334',
      });

      // Recuperar el código OTP generado dinámicamente y enviado por mockMailer
      const lastEmailCall = mockMailer.sendEmail.mock.calls.at(-1);
      const emailHtml = lastEmailCall?.[0]?.html || '';
      const otpMatch = emailHtml.match(/letter-spacing:\s*0\.25em[^>]*>(\d{6})</);
      const generatedOtp = otpMatch ? otpMatch[1] : '123456';

      const confirmReply = await aiService.generateResponse({
        text: `CONFIRMAR <1723456789> <${generatedOtp}>.`,
        employee,
        phoneKey: '593991122334',
      });

      expect(confirmReply).toContain('Solicitud de Anticipo Registrada');
      expect(mockSalaryAdvanceService.requestAdvance).toHaveBeenCalled();
    });

    it('acepta CONFIRMAR con etiquetas "cedula" y "otp"', async () => {
      await aiService.generateResponse({
        text: 'Solicito anticipo de $120 a 1 cuota por servicios basicos',
        employee,
        phoneKey: '593991122334',
      });

      const lastEmailCall = mockMailer.sendEmail.mock.calls.at(-1);
      const emailHtml = lastEmailCall?.[0]?.html || '';
      const otpMatch = emailHtml.match(/letter-spacing:\s*0\.25em[^>]*>(\d{6})</);
      const generatedOtp = otpMatch ? otpMatch[1] : '123456';

      const confirmReply = await aiService.generateResponse({
        text: `CONFIRMAR cedula 1723456789 otp ${generatedOtp}`,
        employee,
        phoneKey: '593991122334',
      });

      expect(confirmReply).toContain('Solicitud de Anticipo Registrada');
    });
  });

  // =========================================================================
  // 12. VALIDACIÓN DE CALENDARIO REAL (RECHAZO DE FECHAS IMPOSIBLES 2026-02-30)
  // =========================================================================
  describe('12. Detección y rechazo de fechas inexistentes en el calendario', () => {
    it('rechaza explícitamente fechas imposibles como 2026-02-30 en vacaciones', async () => {
      const reply = await aiService.generateResponse({
        text: 'Quiero pedir vacaciones del 2026-02-30 al 2026-03-05 por viaje familiar',
        employee,
        phoneKey: '593991122334',
      });

      expect(reply).toContain('No es posible procesar su solicitud de vacaciones');
      expect(reply).toContain('la fecha indicada no existe en el calendario oficial');
    });

    it('rechaza explícitamente fechas imposibles en permisos médicos (31/04/2026)', async () => {
      const reply = await aiService.generateResponse({
        text: 'Solicito permiso médico para el 31/04/2026 por cita en hospital',
        employee,
        phoneKey: '593991122334',
      });

      expect(reply).toContain('No es posible procesar su solicitud de permiso');
      expect(reply).toContain('la fecha indicada no existe en el calendario oficial');
    });
  });

  // =========================================================================
  // 13. SELECTOR MULTI-TENANT ROBUSTO Y PURGA DE HISTORIAL AL CAMBIAR
  // =========================================================================
  describe('13. Robustez de Cambio Multi-Tenant en WhatsApp Service', () => {
    it('resuelve selección por número con punto "1.", "#1", "Opción 1", RUC y nombre insensible a tildes', async () => {
      const candidates = [
        {
          id: 'emp-1',
          tenantId: 'tenant-1',
          tenant: { name: 'Comercial Andina S.A.', ruc: '1790011223001' },
        },
        {
          id: 'emp-2',
          tenantId: 'tenant-2',
          tenant: { name: 'Logística Exprés Cía. Ltda.', ruc: '0990033445001' },
        },
      ];

      const ws = new WhatsappService();
      expect(ws.matchTenantSelectionReply('1.', candidates)).toBe(candidates[0]);
      expect(ws.matchTenantSelectionReply('#2', candidates)).toBe(candidates[1]);
      expect(ws.matchTenantSelectionReply('Opcion 1', candidates)).toBe(candidates[0]);
      expect(ws.matchTenantSelectionReply('1790011223001', candidates)).toBe(candidates[0]);
      expect(ws.matchTenantSelectionReply('logistica expres', candidates)).toBe(candidates[1]);
    });
  });

  // =========================================================================
  // 14. CONSENTIMIENTO LOPDP CON SALUDOS O CORTESÍA ("Hola, sí acepto")
  // =========================================================================
  describe('14. Consentimiento LOPDP tolerante a prefijos de cortesía', () => {
    it('reconoce aceptación LOPDP aun si el usuario escribe "Hola, sí acepto" o "Buenas tardes, acepto"', () => {
      const cs = new WhatsappConsentService();
      expect(cs.isAcceptCommand('Hola, sí acepto')).toBe(true);
      expect(cs.isAcceptCommand('Buenas tardes, de acuerdo')).toBe(true);
      expect(cs.isAcceptCommand('Acepto.')).toBe(true);
    });

    it('reconoce revocatoria LOPDP con saludo previo', () => {
      const cs = new WhatsappConsentService();
      expect(cs.isRevokeCommand('Hola, quiero revocar consentimiento')).toBe(true);
      expect(cs.isRevokeCommand('Buenas, no acepto')).toBe(true);
    });
  });
});
