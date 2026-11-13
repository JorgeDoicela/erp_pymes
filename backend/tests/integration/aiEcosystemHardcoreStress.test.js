/**
 * @file aiEcosystemHardcoreStress.test.js
 * @description Suite Exhaustiva de Pruebas de Estrés, Seguridad y Calidad Extrema para todo el Ecosistema de IA:
 *  1. Motor RAG Legal y Calculadora Determinista Decimal.js ante números con separadores de miles y meses fraccionarios.
 *  2. Evaluador Jurídico Anti-Alucinaciones y Fidelidad de Citas con Formatos Monetarios en Español e Inglés.
 *  3. Compilación Multi-Modelo de Fine-Tuning (LLaMA 3, Mistral, DeepSeek, Qwen 2.5 y OpenAI).
 *  4. Adaptador Universal Multi-Proveedor LLM ante payloads anómalos, timeouts y sanitización defensiva.
 *  5. Asistente Conversacional WhatsApp AI: Clasificación Léxica de Intenciones (Informativo vs Accional).
 *  6. Seguridad Criptográfica de Sesiones 2FA, Normalización Telefónica y Gobernanza Multi-Tenant.
 *  7. Motores Predictivos de IA Tabular y Privacidad Diferencial (RDP Accountant y Pearl Do-Calculus).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeLiveLegalCalculation,
  parseNumberString,
} from '../../src/modules/sustainability/legalCalculation.helper.js';
import legalEvaluatorService, {
  detectRequestedNormativeCategories,
  selectBalancedByCategory,
} from '../../src/modules/sustainability/legalEvaluator.service.js';
import sustainabilityFineTuningService from '../../src/modules/sustainability/sustainabilityFineTuning.service.js';
import llmProviderService from '../../src/modules/sustainability/llmProvider.service.js';
import {
  AdvisorQuerySchema,
  FineTuningExportSchema,
} from '../../src/modules/sustainability/sustainability.dto.js';
import { classifyIntent } from '../../src/modules/whatsapp/whatsappAi.utils.js';
import { WHATSAPP_INTENTS } from '../../src/modules/whatsapp/whatsapp.constants.js';
import { WhatsappSecurityService } from '../../src/modules/whatsapp/whatsappSecurity.service.js';
import {
  computeEpsilonPerRound,
  computePrivacyAccountant,
} from '../../src/modules/intelligence/predictive/rdpAccountant.js';

describe('Suite de Pruebas de Estrés y Calidad Extrema del Ecosistema de IA — Norma ERP', () => {
  // ============================================================================
  // 1. RAG LEGAL: PARSEO NUMÉRICO DETERMINISTA Y APLICACIÓN DEL CÓDIGO DEL TRABAJO
  // ============================================================================
  describe('1. RAG Legal: Cálculo Determinista Decimal.js con Separadores de Miles y Meses', () => {
    it('debe parsear correctamente cadenas numéricas con formato US y Latinoamericano', () => {
      expect(parseNumberString('1,200')).toBe(1200);
      expect(parseNumberString('1.200')).toBe(1200);
      expect(parseNumberString('1,200.50')).toBe(1200.5);
      expect(parseNumberString('1.200,50')).toBe(1200.5);
      expect(parseNumberString('2,500.00')).toBe(2500);
      expect(parseNumberString('2.500,00')).toBe(2500);
      expect(parseNumberString('850.25')).toBe(850.25);
      expect(parseNumberString('850,25')).toBe(850.25);
      expect(parseNumberString('460')).toBe(460);
      expect(parseNumberString(null)).toBeNull();
      expect(parseNumberString('')).toBeNull();
    });

    it('debe calcular despido intempestivo y desahucio con sueldo con separador de miles ($1,200) y 5 años exactos', () => {
      const query =
        'Calcular liquidación por despido intempestivo para un trabajador que percibe $1,200 y tiene 5 años de servicio';
      const calc = computeLiveLegalCalculation(query);

      expect(calc).not.toBeNull();
      expect(calc.type).toBe('SETTLEMENT_CALCULATION');
      expect(calc.baseSalary).toBe(1200);
      expect(calc.years).toBe(5);
      // Desahucio Art. 185: 25% * 1200 * 5 = $1,500.00
      expect(calc.desahucioAmount).toBe(1500.0);
      // Despido Intempestivo Art. 188: 5 remuneraciones * 1200 = $6,000.00
      expect(calc.severanceAmount).toBe(6000.0);
      expect(calc.totalSettlement).toBeGreaterThan(7500);
    });

    it('debe liquidar a trabajador con meses únicamente (6 meses de trabajo) con 0 años de desahucio y 3 remuneraciones mínimas por Art. 188', () => {
      const query = 'El empleado trabajó 6 meses y fue despedido con sueldo de $1,200';
      const calc = computeLiveLegalCalculation(query);

      expect(calc).not.toBeNull();
      expect(calc.type).toBe('SETTLEMENT_CALCULATION');
      expect(calc.baseSalary).toBe(1200);
      expect(calc.years).toBe(0);
      expect(calc.extraMonths).toBe(6);
      // Por 6 meses no hay años completos -> Desahucio Art. 185 es $0.00
      expect(calc.desahucioAmount).toBe(0.0);
      // Despido Intempestivo Art. 188: fracción cuenta como año completo, mínimo legal 3 meses -> 3 * 1200 = $3,600.00
      expect(calc.severanceAmount).toBe(3600.0);
      // Décimo tercero proporcional: 1200 * 6 / 12 = $600.00
      expect(calc.thirteenthProp).toBe(600.0);
      // Décimo cuarto proporcional: 460 (SBU 2026) * 6 / 12 = $230.00
      expect(calc.fourteenthProp).toBe(230.0);
      // Vacaciones proporcionales: 1200 * 6 / 24 = $300.00
      expect(calc.vacationProp).toBe(300.0);
      // Total: 0 + 3600 + 600 + 230 + 300 = $4,730.00
      expect(calc.totalSettlement).toBe(4730.0);
    });

    it('debe calcular horas suplementarias y extraordinarias con valores decimales de horas ($1,200 base y 8.5 horas)', () => {
      const query = 'Cálculo de 8.5 horas suplementarias y extraordinarias para sueldo de $1,200';
      const calc = computeLiveLegalCalculation(query);

      expect(calc).not.toBeNull();
      expect(calc.type).toBe('OVERTIME_CALCULATION');
      expect(calc.baseSalary).toBe(1200);
      expect(calc.hours).toBe(8.5);
      // Valor hora base: 1200 / 240 = 5.0000
      expect(calc.hourlyRate).toBe(5.0);
      // 50% recargo (factor 1.5): 5 * 1.5 * 8.5 = $63.75
      expect(calc.totalSupp50).toBe(63.75);
      // 100% recargo (factor 2.0): 5 * 2.0 * 8.5 = $85.00
      expect(calc.totalExtra100).toBe(85.0);
    });

    it('debe caer en SBU de forma segura ante salarios negativos o queries maliciosas sin lanzar excepciones', () => {
      const maliciousQuery = "'; DROP TABLE employees; -- sueldo de -$500 liquidar";
      const calc = computeLiveLegalCalculation(maliciousQuery);
      expect(calc).not.toBeNull();
      // Debe haber usado el SBU como valor base seguro
      expect(calc.baseSalary).toBe(460);
    });
  });

  // ============================================================================
  // 2. EVALUADOR JURÍDICO ANTI-ALUCINACIONES Y FORMATOS MONETARIOS INTERNACIONALES
  // ============================================================================
  describe('2. Evaluador Jurídico Anti-Alucinaciones y Fidelidad de Citas', () => {
    const mockRetrievedChunks = [
      {
        articleCode: 'Código del Trabajo Art. 188',
        content: 'Art. 188.- Indemnización por despido intempestivo...',
      },
      {
        articleCode: 'Código del Trabajo Art. 185',
        content: 'Art. 185.- Bonificaciones por desahucio...',
      },
    ];

    it('debe verificar la matemática cuando la respuesta contiene formato monetario en español ($4.730,00)', () => {
      const liveCalculation = {
        totalSettlement: 4730.0,
        formattedSummary: '- Total Liquidación Oficial: $4,730.00',
      };

      const spanishResponse =
        'Conforme al Art. 188 y Art. 185 del Código del Trabajo, el total a liquidar es de $4.730,00 USD.';

      const audit = legalEvaluatorService.verifyAnswerFidelity({
        answerText: spanishResponse,
        retrievedChunks: mockRetrievedChunks,
        liveCalculation,
      });

      expect(audit.mathVerified).toBe(true);
      expect(audit.status).toBe('VERIFIED_BY_EVALUATOR');
      expect(audit.unverifiedArticles).toHaveLength(0);
    });

    it('debe balancear categorías normativas si la consulta abarca Constitución, Código del Trabajo y Seguridad Social', () => {
      const multiDomainQuery =
        'De acuerdo con la constitucion, el codigo del trabajo y la ley del iess que derechos me asisten';
      const categories = detectRequestedNormativeCategories(multiDomainQuery);

      expect(categories).toContain('CONSTITUTION');
      expect(categories).toContain('LABOR_CODE');
      expect(categories).toContain('IESS_REGULATION');

      const mockCandidates = [
        { id: '1', document: { category: 'LABOR_CODE' }, relevanceScore: 10 },
        { id: '2', document: { category: 'LABOR_CODE' }, relevanceScore: 9 },
        { id: '3', document: { category: 'LABOR_CODE' }, relevanceScore: 8 },
        { id: '4', document: { category: 'CONSTITUTION' }, relevanceScore: 6 },
        { id: '5', document: { category: 'IESS_REGULATION' }, relevanceScore: 5 },
      ];

      const balanced = selectBalancedByCategory(mockCandidates, 3, categories, 'relevanceScore');
      const selectedCats = balanced.map((item) => item.document.category);
      expect(selectedCats).toContain('CONSTITUTION');
      expect(selectedCats).toContain('IESS_REGULATION');
    });

    it('debe detectar alucinación de artículos inexistentes y marcar advertencia de auditoría', () => {
      const hallucinatedAnswer =
        'Según el Art. 188 del Código del Trabajo y el Art. 9999 de la ley laboral imaginaria...';

      const audit = legalEvaluatorService.verifyAnswerFidelity({
        answerText: hallucinatedAnswer,
        retrievedChunks: mockRetrievedChunks,
      });

      expect(audit.status).toBe('AUDITED_WITH_CORRECTION');
      expect(audit.verifiedArticles).toContain('Art. 188');
      expect(audit.unverifiedArticles).toContain('Art. 9999');
      expect(audit.auditedAnswer).toContain(
        'Nota de Auditoría del Evaluador Legal (Anti-Alucinación)'
      );
    });
  });

  // ============================================================================
  // 3. FINE-TUNING: FORMATOS MULTI-MODELO (LLAMA 3, MISTRAL, DEEPSEEK, QWEN, OPENAI)
  // ============================================================================
  describe('3. Compilación Multi-Modelo de Datasets para Fine-Tuning', () => {
    it('debe formatear registros con tokens nativos de LLaMA 3', async () => {
      const dataset = await sustainabilityFineTuningService.generateDataset({
        targetModel: 'llama3',
      });

      expect(dataset.targetModel).toBe('llama3');
      expect(dataset.samples.length).toBeGreaterThan(0);
      const firstSample = dataset.samples[0];
      expect(firstSample.text).toContain('<|start_header_id|>system<|end_header_id|>');
      expect(firstSample.text).toContain('<|start_header_id|>user<|end_header_id|>');
      expect(firstSample.text).toContain('<|start_header_id|>assistant<|end_header_id|>');
      expect(firstSample.text).toContain('<|eot_id|>');
    });

    it('debe formatear registros con tokens nativos de Mistral ([INST])', async () => {
      const dataset = await sustainabilityFineTuningService.generateDataset({
        targetModel: 'mistral',
      });

      expect(dataset.targetModel).toBe('mistral');
      const firstSample = dataset.samples[0];
      expect(firstSample.text).toContain('<s>[INST]');
      expect(firstSample.text).toContain('[/INST]');
      expect(firstSample.text).toContain('</s>');
    });

    it('debe formatear registros con tokens nativos de DeepSeek', async () => {
      const dataset = await sustainabilityFineTuningService.generateDataset({
        targetModel: 'deepseek',
      });

      expect(dataset.targetModel).toBe('deepseek');
      const firstSample = dataset.samples[0];
      expect(firstSample.text).toContain('<｜begin of sentence｜>');
      expect(firstSample.text).toContain('<｜User｜>');
      expect(firstSample.text).toContain('<｜Assistant｜>');
      expect(firstSample.text).toContain('<｜end of sentence｜>');
    });

    it('debe formatear registros con ChatML para Qwen 2.5', async () => {
      const dataset = await sustainabilityFineTuningService.generateDataset({
        targetModel: 'qwen2.5',
      });

      expect(dataset.targetModel).toBe('qwen2.5');
      const firstSample = dataset.samples[0];
      expect(firstSample.text).toContain('<|im_start|>system');
      expect(firstSample.text).toContain('<|im_start|>user');
      expect(firstSample.text).toContain('<|im_start|>assistant');
      expect(firstSample.text).toContain('<|im_end|>');
    });

    it('debe retornar únicamente el arreglo messages para OpenAI', async () => {
      const dataset = await sustainabilityFineTuningService.generateDataset({
        targetModel: 'openai',
      });

      expect(dataset.targetModel).toBe('openai');
      const firstSample = dataset.samples[0];
      expect(firstSample.messages).toBeDefined();
      expect(Array.isArray(firstSample.messages)).toBe(true);
      expect(firstSample.text).toBeUndefined();
    });
  });

  // ============================================================================
  // 4. ADAPTADOR MULTI-PROVEEDOR LLM: RESILIENCIA, SANITIZACIÓN Y CONFIGURACIÓN
  // ============================================================================
  describe('4. Resiliencia del Adaptador Universal LLM (llmProviderService)', () => {
    it('debe resolver la configuración activa de todos los proveedores soportados', () => {
      const providers = [
        'deepseek',
        'openai',
        'gemini',
        'groq',
        'anthropic',
        'huggingface',
        'local_ollama',
        'local_openai',
      ];
      for (const prov of providers) {
        const config = llmProviderService.resolveActiveConfig({
          provider: prov,
          apiKey: 'test-key',
        });
        expect(config.providerKey).toBe(prov);
        expect(config.baseUrl).toBeDefined();
        expect(config.model).toBeDefined();
      }
    });

    it('debe manejar mensajes con contenido nulo o vacío sin lanzar excepciones no controladas', async () => {
      const invalidMessages = [
        { role: 'user', content: null },
        { role: 'assistant', content: undefined },
        { role: 'user', content: '' },
      ];

      // Sin proveedor externo configurado, debe retornar null limpiamente
      const result = await llmProviderService.generateChatCompletion({
        systemPrompt: 'Test system',
        messages: invalidMessages,
        providerOverrides: { provider: 'deepseek', apiKey: '' },
      });

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // 5. ASISTENTE WHATSAPP AI: CLASIFICACIÓN DE INTENCIONES INFORMATIVO VS ACCIONAL
  // ============================================================================
  describe('5. WhatsApp AI: Clasificación Léxica de Intenciones con Acentos y Signos', () => {
    const mockEmployee = {
      id: 'emp-101',
      tenantId: 'tenant-101',
      firstName: 'Ana',
      role: 'employee',
      tenant: { name: 'Empresa Andina S.A.' },
    };

    it('debe clasificar consultas de saldo de vacaciones como EMPLOYEE_QUERY (y NO como VACATION_REQUEST_ACTION)', () => {
      const informationalQueries = [
        '¿Cuántos días de vacaciones tengo?',
        'cuantos dias de vacaciones me quedan',
        'Quiero saber cuántos días de vacaciones tengo del año pasado',
        'Deseo consultar mi saldo de vacaciones',
        '¿Tengo vacaciones pendientes?',
        'cuantas vacaciones tengo disponibles',
      ];

      for (const q of informationalQueries) {
        const intent = classifyIntent(q, mockEmployee);
        expect(intent).toBe(WHATSAPP_INTENTS.EMPLOYEE_QUERY);
      }
    });

    it('debe clasificar solicitudes expresas de vacaciones como VACATION_REQUEST_ACTION', () => {
      const actionQueries = [
        'Quiero solicitar vacaciones del 10 al 20 de diciembre',
        'Solicito vacaciones para la próxima semana por viaje',
        'Tomar vacaciones desde el 2026-11-15 hasta el 2026-11-20',
        'solicitud de vacaciones del 1 al 10',
      ];

      for (const q of actionQueries) {
        const intent = classifyIntent(q, mockEmployee);
        expect(intent).toBe(WHATSAPP_INTENTS.VACATION_REQUEST_ACTION);
      }
    });

    it('debe clasificar preguntas informativas de anticipo como EMPLOYEE_QUERY o LEGAL_QUERY (y NO como SALARY_ADVANCE_ACTION)', () => {
      expect(classifyIntent('¿Cuánto puedo pedir de anticipo?', mockEmployee)).not.toBe(
        WHATSAPP_INTENTS.SALARY_ADVANCE_ACTION
      );
      expect(classifyIntent('Cómo solicito un anticipo de sueldo', mockEmployee)).not.toBe(
        WHATSAPP_INTENTS.SALARY_ADVANCE_ACTION
      );
    });

    it('debe clasificar solicitud formal de anticipo con monto como SALARY_ADVANCE_ACTION', () => {
      const actionQueries = [
        'Solicito un anticipo de sueldo de $150',
        'necesito pedir un anticipo por $200',
        'adelanto de sueldo de 100 dolares',
      ];

      for (const q of actionQueries) {
        const intent = classifyIntent(q, mockEmployee);
        expect(intent).toBe(WHATSAPP_INTENTS.SALARY_ADVANCE_ACTION);
      }
    });

    it('debe clasificar solicitud de permiso médico o calamidad como PERMISSION_REQUEST_ACTION', () => {
      expect(
        classifyIntent('Reportar calamidad doméstica para mañana por cita médica', mockEmployee)
      ).toBe(WHATSAPP_INTENTS.PERMISSION_REQUEST_ACTION);
      expect(classifyIntent('Solicitar permiso médico para el día viernes', mockEmployee)).toBe(
        WHATSAPP_INTENTS.PERMISSION_REQUEST_ACTION
      );
    });

    it('debe reconocer el comando de cambio de empresa en entornos multi-tenant', () => {
      expect(classifyIntent('CAMBIAR DE EMPRESA', mockEmployee)).toBe(
        WHATSAPP_INTENTS.SWITCH_TENANT_COMMAND
      );
      expect(classifyIntent('mis empresas', mockEmployee)).toBe(
        WHATSAPP_INTENTS.SWITCH_TENANT_COMMAND
      );
    });
  });

  // ============================================================================
  // 6. SEGURIDAD CRIPTOGRÁFICA 2FA, TIMING-SAFE EQUAL Y NORMALIZACIÓN TELEFÓNICA
  // ============================================================================
  describe('6. Capa de Seguridad Criptográfica y 2FA en WhatsApp', () => {
    const sec = new WhatsappSecurityService();

    it('debe generar y verificar hash OTP con salt único de sesión', () => {
      const sessionId = 'session-uuid-777';
      const otp = '849201';
      const hash = sec.hashOtp(sessionId, otp);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 hex
      expect(sec.verifyOtpHash(sessionId, otp, hash)).toBe(true);
      expect(sec.verifyOtpHash(sessionId, '000000', hash)).toBe(false);
      expect(sec.verifyOtpHash('other-session', otp, hash)).toBe(false);
    });

    it('debe verificar los últimos 4 dígitos de cédula mediante comparación en tiempo constante (timingSafeEqual)', () => {
      expect(sec.verifyIdentityLast4('1712345678', '5678')).toBe(true);
      expect(sec.verifyIdentityLast4('1712345678', '1234')).toBe(false);
      expect(sec.verifyIdentityLast4('1712345678', '99')).toBe(false);
      expect(sec.verifyIdentityLast4('12', '12')).toBe(false); // Cédula menor a 4 dígitos
    });

    it('debe normalizar variantes telefónicas para búsquedas en base de datos en Ecuador', () => {
      const variants = sec.normalizePhoneNumberVariants('593987654321');
      expect(variants).toContain('593987654321');
      expect(variants).toContain('0987654321');
      expect(variants).toContain('+593987654321');
      expect(variants).toContain('987654321');

      expect(sec.getCanonicalPhoneKey('0987654321')).toBe('593987654321');
    });

    it('debe aplicar rate limiting estricto de 15 solicitudes por minuto por número', () => {
      const phone = '593999999999';
      for (let i = 0; i < 15; i++) {
        expect(sec.checkRateLimit(phone)).toBe(true);
      }
      // La solicitud 16 dentro de la misma ventana debe ser rechazada
      expect(sec.checkRateLimit(phone)).toBe(false);
    });
  });

  // ============================================================================
  // 7. PRIVACIDAD DIFERENCIAL Y APRENDIZAJE FEDERADO (RDP ACCOUNTANT)
  // ============================================================================
  describe('7. Privacidad Diferencial en Aprendizaje Federado (RDP Accountant)', () => {
    it('debe calcular epsilon por ronda respetando las cotas matemáticas de Rényi DP', () => {
      const noiseMultiplier = 1.0;
      const delta = 1e-5;
      const samplingRate = 0.1;
      const epsRound = computeEpsilonPerRound(noiseMultiplier, delta, samplingRate);
      expect(epsRound).toBeGreaterThan(0);
      expect(epsRound).toBeLessThan(10.0);
    });

    it('debe computar el presupuesto gastado acumulado a lo largo de 10 rondas federadas', () => {
      const budget = computePrivacyAccountant({
        rounds: 10,
        noiseMultiplier: 0.8,
        delta: 1e-5,
        samplingRate: 0.2,
      });

      expect(budget.epsilonAccumulated).toBeGreaterThan(0);
      expect(budget.rounds).toBe(10);
      expect(budget.privacyGuarantee).toContain('RDP Accountant');
    });
  });

  // ============================================================================
  // 8. VALIDACIÓN ZOD Y RESILIENCIA ANTE ATAQUES DE INYECCIÓN DE PROMPT Y CARGAS
  // ============================================================================
  describe('8. Validación Zod y Blindaje ante Inyección de Prompt y Cargas Extremas', () => {
    it('debe rechazar consultas con longitud superior al límite de 2000 caracteres', () => {
      const hugeQuery = 'A'.repeat(2001);
      const validation = AdvisorQuerySchema.safeParse({ query: hugeQuery });
      expect(validation.success).toBe(false);
      expect(validation.error.issues[0].message).toContain('2000');
    });

    it('debe aceptar consultas válidas con filtros opcionales nulos o ausentes', () => {
      const validation = AdvisorQuerySchema.safeParse({
        query: '¿Cuáles son los requisitos del contrato indefinido?',
        odsTargetFilter: null,
        categoryFilter: null,
        moduleContext: 'contracts',
      });
      expect(validation.success).toBe(true);
      expect(validation.data.moduleContext).toBe('contracts');
    });

    it('debe sanitizar e inferir context por defecto sustainability cuando moduleContext sea null', () => {
      const validation = AdvisorQuerySchema.safeParse({
        query: 'Consulta general de derechos',
        moduleContext: null,
      });
      expect(validation.success).toBe(true);
      expect(validation.data.moduleContext).toBe('sustainability');
    });

    it('debe validar el esquema de exportación de fine-tuning para todos los modelos soportados', () => {
      const validModels = ['llama3', 'mistral', 'qwen2.5', 'deepseek', 'openai'];
      for (const targetModel of validModels) {
        const val = FineTuningExportSchema.safeParse({ targetModel, format: 'jsonl' });
        expect(val.success).toBe(true);
      }

      const invalidVal = FineTuningExportSchema.safeParse({ targetModel: 'unsupported-model-xyz' });
      expect(invalidVal.success).toBe(false);
    });

    it('debe acotar salarios astronómicos ($100,000) al tope superior o caer en SBU', () => {
      const excessiveQuery = 'Calcular liquidación para un sueldo de $100000 con 5 años';
      const calc = computeLiveLegalCalculation(excessiveQuery);
      expect(calc).not.toBeNull();
      // Salarios mayores a 50,000 se protegen cayendo a la base legal segura SBU
      expect(calc.baseSalary).toBe(460);
    });
  });
});
