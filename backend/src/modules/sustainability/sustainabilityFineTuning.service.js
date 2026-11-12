/**
 * @file sustainabilityFineTuning.service.js
 * @description Generador y compilador de datasets de Fine-Tuning (QLoRA / SFT) multi-dominio para Qwen 2.5 14B,
 * LLaMA 3 y OpenAI, abarcando Legislación Laboral de Ecuador, IESS, Tributación SRI, Contabilidad NIIF,
 * Gobernanza LOPDP y Sostenibilidad ODS 8 con resolución matemática Decimal.js.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Decimal } from 'decimal.js';
import sustainabilityRepository from './sustainability.repository.js';
import { SBU_ECUADOR_2026 } from './sustainability.service.js';

const SYSTEM_PROMPT_ERP =
  'Eres el Asistente Experto en Legislación Laboral del Ecuador, Contabilidad Financiera NIIF para PYMES, Tributación SRI, Seguridad Social IESS, Protección de Datos (LOPDP) y Gobernanza ODS 8 integrado en Norma ERP. Responde siempre con rigor jurídico, precisión matemática de 2 decimales (ROUND_HALF_UP) y referencias exactas a la normativa ecuatoriana vigente.';

export class SustainabilityFineTuningService {
  /**
   * Genera el conjunto completo de datos de entrenamiento multi-dominio en formato JSONL
   * @param {Object} options
   */
  async generateDataset({
    targetModel = 'qwen2.5',
    includeTenantData = false,
    includeFullPdfCorpus = false,
    tenantId = null,
    categories = [],
  } = {}) {
    const rawChunks = await sustainabilityRepository.getAllChunksForDataset({
      categories,
      includeFullPdfCorpus,
      includeTenantData,
      tenantId,
    });

    const allScenarios = [
      ...this.getExpertDoctrinalScenarios(),
      ...this.getSettlementChainOfThoughtScenarios(),
      ...this.getPayrollAndAccountingNIIFScenarios(),
      ...this.getOvertimeAndVacationScenarios(),
      ...this.getProfitSharingAndTaxSriScenarios(),
      ...this.getAccountingMonthlyProvisionsScenarios(),
      ...this.getOds8TenantAuditScenarios(),
      ...this.getCorpusDerivedScenarios(rawChunks),
    ];

    const samples = allScenarios.map((scenario) => this.formatRecord(scenario, targetModel));

    return {
      targetModel,
      totalSamples: samples.length,
      format: 'jsonl',
      domainsCovered: [
        'LABOR_CODE_ECUADOR',
        'IESS_SOCIAL_SECURITY',
        'TAX_SRI_LORTI',
        'ACCOUNTING_NIIF_PYMES',
        'ATTENDANCE_AND_OVERTIME',
        'OFFBOARDING_AND_SETTLEMENTS',
        'GOVERNANCE_LOPDP_AND_SIGNATURES',
        'PERFORMANCE_RECRUITMENT_ENTREPRENEURSHIP',
        'ODS_8_SUSTAINABILITY_METRICS',
      ],
      samples,
    };
  }

  /**
   * Formatea cada registro asegurando compatibilidad nativa con Qwen 2.5 (ChatML),
   * Unsloth / Alpaca (instruction, input, output, text) y OpenAI (messages).
   * @private
   */
  formatRecord(
    {
      systemPrompt = SYSTEM_PROMPT_ERP,
      userQuery,
      inputContext = '',
      assistantResponse,
      domain = 'GENERAL',
    },
    targetModel
  ) {
    const fullUserContent = inputContext
      ? `${userQuery}\n\nContexto de Datos:\n${inputContext}`
      : userQuery;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: fullUserContent },
      { role: 'assistant', content: assistantResponse },
    ];

    // ChatML nativo para Qwen 2.5 / Unsloth SFTTrainer (evita pérdida del prompt de entrada)
    const chatMlText =
      `<|im_start|>system\n${systemPrompt}<|im_end|>\n` +
      `<|im_start|>user\n${fullUserContent}<|im_end|>\n` +
      `<|im_start|>assistant\n${assistantResponse}<|im_end|>`;

    if (targetModel === 'openai') {
      return { messages };
    }

    return {
      instruction: userQuery,
      input: inputContext,
      output: assistantResponse,
      system: systemPrompt,
      domain,
      messages,
      text: chatMlText,
    };
  }

  /**
   * 1. Escenarios Doctrinarios y Operativos de los 8 Dominios de Norma ERP
   * @private
   */
  getExpertDoctrinalScenarios() {
    return [
      {
        domain: 'CONTRACTS',
        userQuery:
          '¿Es obligatorio afiliar al IESS a un trabajador que ingresa con contrato indefinido durante los 90 días de período de prueba?',
        assistantResponse:
          'Sí, es estrictamente obligatorio desde el primer día de labor.\n\n1. **Fundamento Constitucional y Legal:** El Art. 34 de la Constitución del Ecuador y el Art. 73 de la Ley de Seguridad Social establecen que el derecho a la seguridad social es irrenunciable y el empleador está obligado a inscribir al trabajador en el IESS desde el primer día de trabajo (remitiendo el aviso de entrada dentro de los primeros 15 días).\n2. **Alcance del Período de Prueba (Art. 15 del Código del Trabajo):** El período de prueba (máximo 90 días en contratos indefinidos iniciales) únicamente exime del pago de indemnización por despido intempestivo si cualquiera de las partes da por terminada la relación durante ese lapso, pero el trabajador goza de todos los derechos de ley: remuneración no menor al SBU ($460.00 USD), afiliación al IESS (9.45% personal / 11.15% patronal) y proporcionales de décimo tercero, décimo cuarto y vacaciones.\n3. **Impacto en Norma ERP:** Omitir la afiliación en período de prueba constituye evasión patronal sancionada por el IESS y degrada el indicador ODS 8.5.1.',
      },
      {
        domain: 'CONTRACTS',
        userQuery:
          '¿Cuándo se puede celebrar un contrato eventual en Ecuador, cuánto dura como máximo y qué recargo salarial exige la ley?',
        assistantResponse:
          'Conforme al **Artículo 17 del Código del Trabajo del Ecuador**:\n\n1. **Causales Permitidas:** El contrato eventual se celebra para satisfacer exigencias circunstanciales del empleador, tales como reemplazo de personal que se encuentra ausente por vacaciones, licencia, enfermedad, maternidad o situaciones similares, así como para atender incrementos de trabajo motivados por una mayor demanda de producción o servicios.\n2. **Duración Máxima:** No podrá tener una duración mayor de **ciento ochenta (180) días** continuos o discontinuos dentro de un lapso de trescientos sesenta y cinco (365) días.\n3. **Recargo Legal del 35%:** El sueldo o salario que se pague en los contratos eventuales tendrá un incremento del **35%** del valor hora del salario básico del sector al que corresponda el trabajador.\n4. **Conversión Automática:** Si el trabajo se repite por más de dos períodos anuales o excede los 180 días, el contrato se convierte legalmente en contrato de temporada o a tiempo indefinido.',
      },
      {
        domain: 'CONTRACTS',
        userQuery:
          '¿Cuáles son las reglas legales del teletrabajo en Ecuador y cómo se garantiza el derecho a la desconexión digital?',
        assistantResponse:
          'De acuerdo con el **Artículo 16.1 del Código del Trabajo**:\n\n1. **Igualdad de Derechos:** Las personas teletrabajadoras gozan de los mismos derechos individuales y colectivos, remuneración (mínimo SBU $460.00 USD), beneficios de ley (décimos, fondos de reserva, utilidades) y seguridad social (IESS) que los trabajadores presenciales.\n2. **Límite de Jornada:** Se mantiene la jornada máxima legal de 8 horas diarias y 40 horas semanales (Art. 47).\n3. **Desconexión Digital:** El empleador debe respetar el derecho a la desconexión digital de al menos **doce (12) horas continuas** en un período de veinticuatro horas, durante las cuales no puede exigir respuestas a comunicaciones ni imponer sanciones.\n4. **Provisión de Herramientas:** El empleador debe proveer los equipos e insumos necesarios, registrados en Norma ERP dentro del módulo de Activos Asignados (`EmployeeAsset`).',
      },
      {
        domain: 'ATTENDANCE_AND_OVERTIME',
        userQuery:
          '¿Cuál es la diferencia legal y matemática entre horas suplementarias, horas extraordinarias y jornada nocturna en Ecuador?',
        assistantResponse:
          'El Código del Trabajo del Ecuador distingue tres figuras con recargos específicos calculados sobre el valor hora diurno (`Sueldo Base Mensual / 240`):\n\n1. **Jornada Nocturna (Art. 49):**\n   - **Horario:** Se ejecuta entre las `19h00` y las `06h00` del día siguiente dentro de la jornada ordinaria.\n   - **Recargo:** `25%` adicional sobre la remuneración diurna (`Valor Hora × 1.25`).\n2. **Horas Suplementarias (Art. 55 Numeral 1):**\n   - **Definición y Límite:** Son las trabajadas a continuación de la jornada ordinaria de 8 horas (máximo 4 horas en un día y 12 horas en la semana).\n   - **Recargo Diurno/Vespertino (hasta las 24h00):** `50%` de recargo (`Valor Hora × 1.50`).\n   - **Recargo Madrugada (entre las 24h00 y las 06h00):** `100%` de recargo (`Valor Hora × 2.00`).\n3. **Horas Extraordinarias (Art. 55 Numeral 2):**\n   - **Definición:** Son las ejecutadas en días sábados, domingos o días de descanso obligatorio (feriados nacionales o locales).\n   - **Recargo:** `100%` de recargo en todos los casos (`Valor Hora × 2.00`).',
      },
      {
        domain: 'ATTENDANCE_AND_OVERTIME',
        userQuery:
          '¿Cómo se calculan las vacaciones anuales en Ecuador y a partir de qué año se ganan días adicionales por antigüedad?',
        assistantResponse:
          'Según los **Artículos 69 y 71 del Código del Trabajo**:\n\n1. **Período Base:** Todo trabajador tiene derecho a gozar anualmente de **15 días** ininterrumpidos de descanso remunerado (incluidos los días no laborables).\n2. **Días Adicionales por Antigüedad:** Quienes hayan prestado servicios por **más de cinco (5) años** al mismo empleador tienen derecho a **un (1) día adicional** de vacaciones por cada año excedente (es decir, a partir del sexto año cumplido tiene 16 días, al séptimo 17 días, etc.), hasta un tope máximo de **15 días adicionales** (30 días totales).\n3. **Fórmula de Liquidación Monetaria (Art. 71):** El valor económico de las vacaciones equivale a la **veinticuatroava parte (`1/24`)** de todo lo percibido por el trabajador durante el año completo de trabajo (incluyendo sueldo básico, horas suplementarias, extraordinarias, comisiones y bonificaciones habituales).',
      },
      {
        domain: 'ATTENDANCE_AND_OVERTIME',
        userQuery:
          '¿Cuántos días de licencia con sueldo corresponden por maternidad, paternidad, período de lactancia y calamidad doméstica en Ecuador?',
        assistantResponse:
          'El Código del Trabajo (Arts. 42 num. 30, 152 y 155) establece las siguientes licencias remuneradas:\n\n1. **Licencia por Maternidad (Art. 152):** **12 semanas** (84 días) con remuneración por el nacimiento de su hijo o hija (en nacimientos múltiples se extiende por 10 días adicionales). El subsidio monetario es cubierto en un `75%` por el IESS (si la afiliada cumple 12 aportaciones mensuales continuas previas) y el `25%` restante lo paga obligatoriamente el empleador.\n2. **Licencia por Paternidad (Art. 152):** **10 días** con remuneración pagados por el empleador (se amplía a 15 días por nacimientos múltiples o cesárea, y a 25 días en casos de nacimiento prematuro o patologías degenerativas).\n3. **Horario de Lactancia (Art. 155):** Durante los **12 meses** posteriores al parto, la jornada diaria de la madre trabajadora es de **6 horas** (2 horas diarias de permiso remunerado para lactancia).\n4. **Calamidad Doméstica / Fallecimiento (Art. 42 num. 30):** **3 días** de licencia con remuneración completa por fallecimiento del cónyuge, conviviente en unión de hecho o parientes dentro del segundo grado de consanguinidad o afinidad.',
      },
      {
        domain: 'PAYROLL_ECUADOR',
        userQuery:
          '¿Cómo se distribuye legalmente el 15% de participación de utilidades a los trabajadores en Ecuador?',
        assistantResponse:
          'De conformidad con el **Artículo 97 del Código del Trabajo**, el empleador debe distribuir el **15% de las utilidades líquidas** del ejercicio fiscal hasta el **15 de abril** del año siguiente, dividido en dos tramos:\n\n1. **10% Universal (Por Tiempo Trabajado):**\n   - Se reparte entre todas las personas trabajadoras (actuales y excolaboradores que laboraron en ese año fiscal) en proporción directa a los días trabajados durante el año, **sin distinción del sueldo o cargo**.\n   - Fórmula individual: `(10% Utilidad Líquida × Días Trabajados por el Empleado) / Suma Total de Días Trabajados de Toda la Plantilla`.\n2. **5% por Cargas Familiares:**\n   - Se entrega únicamente a los trabajadores que acrediten cargas familiares legales: cónyuge o conviviente en unión de hecho legalmente reconocida, hijos menores de 18 años e hijos con discapacidad de cualquier edad.\n   - Se pondera multiplicando el número de cargas del trabajador por sus días trabajados (`Factor Individual = Número de Cargas × Días Trabajados`).\n   - Quienes no tengan cargas familiares no participan en este 5%.',
      },
      {
        domain: 'PAYROLL_ECUADOR',
        userQuery:
          '¿Cómo se calculan y en qué fechas máximas se pagan el Décimo Tercer y Décimo Cuarto sueldo en Ecuador?',
        assistantResponse:
          'Los beneficios adicionales de ley se rigen por los **Artículos 111 y 113 del Código del Trabajo**:\n\n1. **Décimo Tercer Sueldo (Bono Navideño — Art. 111):**\n   - **Base de Cálculo:** Equivale a la doceava parte (`1/12`) de todo lo ganado por el trabajador en el año (sueldo base + horas extras + comisiones + bonos permanentes). No incluye utilidades ni viáticos.\n   - **Modalidad:** Se paga mensualizado en el rol de pagos, salvo solicitud escrita de acumulación.\n   - **Período y Fecha Tope (Acumulado):** Comprende del `1 de diciembre` del año anterior al `30 de noviembre` del año en curso, y se paga hasta el **24 de diciembre**.\n2. **Décimo Cuarto Sueldo (Bono Escolar — Art. 113):**\n   - **Base de Cálculo:** Equivale a un Salario Básico Unificado íntegro (`$460.00 USD` en 2026 para jornada completa de 40h, o `$38.33 USD` mensuales), sin importar cuánto gane el trabajador.\n   - **Fechas Tope (Acumulado):**\n     - **Región Costa e Insular:** Hasta el **15 de marzo** (período: 1 de marzo anterior al último día de febrero).\n     - **Región Sierra y Amazónica:** Hasta el **15 de agosto** (período: 1 de agosto anterior al 31 de julio).',
      },
      {
        domain: 'IESS_SOCIAL_SECURITY',
        userQuery:
          '¿Qué rubros integran la materia gravada del IESS y qué ingresos están exentos de aportación?',
        assistantResponse:
          'Según los **Artículos 11 y 14 de la Ley de Seguridad Social**:\n\n1. **Rubros que SÍ constituyen Materia Gravada (Art. 11):**\n   - Sueldo o salario básico mensual.\n   - Horas suplementarias (50% y 100%) y horas extraordinarias (100%).\n   - Recargos por jornada nocturna (25%).\n   - Comisiones en ventas, bonos de productividad o cumplimiento que tengan carácter normal y habitual.\n2. **Rubros Exentos que NO aportan al IESS (Art. 14):**\n   - Décimo Tercer Sueldo y Décimo Cuarto Sueldo.\n   - Fondos de Reserva (8.33%).\n   - Participación del 15% de utilidades.\n   - Viáticos ocasionales sujetos a liquidación y compensación económica para alcanzar el Salario Digno.\n   - Indemnizaciones por desahucio o despido intempestivo.',
      },
      {
        domain: 'IESS_SOCIAL_SECURITY',
        userQuery:
          '¿Cuándo adquiere el trabajador el derecho a los Fondos de Reserva y qué ocurre si reingresa a la misma empresa?',
        assistantResponse:
          'De acuerdo con los **Artículos 196, 197 y 200 del Código del Trabajo**:\n\n1. **Regla General (Mes 13):** Todo trabajador que preste servicios por **más de un (1) año** al mismo empleador adquiere el derecho a recibir mensualmente el **8.33% (`1/12`)** de su materia gravada por concepto de Fondos de Reserva a partir del **mes trece (13)**.\n2. **Caso de Reingreso a la Misma Empresa (Art. 197):** Si el trabajador se separa o es despedido antes de completar el primer año de servicio y posteriormente vuelve a ser contratado por el **mismo empleador**, se sumará el tiempo de servicio anterior al nuevo para completar el año y pagar los Fondos de Reserva desde que acumule 12 meses entre ambos períodos (o desde el primer día del reingreso si ya había cumplido más de un año en su etapa previa).',
      },
      {
        domain: 'OFFBOARDING_AND_SETTLEMENTS',
        userQuery:
          '¿Qué diferencia existe entre terminar un contrato por Visto Bueno (Art. 172) y por Despido Intempestivo (Art. 188)?',
        assistantResponse:
          'La diferencia jurídica y financiera es radical:\n\n1. **Terminación con Visto Bueno Concedido al Empleador (Art. 172 del Código del Trabajo):**\n   - **Requisito:** Debe tramitarse y obtenerse resolución favorable del Inspector del Trabajo antes de desvincular al empleado, probando una causal legal (ej. más de 3 días consecutivos de faltas injustificadas en el mes, indisciplina grave al reglamento interno aprobado, o falta de probidad).\n   - **Efecto Financiero:** El empleador queda exento de pagar indemnización por despido intempestivo (Art. 188) y bonificación por desahucio (Art. 185). Solo se liquidan los haberes ya devengados: días trabajados del mes, proporcional de Décimo Tercero, Décimo Cuarto y Vacaciones no gozadas.\n2. **Despido Intempestivo (Art. 188 del Código del Trabajo):**\n   - **Definición:** Terminación unilateral ejecutada por el empleador sin causal legal o sin haber obtenido previamente el Visto Bueno.\n   - **Efecto Financiero:** Obliga a pagar de forma acumulada la **Indemnización del Art. 188** (mínimo 3 sueldos hasta 3 años; o 1 sueldo por cada año o fracción si supera los 3 años, tope 25 sueldos) MÁS la **Bonificación por Desahucio del Art. 185** (25% por cada año completo) MÁS todos los proporcionales de ley.',
      },
      {
        domain: 'OFFBOARDING_AND_SETTLEMENTS',
        userQuery:
          '¿Qué indemnización especial protege a una trabajadora embarazada o a una persona con discapacidad ante un despido intempestivo en Ecuador?',
        assistantResponse:
          'La legislación ecuatoriana establece regímenes de estabilidad reforzada e indemnizaciones agravadas:\n\n1. **Despido Ineficaz por Embarazo o Maternidad (Arts. 195.1 y 195.3 del Código del Trabajo):**\n   - El despido de una mujer embarazada o en período de maternidad/lactancia se declara jurídicamente **ineficaz**.\n   - Si la trabajadora decide no reintegrarse a su puesto, el empleador debe pagar una indemnización adicional equivalente a **un (1) año completo de remuneración (12 sueldos)**, además de la indemnización general por despido intempestivo (Art. 188), el desahucio (Art. 185) y los proporcionales de ley.\n2. **Despido de Persona con Discapacidad o Sustituto (Art. 51 de la Ley Orgánica de Discapacidades):**\n   - En caso de despido injustificado de una persona con discapacidad o de quien tenga a su cargo la manutención de una persona con discapacidad severa debidamente calificada, el empleador deberá indemnizarla con un valor equivalente a **dieciocho (18) meses de la mejor remuneración** percibida, adicionalmente a la liquidación legal de los Arts. 185 y 188.',
      },
      {
        domain: 'TAX_SRI_LORTI',
        userQuery:
          '¿Cómo se calcula el Impuesto a la Renta en relación de dependencia ante el SRI y cómo aplica la rebaja por gastos personales?',
        assistantResponse:
          'El cálculo del Impuesto a la Renta en Relación de Dependencia (Art. 10 y 36 de la LORTI) se ejecuta en 4 pasos dentro de Norma ERP:\n\n1. **Determinación de la Base Imponible Anual:**\n   - Se suman todos los ingresos gravados proyectados en el año (Sueldos + Horas Extras + Comisiones + Bonos).\n   - Se resta el **Aporte Personal al IESS (9.45%)** pagado por el trabajador.\n   - *Nota:* El Décimo Tercer Sueldo, Décimo Cuarto Sueldo y Fondos de Reserva son ingresos exentos y no entran en la base imponible.\n2. **Cálculo del Impuesto Causado:**\n   - Se ubica la Base Imponible en la tabla progresiva anual del SRI: `Impuesto Causado = Impuesto sobre Fracción Básica + (% sobre Fracción Excedente × Excedente)`.\n3. **Rebaja por Gastos Personales y Cargas Familiares:**\n   - El trabajador deduce gastos de vivienda, salud, alimentación, educación, vestimenta, arte/cultura y turismo nacional (incluyendo gastos de mascotas).\n   - La rebaja directa al impuesto causado es el **18%** del menor valor entre los gastos declarados y el tope de canastas familiares básicas según su número de cargas familiares (de 7 canastas sin cargas hasta 20 canastas con 5 o más cargas).\n4. **Retención Mensual:**\n   - `Impuesto a Retener Anual = máx(0, Impuesto Causado - Rebaja Gastos Personales)`, dividido para los meses restantes del ejercicio fiscal y reportado en el Anexo RDEP / Formulario 107.',
      },
      {
        domain: 'ACCOUNTING_NIIF_PYMES',
        userQuery:
          '¿Cómo funciona la invariante de partida doble en el módulo de Contabilidad de Norma ERP al contabilizar la nómina?',
        assistantResponse:
          'El módulo de Contabilidad Financiera (`accounting.service.js`) opera bajo **NIIF para PYMES** garantizando la invariante algebraica de partida doble con precisión `Decimal.js`:\n\n1. **Regla de Cuadre Estricto:** Todo asiento en `JournalEntry` valida antes de persistirse que `|Σ Débitos - Σ Créditos| < 0.001` y que el período contable (`AccountingPeriod`) se encuentre en estado `OPEN`.\n2. **Estructura del Asiento Automático de Nómina:**\n   - **Líneas al DEBE (Gastos Operativos / Costo):**\n     - `5.1.01 Sueldos y Salarios Unificados` (Sueldos base devengados).\n     - `5.1.02 Horas Suplementarias y Extraordinarias` (Sobretiempos liquidados).\n     - `5.1.03 Aporte Patronal IESS (11.15% / 12.15%)` (Gasto patronal de seguridad social).\n     - `5.1.04 Fondos de Reserva y Beneficios Mensualizados`.\n   - **Líneas al HABER (Pasivos y Salida de Efectivo):**\n     - `2.1.03 Obligaciones con el IESS por Pagar` (Suma del 9.45% retenido al empleado + 11.15% patronal + Fondos de Reserva acumulados).\n     - `2.1.04 Retenciones Impuesto a la Renta SRI por Pagar`.\n     - `1.1.05 Anticipos de Sueldo a Empleados` (Cruza y amortiza las cuotas de `SalaryAdvance`).\n     - `2.1.01 Sueldos por Pagar / 1.1.02 Bancos` (Líquido neto transferido al colaborador).',
      },
      {
        domain: 'GOVERNANCE_LOPDP_AND_SIGNATURES',
        userQuery:
          '¿Cómo garantiza Norma ERP el cumplimiento de la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador en salarios y geolocalización?',
        assistantResponse:
          'Norma ERP implementa privacidad desde el diseño (*Privacy by Design*) conforme a los Arts. 7, 12 y 37 de la **LOPDP del Ecuador**:\n\n1. **Cifrado de Campo en Reposo (Field-Level Encryption AES-256-GCM):**\n   - Las remuneraciones (`Employee.salary`) y coordenadas GPS (`entryLatitude`, `entryLongitude`) se almacenan cifradas con `AES-256-GCM`, utilizando un vector de inicialización (IV) aleatorio de 96 bits y etiqueta de autenticación criptográfica (`iv:authTag:encryptedData`).\n2. **Minimización de Datos en Geocercas:**\n   - Antes de encriptar las coordenadas de marcación de asistencia, el sistema trunca la latitud y longitud a 4 decimales (~11 metros de precisión), verificando la geocerca mediante la fórmula esférica de Haversine sin exponer rastreo invasivo.\n3. **Consentimiento Explícito y Biometría FIDO2:**\n   - La geolocalización requiere consentimiento registrado (`trackingConsent = true` y `trackingConsentDate`).\n   - La autenticación biométrica emplea el estándar **W3C WebAuthn / FIDO2**: jamás se guardan imágenes faciales ni huellas dactilares en base de datos, sino únicamente claves públicas asimétricas (`publicKey`).',
      },
      {
        domain: 'GOVERNANCE_LOPDP_AND_SIGNATURES',
        userQuery:
          '¿Qué validez legal tienen los roles de pago y actas firmadas electrónicamente en Norma ERP?',
        assistantResponse:
          'Al amparo de los **Artículos 13 y 14 de la Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos del Ecuador**:\n\n1. **Equivalencia Funcional:** La firma electrónica posee igual validez y efectos jurídicos que la firma manuscrita en contratos laborales, roles de pago (`PayrollDetail`) y actas internas.\n2. **Doble Mecanismo Criptográfico en Norma ERP:**\n   - **Firma Electrónica Cualificada (`.p12` / PKCS#12):** Integración con certificados emitidos por entidades acreditadas por ARCOTEL (Banco Central del Ecuador, Security Data, Consejo de la Judicatura).\n   - **Sello Digital SHA-256 con Verificación Pública QR:** Cada documento firmado genera un token criptográfico inmutable verificable en tiempo real desde la ruta pública `/verify-signature`, impidiendo alteraciones posteriores del monto liquidado.',
      },
      {
        domain: 'PERFORMANCE_RECRUITMENT_ENTREPRENEURSHIP',
        userQuery:
          '¿Cómo se integran los módulos de Desempeño 360°, Reclutamiento e Incubadora de Emprendimiento con el ODS 8 en Norma ERP?',
        assistantResponse:
          'Los módulos de desarrollo organizacional materializan las **Metas 8.2, 8.3 y 8.5 de la Agenda 2030**:\n\n1. **Evaluación 360° y Objetivos (`EmployeeEvaluation` / `EmployeeGoal`):** Permite evaluar competencias de forma multidireccional (autoevaluación, pares, subordinados y jefatura) conectadas con el avance porcentual de metas cuantitativas (OKRs), sustentando ascensos y revisiones salariales objetivas (Meta 8.5).\n2. **Reclutamiento Meritocrático (`JobVacancy` / `CandidateEvaluation`):** Estandariza las rúbricas de entrevistas y puntuación técnica de candidatos para erradicar prácticas discriminatorias prohibidas por el Art. 195.4 del Código del Trabajo.\n3. **Incubadora de Emprendimiento (`Entrepreneurship`):** Apoya la Meta 8.3 (formalización e innovación PyME) gestionando proyectos internos o spin-offs con tabla de capitalización (*Cap Table* en `EntrepreneurshipEquity`), rondas de levantamiento de capital (`Pre-Seed`, `Seed`, `Series A`) e indicadores de tracción financiera (`MRR`, `CAC`, `LTV`, `TAM/SAM/SOM`).',
      },
      {
        domain: 'ODS_8_SUSTAINABILITY_METRICS',
        userQuery:
          '¿Es legal que una empresa en Ecuador haga firmar al trabajador una renuncia en blanco al momento de contratarlo o le pague $400 por jornada completa?',
        assistantResponse:
          'Ambas prácticas son **absolutamente ilegales y nulas de pleno derecho** en la República del Ecuador:\n\n1. **Nulidad de Renuncias Anticipadas o Hojas en Blanco (Art. 326 num. 2 de la Constitución y Art. 4 del Código del Trabajo):** Los derechos del trabajador son irrenunciables; será nula toda estipulación en contrario. Obligar a firmar documentos en blanco o renuncias anticipadas carece de validez jurídica, constituye fraude laboral y habilita al trabajador a impugnar el documento (Art. 595) y reclamar indemnización por despido intempestivo (Art. 188).\n2. **Infracción del Salario Básico Unificado (Arts. 81 y 117 del Código del Trabajo):** Ningún contrato de jornada completa (40 horas semanales) puede pactar una remuneración inferior al SBU vigente (`$460.00 USD`). Pagar `$400.00 USD` en jornada completa genera obligación de reliquidar diferencias salariales con recargos legales, glosas en el IESS y degrada inmediatamente el indicador `8.5.2 (Índice de Salario Digno)` de Norma ERP al estado `NEEDS_ATTENTION`.',
      },
    ];
  }

  /**
   * 2. Generador Paramétrico de Escenarios de Liquidación y Finiquitos con Razonamiento Paso a Paso (Decimal.js)
   * Genera decenas de casos matemáticos únicos y exactos para entrenar capacidad aritmética en Qwen 2.5.
   * @private
   */
  getSettlementChainOfThoughtScenarios() {
    const cases = [
      { salary: 460, years: 1, months: 6, causal: 'UNFAIR_DISMISSAL', label: 'operario con SBU' },
      {
        salary: 550,
        years: 2,
        months: 4,
        causal: 'UNFAIR_DISMISSAL',
        label: 'asistente administrativo',
      },
      { salary: 680, years: 3, months: 0, causal: 'UNFAIR_DISMISSAL', label: 'analista contable' },
      { salary: 750, years: 3, months: 2, causal: 'UNFAIR_DISMISSAL', label: 'técnico de soporte' },
      {
        salary: 850,
        years: 4,
        months: 2,
        causal: 'UNFAIR_DISMISSAL',
        label: 'coordinador de logística',
      },
      {
        salary: 980,
        years: 5,
        months: 7,
        causal: 'UNFAIR_DISMISSAL',
        label: 'especialista de nómina',
      },
      {
        salary: 1150,
        years: 6,
        months: 9,
        causal: 'UNFAIR_DISMISSAL',
        label: 'supervisor de planta',
      },
      {
        salary: 1350,
        years: 8,
        months: 3,
        causal: 'UNFAIR_DISMISSAL',
        label: 'jefe de recursos humanos',
      },
      { salary: 1600, years: 10, months: 5, causal: 'UNFAIR_DISMISSAL', label: 'contador general' },
      {
        salary: 1950,
        years: 14,
        months: 1,
        causal: 'UNFAIR_DISMISSAL',
        label: 'gerente de operaciones',
      },
      { salary: 2200, years: 20, months: 8, causal: 'UNFAIR_DISMISSAL', label: 'director técnico' },
      {
        salary: 2500,
        years: 26,
        months: 4,
        causal: 'UNFAIR_DISMISSAL',
        label: 'director financiero (con tope legal de 25 meses)',
      },
      {
        salary: 600,
        years: 2,
        months: 0,
        causal: 'VOLUNTARY_RESIGNATION',
        label: 'auxiliar contable',
      },
      {
        salary: 900,
        years: 4,
        months: 6,
        causal: 'VOLUNTARY_RESIGNATION',
        label: 'analista de compras',
      },
      {
        salary: 1250,
        years: 7,
        months: 3,
        causal: 'VOLUNTARY_RESIGNATION',
        label: 'ingeniero de calidad',
      },
      {
        salary: 1500,
        years: 11,
        months: 0,
        causal: 'VOLUNTARY_RESIGNATION',
        label: 'jefe comercial',
      },
      {
        salary: 720,
        years: 0,
        months: 2,
        causal: 'PROBATION_END',
        label: 'colaborador en período de prueba (60 días)',
      },
      {
        salary: 880,
        years: 3,
        months: 5,
        causal: 'VISTO_BUENO_EMPLOYER',
        label: 'trabajador desvinculado con Visto Bueno concedido (Art. 172)',
      },
      {
        salary: 950,
        years: 2,
        months: 6,
        causal: 'MATERNITY_INEFFECTIVE',
        label: 'trabajadora en estado de embarazo (Despido Ineficaz Art. 195.3)',
      },
      {
        salary: 1100,
        years: 4,
        months: 0,
        causal: 'DISABILITY_DISMISSAL',
        label: 'trabajador con discapacidad calificada (Art. 51 LOD)',
      },
    ];

    return cases.map((c) => {
      const s = new Decimal(c.salary);
      const propMonths = c.months > 0 ? c.months : 6;

      // Art. 185: Desahucio (25% por año completo, no aplica en período de prueba ni en Visto Bueno al empleador)
      const appliesDesahucio =
        c.causal !== 'PROBATION_END' && c.causal !== 'VISTO_BUENO_EMPLOYER' && c.years >= 1;
      const desahucio = appliesDesahucio
        ? s.times(0.25).times(c.years).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        : new Decimal(0);

      // Art. 188: Despido Intempestivo
      let severanceMonths = 0;
      if (
        c.causal === 'UNFAIR_DISMISSAL' ||
        c.causal === 'MATERNITY_INEFFECTIVE' ||
        c.causal === 'DISABILITY_DISMISSAL'
      ) {
        const yearsWithFraction = c.months > 0 ? c.years + 1 : Math.max(1, c.years);
        severanceMonths = Math.min(25, Math.max(3, yearsWithFraction));
      }
      const severance = s.times(severanceMonths).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      // Indemnización especial adicional (Embarazo = 12 sueldos; Discapacidad = 18 sueldos)
      let specialIndemnity = new Decimal(0);
      let specialLabel = '';
      if (c.causal === 'MATERNITY_INEFFECTIVE') {
        specialIndemnity = s.times(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        specialLabel = `- **Indemnización Especial por Despido Ineficaz (Art. 195.3 — 12 remuneraciones):** \`$${specialIndemnity.toFixed(2)} USD\`\n`;
      } else if (c.causal === 'DISABILITY_DISMISSAL') {
        specialIndemnity = s.times(18).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        specialLabel = `- **Indemnización Especial por Discapacidad (Art. 51 LOD — 18 remuneraciones):** \`$${specialIndemnity.toFixed(2)} USD\`\n`;
      }

      // Proporcionales de ley
      const d13 = s.times(propMonths).dividedBy(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const d14 = new Decimal(SBU_ECUADOR_2026)
        .times(propMonths)
        .dividedBy(12)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const vac = s.times(propMonths).dividedBy(24).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const total = desahucio
        .plus(severance)
        .plus(specialIndemnity)
        .plus(d13)
        .plus(d14)
        .plus(vac)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const causalTextMap = {
        UNFAIR_DISMISSAL: 'despido intempestivo',
        VOLUNTARY_RESIGNATION: 'renuncia voluntaria (acuerdo de las partes)',
        PROBATION_END: 'terminación dentro del período de prueba de 90 días',
        VISTO_BUENO_EMPLOYER:
          'Visto Bueno concedido al empleador por el Inspector del Trabajo (Art. 172)',
        MATERNITY_INEFFECTIVE: 'despido intempestivo durante estado de embarazo (Despido Ineficaz)',
        DISABILITY_DISMISSAL: 'despido intempestivo de persona con discapacidad calificada',
      };

      const userQuery = `Calcula paso a paso la liquidación de haberes (Acta de Finiquito) en Ecuador para un ${c.label} con sueldo mensual de $${s.toFixed(2)} USD, tiempo de servicio de ${c.years} año(s) y ${c.months} mes(es), desvinculado por ${causalTextMap[c.causal]} (asumiendo ${propMonths} meses acumulados para proporcionales del período en curso).`;

      const assistantResponse = [
        `### Liquidación Jurídica y Aritmética de Finiquito (Norma ERP — Decimal.js)`,
        `**Parámetros de Entrada:**`,
        `- **Última Remuneración Mensual:** \`$${s.toFixed(2)} USD\``,
        `- **Tiempo de Servicio:** \`${c.years} año(s) y ${c.months} mes(es)\``,
        `- **Causal Legal:** ${causalTextMap[c.causal]}`,
        ``,
        `#### 1. Cálculo de Indemnizaciones y Bonificaciones`,
        appliesDesahucio
          ? `- **Bonificación por Desahucio (Art. 185 del Código del Trabajo):** Corresponde el \`25%\` de la última remuneración por cada año completo cumplido (\`${c.years} años × 0.25 × $${s.toFixed(2)}\`) = **\`$${desahucio.toFixed(2)} USD\`**.`
          : `- **Bonificación por Desahucio (Art. 185):** **\`$0.00 USD\`** (${c.causal === 'VISTO_BUENO_EMPLOYER' ? 'Exento por Visto Bueno concedido al empleador según Art. 172' : 'No cumple al menos 1 año completo de servicio'}).`,
        severanceMonths > 0
          ? `- **Indemnización por Despido Intempestivo (Art. 188 del Código del Trabajo):** Al computarse la fracción de año como año completo (escala mínima 3 meses, máxima 25 meses), corresponden **\`${severanceMonths} remuneraciones\`** (\`${severanceMonths} × $${s.toFixed(2)}\`) = **\`$${severance.toFixed(2)} USD\`**.`
          : `- **Indemnización por Despido Intempestivo (Art. 188):** **\`$0.00 USD\`** (No aplica para la causal de ${causalTextMap[c.causal]}).`,
        specialLabel ? specialLabel.trim() : null,
        ``,
        `#### 2. Cálculo de Haberes Proporcionales (${propMonths} meses devengados)`,
        `- **Décimo Tercer Sueldo Proporcional (Art. 111 — 1/12):** \`($${s.toFixed(2)} × ${propMonths}) / 12\` = **\`$${d13.toFixed(2)} USD\`**.`,
        `- **Décimo Cuarto Sueldo Proporcional (Art. 113 — sobre SBU $${SBU_ECUADOR_2026.toFixed(2)}):** \`($${SBU_ECUADOR_2026.toFixed(2)} × ${propMonths}) / 12\` = **\`$${d14.toFixed(2)} USD\`**.`,
        `- **Vacaciones No Gozadas Proporcionales (Art. 69 y 71 — 1/24):** \`($${s.toFixed(2)} × ${propMonths}) / 24\` = **\`$${vac.toFixed(2)} USD\`**.`,
        ``,
        `#### 3. Total Neto a Liquidar en el Acta de Finiquito (SUT)`,
        `- **TOTAL LIQUIDACIÓN:** \`$${desahucio.toFixed(2)} + $${severance.toFixed(2)}${specialIndemnity.greaterThan(0) ? ` + $${specialIndemnity.toFixed(2)}` : ''} + $${d13.toFixed(2)} + $${d14.toFixed(2)} + $${vac.toFixed(2)}\` = **\`$${total.toFixed(2)} USD\`**.`,
        `- **Gobernanza ODS 8 (Meta 8.8.2):** El acta debe emitirse con firma electrónica o sello criptográfico SHA-256 y registrarse en el SUT del Ministerio del Trabajo dentro de los 30 días posteriores al cese.`,
      ]
        .filter(Boolean)
        .join('\n');

      return {
        domain: 'OFFBOARDING_AND_SETTLEMENTS',
        userQuery,
        assistantResponse,
      };
    });
  }

  /**
   * 3. Generador Paramétrico de Roles de Pago, Sobretiempos y Asientos Contables NIIF (Partida Doble)
   * @private
   */
  getPayrollAndAccountingNIIFScenarios() {
    const payrollCases = [
      {
        salary: 460,
        suppHours: 0,
        extraHours: 0,
        nightHours: 0,
        hasReserveFund: false,
        advance: 0,
        role: 'Auxiliar Operativo',
      },
      {
        salary: 520,
        suppHours: 6,
        extraHours: 4,
        nightHours: 0,
        hasReserveFund: true,
        advance: 50,
        role: 'Asistente de Bodega',
      },
      {
        salary: 650,
        suppHours: 8,
        extraHours: 0,
        nightHours: 10,
        hasReserveFund: true,
        advance: 0,
        role: 'Operador de Turno Nocturno',
      },
      {
        salary: 780,
        suppHours: 10,
        extraHours: 6,
        nightHours: 0,
        hasReserveFund: true,
        advance: 100,
        role: 'Técnico de Mantenimiento',
      },
      {
        salary: 920,
        suppHours: 4,
        extraHours: 8,
        nightHours: 0,
        hasReserveFund: false,
        advance: 0,
        role: 'Analista de Tesorería (8 meses de antigüedad)',
      },
      {
        salary: 1100,
        suppHours: 12,
        extraHours: 5,
        nightHours: 0,
        hasReserveFund: true,
        advance: 150,
        role: 'Desarrollador de Software',
      },
      {
        salary: 1350,
        suppHours: 5,
        extraHours: 4,
        nightHours: 8,
        hasReserveFund: true,
        advance: 0,
        role: 'Coordinador de Producción',
      },
      {
        salary: 1600,
        suppHours: 0,
        extraHours: 6,
        nightHours: 0,
        hasReserveFund: true,
        advance: 200,
        role: 'Contador Senior',
      },
      {
        salary: 1850,
        suppHours: 8,
        extraHours: 0,
        nightHours: 0,
        hasReserveFund: true,
        advance: 0,
        role: 'Jefe de Planta',
      },
      {
        salary: 2400,
        suppHours: 0,
        extraHours: 0,
        nightHours: 0,
        hasReserveFund: true,
        advance: 300,
        role: 'Gerente Comercial',
      },
    ];

    return payrollCases.map((p) => {
      const base = new Decimal(p.salary);
      const hourly = base.dividedBy(240);
      const suppPay = hourly
        .times(1.5)
        .times(p.suppHours)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const extraPay = hourly
        .times(2.0)
        .times(p.extraHours)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const nightPay = hourly
        .times(0.25)
        .times(p.nightHours)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const totalOvertime = suppPay
        .plus(extraPay)
        .plus(nightPay)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      // Materia gravada IESS (Art. 11 Ley Seguridad Social)
      const taxableIess = base.plus(totalOvertime).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const iessPersonal = taxableIess.times(0.0945).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const iessPatronal = taxableIess.times(0.1115).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      // Fondos de reserva (8.33% si supera 1 año)
      const reserveFund = p.hasReserveFund
        ? taxableIess.dividedBy(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        : new Decimal(0);

      const advanceDec = new Decimal(p.advance);
      const totalIncome = taxableIess.plus(reserveFund).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const totalDeductions = iessPersonal
        .plus(advanceDec)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const netPay = totalIncome.minus(totalDeductions).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      // Cuadre de Partida Doble para el Asiento Contable NIIF
      const totalDebit = base
        .plus(totalOvertime)
        .plus(iessPatronal)
        .plus(reserveFund)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const iessPayableTotal = iessPersonal
        .plus(iessPatronal)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const totalCredit = iessPayableTotal
        .plus(advanceDec)
        .plus(netPay)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const userQuery =
        `Calcula el rol de pagos mensual y genera el asiento contable NIIF por partida doble en Ecuador para un ${p.role} con sueldo base de $${base.toFixed(2)} USD, ` +
        `${p.suppHours}h suplementarias (50%), ${p.extraHours}h extraordinarias (100%), ${p.nightHours}h con recargo nocturno (25%), ` +
        `${p.hasReserveFund ? 'con derecho a Fondos de Reserva mensualizados (más de 1 año de servicio)' : 'sin Fondos de Reserva aún (menos de 1 año)'}` +
        `${p.advance > 0 ? ` y un descuento por anticipo de sueldo de $${advanceDec.toFixed(2)} USD.` : '.'}`;

      const assistantResponse = [
        `### Liquidación de Rol de Pagos y Contabilización NIIF (Norma ERP)`,
        `#### 1. Ingresos y Materia Gravada del IESS`,
        `- **Sueldo Base Mensual:** \`$${base.toFixed(2)} USD\` (Valor hora ordinaria = \`$${base.toFixed(2)} / 240 = $${hourly.toDecimalPlaces(4).toFixed(4)} USD\`)`,
        `- **Horas Suplementarias 50% (Art. 55.1 — ${p.suppHours}h × Factor 1.50):** \`$${suppPay.toFixed(2)} USD\``,
        `- **Horas Extraordinarias 100% (Art. 55.2 — ${p.extraHours}h × Factor 2.00):** \`$${extraPay.toFixed(2)} USD\``,
        `- **Recargo Nocturno 25% (Art. 49 — ${p.nightHours}h × Factor 0.25):** \`$${nightPay.toFixed(2)} USD\``,
        `- **Total Materia Gravada IESS (Art. 11 LSS):** **\`$${taxableIess.toFixed(2)} USD\`**`,
        `- **Fondos de Reserva (Art. 196 — 8.33% exento de IESS):** **\`$${reserveFund.toFixed(2)} USD\`**`,
        `- **TOTAL INGRESOS BRUTOS:** **\`$${totalIncome.toFixed(2)} USD\`**`,
        ``,
        `#### 2. Deducciones Legales y Líquido a Pagar`,
        `- **Aporte Personal IESS (9.45% sobre $${taxableIess.toFixed(2)}):** \`$${iessPersonal.toFixed(2)} USD\``,
        `- **Amortización Anticipo de Sueldo (\`SalaryAdvance\`):** \`$${advanceDec.toFixed(2)} USD\``,
        `- **LÍQUIDO NETO A RECIBIR (Transferencia Bancaria):** **\`$${netPay.toFixed(2)} USD\`**`,
        `- **Costo Patronal Adicional IESS (11.15% sobre $${taxableIess.toFixed(2)}):** \`$${iessPatronal.toFixed(2)} USD\``,
        ``,
        `#### 3. Asiento Contable de Diario NIIF (\`JournalEntry\` — Partida Doble)`,
        `| Código | Cuenta Contable | Debe (Débito) | Haber (Crédito) |`,
        `| :--- | :--- | ---: | ---: |`,
        `| \`5.1.01\` | Gasto Sueldos y Salarios Unificados | \`$${base.toFixed(2)}\` | \`$0.00\` |`,
        `| \`5.1.02\` | Gasto Horas Extras y Recargos Legales | \`$${totalOvertime.toFixed(2)}\` | \`$0.00\` |`,
        `| \`5.1.03\` | Gasto Aporte Patronal IESS (11.15%) | \`$${iessPatronal.toFixed(2)}\` | \`$0.00\` |`,
        `| \`5.1.04\` | Gasto Fondos de Reserva Mensualizados | \`$${reserveFund.toFixed(2)}\` | \`$0.00\` |`,
        `| \`2.1.03\` | Obligaciones IESS por Pagar (9.45% + 11.15%) | \`$0.00\` | \`$${iessPayableTotal.toFixed(2)}\` |`,
        p.advance > 0
          ? `| \`1.1.05\` | Anticipos de Sueldo a Empleados | \`$0.00\` | \`$${advanceDec.toFixed(2)}\` |`
          : null,
        `| \`2.1.01\` | Bancos / Sueldos por Pagar (Líquido Neto) | \`$0.00\` | \`$${netPay.toFixed(2)}\` |`,
        `| **TOTAL** | **Verificación de Cuadre Contable (\`Σ Debe = Σ Haber\`)** | **\`$${totalDebit.toFixed(2)}\`** | **\`$${totalCredit.toFixed(2)}\`** |`,
      ]
        .filter(Boolean)
        .join('\n');

      return {
        domain: 'ACCOUNTING_NIIF_PYMES',
        userQuery,
        assistantResponse,
      };
    });
  }

  /**
   * 3.1 Escenarios Paramétricos de Sobretiempos (Art. 55) y Vacaciones por Antigüedad (Art. 69)
   * @private
   */
  getOvertimeAndVacationScenarios() {
    const cases = [
      { salary: 460, supp50: 8, extra100: 4, yearsWorked: 2 },
      { salary: 600, supp50: 10, extra100: 6, yearsWorked: 5 },
      { salary: 750, supp50: 12, extra100: 8, yearsWorked: 6 },
      { salary: 900, supp50: 6, extra100: 10, yearsWorked: 8 },
      { salary: 1080, supp50: 15, extra100: 5, yearsWorked: 10 },
      { salary: 1200, supp50: 4, extra100: 12, yearsWorked: 12 },
      { salary: 1500, supp50: 10, extra100: 0, yearsWorked: 15 },
      { salary: 1800, supp50: 0, extra100: 16, yearsWorked: 22 },
    ];

    return cases.map((c) => {
      const s = new Decimal(c.salary);
      const hourly = s.dividedBy(240);
      const pay50 = hourly.times(1.5).times(c.supp50).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const pay100 = hourly.times(2.0).times(c.extra100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const totalOvertime = pay50.plus(pay100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const extraVacDays = c.yearsWorked > 5 ? Math.min(15, c.yearsWorked - 5) : 0;
      const totalVacDays = 15 + extraVacDays;
      const annualEarnings = s
        .plus(totalOvertime)
        .times(12)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const baseVacationPay = annualEarnings
        .dividedBy(24)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      return {
        domain: 'ATTENDANCE_AND_OVERTIME',
        userQuery: `Un colaborador en Ecuador percibe un sueldo mensual de $${s.toFixed(2)} USD, registra en el mes ${c.supp50} horas suplementarias diurnas (50%) y ${c.extra100} horas extraordinarias en feriado/domingo (100%), y cumple ${c.yearsWorked} años de servicio continuo en la empresa. Calcula el pago exacto de sobretiempos del mes, cuántos días de vacaciones le corresponden por ley (Art. 69) y la provisión anual de vacaciones (1/24).`,
        assistantResponse: [
          `### Cálculo de Sobretiempos (Art. 55) y Vacaciones por Antigüedad (Art. 69)`,
          `#### 1. Liquidación de Horas Suplementarias y Extraordinarias`,
          `- **Valor Hora Ordinaria (Art. 55):** \`$${s.toFixed(2)} / 240\` = \`$${hourly.toDecimalPlaces(4).toFixed(4)} USD/hora\``,
          `- **Horas Suplementarias 50% (${c.supp50}h × Factor 1.50):** \`$${pay50.toFixed(2)} USD\``,
          `- **Horas Extraordinarias 100% (${c.extra100}h × Factor 2.00):** \`$${pay100.toFixed(2)} USD\``,
          `- **Total Sobretiempos del Mes:** **\`$${totalOvertime.toFixed(2)} USD\`** (Materia gravada mensual proyectada: \`$${s.plus(totalOvertime).toFixed(2)} USD\`).`,
          ``,
          `#### 2. Días de Vacaciones Anuales y Antigüedad (Art. 69 del Código del Trabajo)`,
          `- **Días Base Legales:** \`15 días\``,
          `- **Días Adicionales por Antigüedad (${c.yearsWorked} años cumplidos):** \`${extraVacDays} día(s) adicional(es)\` (${c.yearsWorked > 5 ? '1 día por cada año excedente a partir del 5to año, tope 15 días' : 'Aplica a partir de más de 5 años de servicio'}).`,
          `- **Total Días de Descanso Remunerado:** **\`${totalVacDays} días\`**.`,
          `- **Base de Liquidación Monetaria Anual (Art. 71 — 1/24 de lo percibido en el año):** Sobre un ingreso anual proyectado de \`$${annualEarnings.toFixed(2)} USD\`, la veinticuatroava parte base equivale a **\`$${baseVacationPay.toFixed(2)} USD\`**.`,
        ].join('\n'),
      };
    });
  }

  /**
   * 3.2 Escenarios Paramétricos de Participación de Utilidades (15% Art. 97) y Tributación SRI (LORTI)
   * @private
   */
  getProfitSharingAndTaxSriScenarios() {
    const scenarios = [];

    // A. Casos de reparto del 15% de utilidades líquidas (Art. 97)
    const profitCases = [
      {
        netProfit: 80000,
        totalDaysAll: 3600,
        empDays: 360,
        empLoads: 2,
        totalWeightedLoadsDays: 5400,
      },
      {
        netProfit: 150000,
        totalDaysAll: 7200,
        empDays: 360,
        empLoads: 0,
        totalWeightedLoadsDays: 9000,
      },
      {
        netProfit: 240000,
        totalDaysAll: 10800,
        empDays: 270,
        empLoads: 3,
        totalWeightedLoadsDays: 14400,
      },
      {
        netProfit: 50000,
        totalDaysAll: 1800,
        empDays: 180,
        empLoads: 1,
        totalWeightedLoadsDays: 2400,
      },
      {
        netProfit: 320000,
        totalDaysAll: 14400,
        empDays: 360,
        empLoads: 4,
        totalWeightedLoadsDays: 18000,
      },
    ];

    for (const p of profitCases) {
      const profit = new Decimal(p.netProfit);
      const pool15 = profit.times(0.15).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const pool10 = profit.times(0.1).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const pool5 = profit.times(0.05).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const empShare10 = pool10
        .times(p.empDays)
        .dividedBy(p.totalDaysAll)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const empWeight5 = p.empDays * p.empLoads;
      const empShare5 =
        p.empLoads > 0
          ? pool5
              .times(empWeight5)
              .dividedBy(p.totalWeightedLoadsDays)
              .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
          : new Decimal(0);

      const totalEmpProfit = empShare10.plus(empShare5).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      scenarios.push({
        domain: 'PAYROLL_ECUADOR',
        userQuery: `Una empresa PyME en Ecuador obtuvo una utilidad líquida anual de $${profit.toFixed(2)} USD. La suma de días trabajados de toda la plantilla es ${p.totalDaysAll} días y el factor ponderado total (días × cargas familiares) de la empresa es ${p.totalWeightedLoadsDays}. Calcula cuánto recibe por participación de utilidades (Art. 97 del Código del Trabajo) un colaborador que laboró ${p.empDays} días en el año y tiene ${p.empLoads} carga(s) familiar(es) legalmente registrada(s).`,
        assistantResponse: [
          `### Cálculo de Participación de Utilidades (Art. 97 del Código del Trabajo — 15%)`,
          `#### 1. Fondo Global Repartible (15% = 10% General + 5% Cargas Familiares)`,
          `- **Utilidad Líquida del Ejercicio:** \`$${profit.toFixed(2)} USD\``,
          `- **Fondo Total 15% Trabajadores:** \`$${pool15.toFixed(2)} USD\``,
          `  - **Bolsa del 10% (Todos los trabajadores según días laborados):** \`$${pool10.toFixed(2)} USD\``,
          `  - **Bolsa del 5% (Ponderado por cargas familiares):** \`$${pool5.toFixed(2)} USD\``,
          ``,
          `#### 2. Liquidación Individual del Colaborador (${p.empDays} días | ${p.empLoads} cargas)`,
          `- **Alicuota del 10% Universal:** \`($${pool10.toFixed(2)} × ${p.empDays}) / ${p.totalDaysAll}\` = **\`$${empShare10.toFixed(2)} USD\`**`,
          p.empLoads > 0
            ? `- **Alicuota del 5% por Cargas Familiares (Factor individual = ${p.empDays} × ${p.empLoads} = ${empWeight5}):** \`($${pool5.toFixed(2)} × ${empWeight5}) / ${p.totalWeightedLoadsDays}\` = **\`$${empShare5.toFixed(2)} USD\`**`
            : `- **Alicuota del 5% por Cargas Familiares:** **\`$0.00 USD\`** (El colaborador no registra cargas familiares; su parte se redistribuye entre quienes sí acreditan cargas).`,
          `- **TOTAL UTILIDADES A PERCIBIR HASTA EL 15 DE ABRIL:** **\`$${totalEmpProfit.toFixed(2)} USD\`** *(Exento de aportación al IESS según Art. 14 LSS, pero gravado para Impuesto a la Renta SRI)*.`,
        ].join('\n'),
      });
    }

    // B. Casos de Impuesto a la Renta en Relación de Dependencia (SRI)
    const taxCases = [
      {
        monthlySalary: 1400,
        loads: 0,
        personalExpenses: 5000,
        basicFraction: 11902,
        marginalBase: 11902,
        baseTax: 0,
        marginalRate: 0.05,
      },
      {
        monthlySalary: 1850,
        loads: 2,
        personalExpenses: 8500,
        basicFraction: 11902,
        marginalBase: 18938,
        baseTax: 511,
        marginalRate: 0.12,
      },
      {
        monthlySalary: 2600,
        loads: 3,
        personalExpenses: 11000,
        basicFraction: 11902,
        marginalBase: 24967,
        baseTax: 1235,
        marginalRate: 0.15,
      },
      {
        monthlySalary: 3500,
        loads: 4,
        personalExpenses: 13500,
        basicFraction: 11902,
        marginalBase: 32793,
        baseTax: 2409,
        marginalRate: 0.2,
      },
      {
        monthlySalary: 4800,
        loads: 1,
        personalExpenses: 7000,
        basicFraction: 11902,
        marginalBase: 43247,
        baseTax: 4500,
        marginalRate: 0.25,
      },
    ];

    for (const t of taxCases) {
      const mSal = new Decimal(t.monthlySalary);
      const grossAnnual = mSal.times(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const iessAnnual = grossAnnual.times(0.0945).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const taxableBase = grossAnnual.minus(iessAnnual).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const excess = Decimal.max(0, taxableBase.minus(t.marginalBase));
      const causedTax = new Decimal(t.baseTax)
        .plus(excess.times(t.marginalRate))
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const rebate = new Decimal(t.personalExpenses)
        .times(0.18)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const netAnnualTax = Decimal.max(0, causedTax.minus(rebate)).toDecimalPlaces(
        2,
        Decimal.ROUND_HALF_UP
      );
      const monthlyWithholding = netAnnualTax
        .dividedBy(12)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      scenarios.push({
        domain: 'TAX_SRI_LORTI',
        userQuery: `Determina la base imponible anual, el Impuesto a la Renta causado, la rebaja del 18% por gastos personales y la retención mensual ante el SRI en Ecuador para un empleado en relación de dependencia con sueldo mensual de $${mSal.toFixed(2)} USD, ${t.loads} carga(s) familiar(es) y gastos personales válidos aplicables de $${t.personalExpenses.toFixed(2)} USD.`,
        assistantResponse: [
          `### Liquidación de Impuesto a la Renta en Relación de Dependencia (SRI — LORTI)`,
          `#### 1. Determinación de la Base Imponible Anual`,
          `- **Ingresos Gravados Anuales (\`$${mSal.toFixed(2)} × 12\`):** \`$${grossAnnual.toFixed(2)} USD\` *(Se excluyen Décimo 3ro, Décimo 4to y Fondos de Reserva por ser rentas exentas Art. 10 LORTI)*.`,
          `- **(-) Deducción Aporte Personal IESS (9.45%):** \`-$${iessAnnual.toFixed(2)} USD\``,
          `- **(=) Base Imponible Gravada SRI:** **\`$${taxableBase.toFixed(2)} USD\`**`,
          ``,
          `#### 2. Impuesto Causado, Rebaja por Gastos Personales y Retención`,
          `- **Fracción Básica del Tramo:** \`$${t.marginalBase.toFixed(2)} USD\` (Impuesto sobre fracción básica: \`$${t.baseTax.toFixed(2)} USD\` | Tarifa marginal: \`${(t.marginalRate * 100).toFixed(0)}%\`)`,
          `- **Impuesto a la Renta Causado:** \`$${t.baseTax.toFixed(2)} + (($${taxableBase.toFixed(2)} - $${t.marginalBase.toFixed(2)}) × ${t.marginalRate})\` = **\`$${causedTax.toFixed(2)} USD\`**`,
          `- **(-) Rebaja por Gastos Personales (18% sobre $${t.personalExpenses.toFixed(2)} USD con ${t.loads} cargas):** \`-$${rebate.toFixed(2)} USD\``,
          `- **(=) Impuesto a la Renta Anual a Pagar:** **\`$${netAnnualTax.toFixed(2)} USD\`**`,
          `- **Retención Mensual en Rol de Pagos (Anexo RDEP / Form. 107):** **\`$${monthlyWithholding.toFixed(2)} USD/mes\`**.`,
        ].join('\n'),
      });
    }

    return scenarios;
  }

  /**
   * 3.3 Escenarios Paramétricos de Provisiones Contables Mensuales de Beneficios Sociales (NIIF Sección 28)
   * @private
   */
  getAccountingMonthlyProvisionsScenarios() {
    const cases = [
      { headcount: 10, totalPayrollGravada: 7500, eligibleReserveCount: 8, reservePayroll: 6200 },
      {
        headcount: 25,
        totalPayrollGravada: 19500,
        eligibleReserveCount: 20,
        reservePayroll: 16400,
      },
      {
        headcount: 45,
        totalPayrollGravada: 38000,
        eligibleReserveCount: 40,
        reservePayroll: 34500,
      },
      {
        headcount: 60,
        totalPayrollGravada: 54000,
        eligibleReserveCount: 55,
        reservePayroll: 50000,
      },
    ];

    return cases.map((c) => {
      const mass = new Decimal(c.totalPayrollGravada);
      const resMass = new Decimal(c.reservePayroll);

      const provD13 = mass.dividedBy(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const provD14 = new Decimal(SBU_ECUADOR_2026)
        .times(c.headcount)
        .dividedBy(12)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const provVac = mass.dividedBy(24).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const provReserve = resMass.dividedBy(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const totalProvisions = provD13
        .plus(provD14)
        .plus(provVac)
        .plus(provReserve)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      return {
        domain: 'ACCOUNTING_NIIF_PYMES',
        userQuery: `Genera el cálculo y asiento contable NIIF de provisiones mensuales de beneficios sociales acumulados en Ecuador para una empresa con ${c.headcount} colaboradores a tiempo completo, cuya masa salarial gravada del mes es $${mass.toFixed(2)} USD (de la cual $${resMass.toFixed(2)} USD corresponden a ${c.eligibleReserveCount} empleados con más de 1 año que acumulan Fondos de Reserva).`,
        assistantResponse: [
          `### Contabilización de Provisiones Mensuales de Beneficios Sociales (NIIF PYMES Sección 28)`,
          `#### 1. Cálculo de Provisiones con Precisión Decimal.js`,
          `- **Provisión Décimo Tercer Sueldo (Art. 111 — 1/12 de $${mass.toFixed(2)}):** \`$${provD13.toFixed(2)} USD\``,
          `- **Provisión Décimo Cuarto Sueldo (Art. 113 — ${c.headcount} empleados × $${SBU_ECUADOR_2026.toFixed(2)} / 12):** \`$${provD14.toFixed(2)} USD\``,
          `- **Provisión Vacaciones Anuales (Art. 69 — 1/24 de $${mass.toFixed(2)}):** \`$${provVac.toFixed(2)} USD\``,
          `- **Provisión Fondos de Reserva (Art. 196 — 1/12 sobre $${resMass.toFixed(2)}):** \`$${provReserve.toFixed(2)} USD\``,
          `- **Total Gasto Devengado por Beneficios Sociales del Mes:** **\`$${totalProvisions.toFixed(2)} USD\`**`,
          ``,
          `#### 2. Asiento Contable en Libro Diario (\`JournalEntry\` — Partida Doble)`,
          `| Código | Cuenta Contable | Debe (Débito) | Haber (Crédito) |`,
          `| :--- | :--- | ---: | ---: |`,
          `| \`5.1.05\` | Gasto Provisión Décimo Tercer Sueldo | \`$${provD13.toFixed(2)}\` | \`$0.00\` |`,
          `| \`5.1.06\` | Gasto Provisión Décimo Cuarto Sueldo | \`$${provD14.toFixed(2)}\` | \`$0.00\` |`,
          `| \`5.1.07\` | Gasto Provisión Vacaciones | \`$${provVac.toFixed(2)}\` | \`$0.00\` |`,
          `| \`5.1.08\` | Gasto Provisión Fondos de Reserva | \`$${provReserve.toFixed(2)}\` | \`$0.00\` |`,
          `| \`2.1.05\` | Pasivo Acumulado Décimo Tercer Sueldo por Pagar | \`$0.00\` | \`$${provD13.toFixed(2)}\` |`,
          `| \`2.1.06\` | Pasivo Acumulado Décimo Cuarto Sueldo por Pagar | \`$0.00\` | \`$${provD14.toFixed(2)}\` |`,
          `| \`2.1.07\` | Pasivo Acumulado Vacaciones por Pagar | \`$0.00\` | \`$${provVac.toFixed(2)}\` |`,
          `| \`2.1.08\` | Pasivo Fondos de Reserva IESS por Pagar | \`$0.00\` | \`$${provReserve.toFixed(2)}\` |`,
          `| **TOTAL** | **Cuadre de Partida Doble (\`Σ Debe = Σ Haber\`)** | **\`$${totalProvisions.toFixed(2)}\`** | **\`$${totalProvisions.toFixed(2)}\`** |`,
        ].join('\n'),
      };
    });
  }

  /**
   * 4. Escenarios de Auditoría de Indicadores ODS 8 sobre Datos de Tenant en JSON
   * @private
   */
  getOds8TenantAuditScenarios() {
    const auditCases = [
      {
        company: 'Comercial Andina S.A.',
        totalEmp: 40,
        withContract: 34,
        iessCompliantDetails: 38,
        totalDetails: 40,
        subSbu: 2,
        overtimeRatio: 1.0,
        settlementRate: 100.0,
      },
      {
        company: 'Textiles del Austro Cía. Ltda.',
        totalEmp: 80,
        withContract: 80,
        iessCompliantDetails: 80,
        totalDetails: 80,
        subSbu: 0,
        overtimeRatio: 1.0,
        settlementRate: 100.0,
      },
      {
        company: 'Agroexportadora Litoral S.A.',
        totalEmp: 50,
        withContract: 35,
        iessCompliantDetails: 35,
        totalDetails: 50,
        subSbu: 8,
        overtimeRatio: 0.85,
        settlementRate: 75.0,
      },
      {
        company: 'Servicios Tecnológicos Quito S.A.S.',
        totalEmp: 25,
        withContract: 24,
        iessCompliantDetails: 25,
        totalDetails: 25,
        subSbu: 0,
        overtimeRatio: 0.85,
        settlementRate: 100.0,
      },
      {
        company: 'Logística Integral Guayas S.A.',
        totalEmp: 60,
        withContract: 54,
        iessCompliantDetails: 51,
        totalDetails: 60,
        subSbu: 3,
        overtimeRatio: 1.0,
        settlementRate: 90.0,
      },
    ];

    return auditCases.map((a) => {
      const m831 = new Decimal(a.withContract).dividedBy(a.totalEmp).times(100).toDecimalPlaces(2);
      const m851 = new Decimal(a.iessCompliantDetails)
        .dividedBy(a.totalDetails)
        .times(100)
        .toDecimalPlaces(2);
      const m852 = new Decimal(a.totalEmp - a.subSbu)
        .dividedBy(a.totalEmp)
        .times(100)
        .toDecimalPlaces(2);
      const m881 = new Decimal(a.overtimeRatio);
      const m882 = new Decimal(a.settlementRate);

      const overall = m831
        .times(0.25)
        .plus(m851.times(0.25))
        .plus(m852.times(0.2))
        .plus(m881.times(100).times(0.15))
        .plus(m882.times(0.15))
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const level = overall.lessThan(75) ? 'CRÍTICO' : overall.lessThan(90) ? 'MODERADO' : 'ALTO';

      const inputContext = JSON.stringify(
        {
          tenant: a.company,
          totalActiveEmployees: a.totalEmp,
          employeesWithActiveContract: a.withContract,
          payrollDetailsAudited: a.totalDetails,
          payrollDetailsWithIess: a.iessCompliantDetails,
          employeesBelowSbu460: a.subSbu,
          overtimeCompensationRatio: a.overtimeRatio,
          verifiedSettlementsPercent: a.settlementRate,
        },
        null,
        2
      );

      const userQuery = `Audita las métricas operativas del tenant "${a.company}", calcula los 5 indicadores del ODS 8 con su ponderación oficial en Norma ERP y emite el dictamen de remediación legal.`;

      const assistantResponse = [
        `### Auditoría Algorítmica de Sostenibilidad ODS 8 — ${a.company}`,
        `#### 1. Cálculo de los 5 Indicadores Troncales (Decimal.js)`,
        `- **Indicador 8.3.1 (Tasa de Formalidad Contractual — Peso 25%):** \`(${a.withContract} / ${a.totalEmp}) × 100\` = **\`${m831.toFixed(2)}%\`** (${m831.greaterThanOrEqualTo(95) ? 'CONFORME' : 'OBSERVADO'}).`,
        `- **Indicador 8.5.1 (Cobertura de Seguridad Social IESS — Peso 25%):** \`(${a.iessCompliantDetails} / ${a.totalDetails}) × 100\` = **\`${m851.toFixed(2)}%\`** (${m851.greaterThanOrEqualTo(95) ? 'CONFORME' : 'OBSERVADO'}).`,
        `- **Indicador 8.5.2 (Cumplimiento SBU $${SBU_ECUADOR_2026.toFixed(2)} USD — Peso 20%):** \`(${a.totalEmp - a.subSbu} / ${a.totalEmp}) × 100\` = **\`${m852.toFixed(2)}%\`** (${m852.equals(100) ? 'CONFORME' : 'OBSERVADO'}).`,
        `- **Indicador 8.8.1 (Ratio de Compensación de Horas Extras — Peso 15%):** **\`${m881.toFixed(2)}\`** (${m881.greaterThanOrEqualTo(0.95) ? 'CONFORME' : 'OBSERVADO'}).`,
        `- **Indicador 8.8.2 (Transparencia en Finiquitos — Peso 15%):** **\`${m882.toFixed(2)}%\`** (${m882.greaterThanOrEqualTo(95) ? 'CONFORME' : 'OBSERVADO'}).`,
        ``,
        `#### 2. Puntaje Global Ponderado ODS 8`,
        `- **Fórmula:** \`(0.25 × ${m831.toFixed(2)}) + (0.25 × ${m851.toFixed(2)}) + (0.20 × ${m852.toFixed(2)}) + (0.15 × ${m881.times(100).toFixed(2)}) + (0.15 × ${m882.toFixed(2)})\``,
        `- **Índice Global ODS 8:** **\`${overall.toFixed(2)}%\`** → Nivel de Cumplimiento: **\`${level}\`**.`,
        ``,
        `#### 3. Dictamen Jurídico de Remediación`,
        a.withContract < a.totalEmp
          ? `- **Contingencia en Formalización (Art. 19 y 20 Código del Trabajo):** Existen \`${a.totalEmp - a.withContract}\` colaboradores activos sin contrato vigente registrado. Debe suscribirse y subirse el contrato al SUT dentro del plazo legal de 15 días.`
          : `- **Formalidad Contractual:** 100% de contratos vigentes y auditados.`,
        a.subSbu > 0
          ? `- **Infracción de Salario Básico (Arts. 81 y 117 Código del Trabajo):** Se detectan \`${a.subSbu}\` trabajadores con sueldo inferior a \`$${SBU_ECUADOR_2026.toFixed(2)} USD\`. Ajuste inmediatamente sus contratos o verifique si corresponden a jornada parcial prorrateada.`
          : `- **Dignidad Salarial:** Ningún colaborador percibe remuneraciones por debajo del SBU.`,
        a.iessCompliantDetails < a.totalDetails
          ? `- **Riesgo de Mora Patronal IESS (Art. 73 LSS):** Existen \`${a.totalDetails - a.iessCompliantDetails}\` registros de nómina sin retención personal (9.45%) y aporte patronal (11.15%) conciliados.`
          : `- **Seguridad Social IESS:** Planillas conciliadas al 100%.`,
      ].join('\n');

      return {
        domain: 'ODS_8_SUSTAINABILITY_METRICS',
        userQuery,
        inputContext,
        assistantResponse,
      };
    });
  }

  /**
   * 5. Síntesis de Pares Diversificados a partir del Corpus Maestro (Múltiples Perspectivas por Artículo)
   * @private
   */
  getCorpusDerivedScenarios(rawChunks) {
    const derived = [];

    for (const chunk of rawChunks) {
      const code = chunk.articleCode || chunk.document?.title || 'Normativa Vigente';
      const title = chunk.document?.title || 'Legislación Laboral del Ecuador';
      const domain = chunk.metadata?.domain || chunk.document?.category || 'LABOR_CODE';
      const ods = chunk.odsTarget || '8.8';

      // Perspectiva A: Consulta Jurídica y Normativa Directa
      derived.push({
        domain,
        userQuery: `¿Qué establece exactamente ${code} dentro de "${title}" y cómo se aplica en el régimen empresarial ecuatoriano?`,
        assistantResponse: [
          `### Fundamentación Normativa: ${code}`,
          `**Fuente Oficial:** ${title} *(Alineación Agenda 2030: Meta ODS ${ods})*`,
          ``,
          `${chunk.content}`,
          ``,
          `**Aplicación Técnica en Norma ERP:** Esta regla normativa se encuentra codificada de forma determinista en los servicios de dominio del sistema, asegurando que cada validación de contrato, rol de pago, asistencia o asiento contable cumpla el mandato legal sin intervención manual propensa a error.`,
        ].join('\n'),
      });

      // Perspectiva B: Auditoría de Cumplimiento y Prevención de Contingencias
      derived.push({
        domain,
        userQuery: `Como auditor laboral y financiero en Ecuador, ¿qué debo verificar respecto a ${code} para evitar contingencias legales o glosas ante el Ministerio del Trabajo, IESS o SRI?`,
        assistantResponse: [
          `### Protocolo de Auditoría y Cumplimiento — ${code}`,
          `1. **Criterio Legal Obligatorio (${title}):**`,
          `   ${chunk.content}`,
          `2. **Control Interno en Norma ERP (Meta ODS ${ods}):**`,
          `   - Verificar la trazabilidad documental y aritmética en el módulo correspondiente.`,
          `   - Conservar los respaldos firmados electrónicamente (\`.p12\` o hash \`SHA-256\`) y los registros en \`AuditLog\` para inspecciones del Ministerio del Trabajo (SUT), IESS o SRI.`,
        ].join('\n'),
      });
    }

    return derived;
  }
}

export default new SustainabilityFineTuningService();
