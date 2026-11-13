/**
 * @file whatsappAndAiApiE2E.test.js
 * @description Suite de Pruebas de Integración y E2E para la API de WhatsApp, el Motor RAG y los Modelos Neuronales ONNX.
 * Verifica la inferencia real en CPU con Bi-Encoder (768d) y Cross-Encoder, los endpoints HTTP de Express y el flujo conversacional.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect, vi, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Habilitar la inferencia ONNX en vivo durante esta suite E2E
process.env.ENABLE_NEURAL_ONNX_TEST = 'true';

// Mock de persistencia de Base de Datos para pruebas de integración HTTP desacopladas de PostgreSQL
vi.mock('../../src/database/db.js', () => {
  const createModelStub = () => ({
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    update: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    delete: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 }, _count: { id: 0 } }),
  });

  const baseTargets = {
    tenant: {
      findFirst: vi.fn().mockImplementation(async ({ where }) => {
        if (where?.id === 'tenant-inexistente') return null;
        return {
          id: where?.id || 'tenant-test-e2e-123',
          name: 'Distribuidora Andina S.A.',
          slug: 'distribuidora-andina',
          plan: 'PRO',
          subscriptionStatus: 'ACTIVE',
          maxEmployees: 100,
          isActive: true,
        };
      }),
    },
    employee: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'emp-uuid-456',
        tenantId: 'tenant-test-e2e-123',
        vacationDays: 14,
        identification: '1712345678',
        firstName: 'Carlos',
        lastName: 'Mendoza',
        position: 'Analista',
        department: 'Logística',
        status: 'ACTIVE',
        gender: 'MALE',
        salary: 850,
      }),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'emp-uuid-456',
          status: 'ACTIVE',
          gender: 'MALE',
          salary: 850,
          hireDate: new Date('2022-01-01'),
        },
      ]),
      count: vi.fn().mockResolvedValue(15),
    },
    whatsappActionSession: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'sess-new-123', status: 'COLLECTING_PARAMS' }),
      update: vi.fn().mockResolvedValue({ id: 'sess-new-123', status: 'CANCELLED' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    attendance: {
      count: vi.fn().mockResolvedValue(12),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    absenceRequest: {
      count: vi.fn().mockResolvedValue(2),
      findMany: vi.fn().mockResolvedValue([]),
    },
    payrollItem: {
      findMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 12000 } }),
    },
    systemSetting: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ isMaintenanceMode: false }),
      upsert: vi.fn().mockResolvedValue({ isMaintenanceMode: false }),
    },
    $transaction: vi.fn().mockImplementation(async (cb) => {
      if (typeof cb === 'function') return cb(prismaProxy);
      return Promise.all(cb);
    }),
  };

  const prismaProxy = new Proxy(baseTargets, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string' && !prop.startsWith('$')) {
        target[prop] = createModelStub();
        return target[prop];
      }
      return undefined;
    },
  });

  return { default: prismaProxy };
});

import app from '../../src/app.js';
import neuralRetrieverService from '../../src/modules/sustainability/neuralRetriever.service.js';
import whatsappAiService from '../../src/modules/whatsapp/whatsappAi.service.js';

describe('Suite Integral E2E: WhatsApp API, Motor RAG y Modelos ONNX Entrenados', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';
  const tenantId = 'tenant-test-e2e-123';

  const adminToken = jwt.sign(
    { id: 'usr-admin-1', role: 'admin', tenantId, email: 'admin@empresa.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const employeeToken = jwt.sign(
    { id: 'usr-emp-1', role: 'employee', tenantId, email: 'colaborador@empresa.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const mockEmployee = {
    id: 'emp-uuid-456',
    tenantId,
    firstName: 'Carlos',
    lastName: 'Mendoza',
    identification: '1712345678',
    phone: '593987654321',
    position: 'Analista de Operaciones',
    department: 'Logística',
    vacationDays: 14,
    role: 'employee',
    whatsappConsent: true,
    tenant: { name: 'Distribuidora Andina S.A.' },
  };

  afterAll(() => {
    delete process.env.ENABLE_NEURAL_ONNX_TEST;
  });

  // ============================================================================
  // 1. VERIFICACIÓN DE INFERENCIA EN VIVO CON MODELOS ONNX ENTRENADOS (CPU)
  // ============================================================================
  describe('1. Modelos Neuronales ONNX en Vivo (Bi-Encoder 768d + Cross-Encoder)', () => {
    it('debe tener disponibles los archivos del Bi-Encoder y Cross-Encoder', () => {
      expect(neuralRetrieverService.hasBiEncoderFiles()).toBe(true);
      expect(neuralRetrieverService.hasCrossEncoderFiles()).toBe(true);
    });

    it('el Bi-Encoder ONNX debe generar embeddings densos normalizados de 768 dimensiones', async () => {
      const embedding = await neuralRetrieverService.embedQuery(
        'despido intempestivo indemnizacion desahucio'
      );
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding).toHaveLength(768);

      const normSq = embedding.reduce((acc, val) => acc + val * val, 0);
      expect(normSq).toBeGreaterThan(0.95);
      expect(normSq).toBeLessThan(1.05);
    }, 15000);

    it('el Cross-Encoder ONNX debe priorizar normativas laborales pertinentes sobre temas ajenos', async () => {
      const query = 'me despidieron que me corresponde';
      const candidates = [
        'Art. 188.- Indemnización por despido intempestivo.- El empleador que despidiere intempestivamente al trabajador...',
        'Art. 443 de la Constitución de la República del Ecuador relativo a competencias de la Corte Constitucional...',
        'Art. 185.- Bonificaciones por desahucio.- En los casos de terminación de la relación laboral...',
      ];

      const scores = await neuralRetrieverService.rerankPairs(query, candidates);
      expect(Array.isArray(scores)).toBe(true);
      expect(scores).toHaveLength(3);

      expect(scores[0]).toBeGreaterThan(scores[1]);
      expect(scores[2]).toBeGreaterThan(scores[1]);
    }, 15000);
  });

  // ============================================================================
  // 2. ENDPOINTS HTTP PÚBLICOS Y PRIVADOS DE WHATSAPP (/api/whatsapp)
  // ============================================================================
  describe('2. Endpoints HTTP de WhatsApp API', () => {
    it('GET /api/whatsapp/privacy debe retornar la política de privacidad en HTML', async () => {
      const res = await request(app).get('/api/whatsapp/privacy');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toMatch(/pol[ií]tica de privacidad/i);
      expect(res.text).toContain('Norma ERP');
    });

    it('GET /api/whatsapp/terms debe retornar los términos de servicio en HTML', async () => {
      const res = await request(app).get('/api/whatsapp/terms');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Condiciones del Servicio');
      expect(res.text).toContain('Norma ERP');
    });

    it('GET /api/whatsapp/webhook debe validar el handshake de Meta con token correcto', async () => {
      const verifyToken = 'norma_erp_whatsapp_verify_secret_2026';
      process.env.WHATSAPP_VERIFY_TOKEN = verifyToken;
      const challenge = 'meta_test_challenge_abc_123';

      const res = await request(app).get('/api/whatsapp/webhook').query({
        'hub.mode': 'subscribe',
        'hub.verify_token': verifyToken,
        'hub.challenge': challenge,
      });

      expect(res.status).toBe(200);
      expect(res.text).toBe(challenge);
    });

    it('GET /api/whatsapp/webhook debe rechazar el handshake si el token no coincide', async () => {
      process.env.WHATSAPP_VERIFY_TOKEN = 'norma_erp_whatsapp_verify_secret_2026';
      const res = await request(app).get('/api/whatsapp/webhook').query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'token_completamente_invalido',
        'hub.challenge': '12345',
      });

      expect(res.status).toBe(403);
    });

    it('POST /api/whatsapp/webhook debe responder 200 OK EVENT_RECEIVED según el contrato de Meta', async () => {
      const appSecret = process.env.WHATSAPP_APP_SECRET || 'norma_erp_meta_app_secret_test';
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '593999999999', phone_number_id: '12345678' },
                  statuses: [{ id: 'wamid.HBgLMTIz', status: 'delivered' }],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const rawBody = JSON.stringify(payload);
      const hmac = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .set('x-hub-signature-256', `sha256=${hmac}`)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.text).toBe('EVENT_RECEIVED');
    });

    it('GET /api/whatsapp/status debe requerir autenticación JWT', async () => {
      const res = await request(app).get('/api/whatsapp/status');
      expect(res.status).toBe(401);
    });

    it('GET /api/whatsapp/status debe responder 200 con diagnóstico para administradores autenticados', async () => {
      const res = await request(app)
        .get('/api/whatsapp/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.whatsapp).toHaveProperty('isConfigured');
      expect(res.body.ai).toHaveProperty('activeProvider');
    });
  });

  // ============================================================================
  // 3. ENDPOINTS HTTP DE SOSTENIBILIDAD Y ASISTENTE RAG (/api/sustainability)
  // ============================================================================
  describe('3. Endpoints HTTP del Asistente RAG y Sostenibilidad', () => {
    it('POST /api/sustainability/advisor/query debe procesar consulta legal con JWT', async () => {
      const res = await request(app)
        .post('/api/sustainability/advisor/query')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          query:
            '¿Cuántos días de vacaciones corresponden por ley en Ecuador según el Código del Trabajo?',
          moduleContext: 'attendance',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('answer');
      expect(res.body.data).toHaveProperty('legalCitations');
      expect(res.body.data.legalCitations.length).toBeGreaterThan(0);

      const citationsText = JSON.stringify(res.body.data.legalCitations);
      expect(citationsText).toMatch(/Art\.\s*69/i);
    }, 25000);

    it('POST /api/sustainability/advisor/query debe procesar la consulta sugerida de EMPLOYEES con odsTargetFilter null/omitido y retornar totalIndexedArticles y providerInfo', async () => {
      const res = await request(app)
        .post('/api/sustainability/advisor/query')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          query:
            '¿Desde qué día es obligatoria la afiliación al IESS y cuándo se genera derecho a Fondos de Reserva (8.33%)?',
          conversationHistory: [],
          odsTargetFilter: null,
          moduleContext: 'employees',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalIndexedArticles).toBeGreaterThan(1800);
      expect(res.body.data).toHaveProperty('providerInfo');
      expect(res.body.data.evaluationAudit.groundednessScore).toBeGreaterThanOrEqual(0.8);
      expect(res.body.data.legalCitations.length).toBeGreaterThan(0);
    }, 25000);

    it('POST /api/sustainability/advisor/query debe ejecutar cálculo exacto Decimal.js para liquidación en módulo offboarding', async () => {
      const res = await request(app)
        .post('/api/sustainability/advisor/query')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query:
            'Calcula paso a paso la liquidación por despido intempestivo (Art. 188) y desahucio (Art. 185) para $850 USD y 4 años y 2 meses.',
          conversationHistory: [],
          moduleContext: 'offboarding',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.liveCalculation).toBeDefined();
      expect(res.body.data.liveCalculation.type).toBe('SETTLEMENT_CALCULATION');
      expect(res.body.data.liveCalculation.baseSalary).toBe(850);
      expect(res.body.data.liveCalculation.desahucioAmount).toBe(850);
      expect(res.body.data.liveCalculation.severanceAmount).toBe(4250);
      expect(res.body.data.evaluationAudit.mathVerified).toBe(true);
    }, 25000);

    it('POST /api/sustainability/fine-tuning/export debe exportar dataset JSONL para admin', async () => {
      const res = await request(app)
        .post('/api/sustainability/fine-tuning/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetModel: 'qwen2.5',
          includeFullPdfCorpus: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalSamples');
      expect(res.body.data.totalSamples).toBeGreaterThan(0);
      expect(res.body.data.format).toBe('jsonl');
    });

    it('POST /api/sustainability/fine-tuning/export debe denegar acceso a empleados sin rol admin', async () => {
      const res = await request(app)
        .post('/api/sustainability/fine-tuning/export')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ targetModel: 'qwen2.5' });

      expect(res.status).toBe(403);
    });
  });

  // ============================================================================
  // 4. FLUJOS CONVERSACIONALES DE WHATSAPP CON MOTOR DE IA Y RAG INTEGRADO
  // ============================================================================
  describe('4. Flujos Conversacionales Integrados de WhatsApp AI', () => {
    it('Flujo Saludo: debe entregar mensaje de bienvenida personalizado con el nombre del colaborador', async () => {
      const reply = await whatsappAiService.generateResponse({
        text: 'Hola, buenos días',
        employee: mockEmployee,
      });

      expect(reply).toContain('Carlos');
      expect(reply).toContain('Norma ERP');
      expect(reply).toMatch(/vacaciones/i);
    });

    it('Flujo Consulta Personal: debe responder con saldo de vacaciones del colaborador', async () => {
      const reply = await whatsappAiService.generateResponse({
        text: '¿Cuántos días de vacaciones me quedan disponibles?',
        employee: mockEmployee,
      });

      expect(reply).toContain('14');
      expect(reply).toMatch(/vacaciones/i);
    });

    it('Flujo Jurídico RAG: ante despido intempestivo debe fundamentar con el Código del Trabajo', async () => {
      const reply = await whatsappAiService.generateResponse({
        text: 'me despidieron intempestivamente ayer que indemnizacion me toca por ley',
        employee: mockEmployee,
      });

      expect(reply).toContain('Fundamento Normativo Oficial:');
      expect(reply).toMatch(/Art\.\s*188/i);
      expect(reply).toContain('Código del Trabajo');
    }, 25000);

    it('Flujo Habilidad Agéntica: solicitud de vacaciones debe pedir fecha o parámetros iniciales', async () => {
      const reply = await whatsappAiService.generateResponse({
        text: 'Quiero solicitar mis vacaciones por favor',
        employee: mockEmployee,
        phoneKey: '593987654321',
      });

      expect(reply).toMatch(/fecha|inicio|días|solicitud/i);
    });
  });
});
