/**
 * @file legalAssistantContexts.js
 * @description Catálogo de contextos por módulo del ERP y escenarios frecuentes para el Asistente Legal IA.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export const MODULE_CONTEXT_MAP = [
  {
    match: ['/payroll', '/my-payments', '/my-advances'],
    code: 'payroll',
    label: 'Nómina, IESS y Beneficios Sociales',
    prompts: [
      'Calcula el rol de pagos, aporte personal IESS (9.45%) y patronal (11.15%) para un sueldo de $950 USD.',
      '¿Cómo se calculan 8 horas suplementarias (50%) y 4 extraordinarias (100%) con sueldo de $800 USD?',
      '¿Qué ingresos forman parte de la materia gravada del IESS según el Art. 11 y 14 de la Ley de Seguridad Social?',
    ],
  },
  {
    match: ['/contracts'],
    code: 'contracts',
    label: 'Contratación Laboral y Modalidades',
    prompts: [
      '¿Cuáles son las reglas legales del período de prueba de 90 días según el Art. 15 del Código del Trabajo?',
      '¿Qué recargo lleva el contrato eventual y cuál es su duración máxima según el Art. 17?',
      '¿En qué plazo debe registrarse un contrato escrito en el SUT del Ministerio del Trabajo?',
    ],
  },
  {
    match: ['/offboarding', '/finiquitos'],
    code: 'offboarding',
    label: 'Desvinculación, Desahucio y Finiquitos',
    prompts: [
      'Calcula paso a paso la liquidación por despido intempestivo (Art. 188) y desahucio (Art. 185) para $850 USD y 4 años y 2 meses.',
      '¿Cuáles son las causales de Visto Bueno por parte del empleador según el Art. 172 del Código del Trabajo?',
      '¿Qué indemnización especial aplica por despido ineficaz (Art. 195.3) o discapacidad?',
    ],
  },
  {
    match: ['/attendance', '/shifts', '/absences', '/asistencia', '/ausencias'],
    code: 'attendance',
    label: 'Jornada, Asistencia, Vacaciones y Licencias',
    prompts: [
      '¿Cómo se calculan los 15 días de vacaciones anuales y los días adicionales por antigüedad según el Art. 69?',
      '¿Cuál es el límite diario y semanal de horas suplementarias según el Art. 55 del Código del Trabajo?',
      '¿Cuántos días corresponden por licencia de maternidad, paternidad y lactancia (Art. 152)?',
    ],
  },
  {
    match: ['/accounting'],
    code: 'accounting',
    label: 'Contabilidad NIIF y Tributación SRI',
    prompts: [
      'Genera el asiento contable NIIF por partida doble para un rol de pagos mensual con sueldo de $1,200 USD.',
      '¿Cómo se contabilizan mensualmente las provisiones de décimo tercero, décimo cuarto y fondos de reserva?',
      '¿Cómo se distribuye el 15% de utilidades líquidas (Art. 97) y cómo aplica la rebaja de gastos personales en el SRI?',
    ],
  },
  {
    match: ['/signatures'],
    code: 'signatures',
    label: 'Firmas Electrónicas (.p12) y Validez Jurídica',
    prompts: [
      '¿Qué validez jurídica tienen los roles de pago y actas firmadas electrónicamente bajo la Ley de Comercio Electrónico?',
      '¿Cómo se garantiza la integridad y no repudio de documentos laborales firmados en Norma ERP?',
    ],
  },
  {
    match: ['/compliance', '/audit'],
    code: 'compliance',
    label: 'Cumplimiento Legal, LOPDP y Auditoría',
    prompts: [
      '¿Qué obligaciones exige la LOPDP del Ecuador para el tratamiento de datos salariales y biométricos?',
      '¿Qué registros laborales y de seguridad social audita el Ministerio del Trabajo e IESS?',
    ],
  },
  {
    match: ['/recruitment'],
    code: 'recruitment',
    label: 'Reclutamiento y Selección sin Sesgos',
    prompts: [
      '¿Qué prohíbe la Constitución y el Código del Trabajo en procesos de selección y contratación de personal?',
      '¿Cómo aplica la LOPDP sobre los datos personales y hojas de vida de postulantes?',
    ],
  },
  {
    match: ['/performance', '/evaluations'],
    code: 'performance',
    label: 'Desempeño 360° y Productividad ODS 8',
    prompts: [
      '¿Qué disposiciones del Código del Trabajo y Constitución garantizan igual remuneración por trabajo de igual valor?',
      '¿Cómo se vinculan las evaluaciones 360° con las metas del ODS 8.5 de empleo pleno y productivo?',
    ],
  },
  {
    match: ['/analytics', '/reports', '/intelligence'],
    code: 'analytics',
    label: 'Analítica de Talento, Costos e IA Predictiva',
    prompts: [
      '¿Cómo se evalúa la equidad salarial respecto al SBU ($460 USD) y las metas del ODS 8.5?',
      '¿Qué indicadores de rotación, horas extra y cumplimiento IESS deben monitorearse mensualmente?',
    ],
  },
  {
    match: ['/entrepreneurship'],
    code: 'entrepreneurship',
    label: 'Incubadora de Negocios y Formalización ODS 8.3',
    prompts: [
      '¿Cómo promueve el ODS 8.3 la formalización y crecimiento de microempresas y PYMES en Ecuador?',
      '¿Cuáles son las obligaciones laborales iniciales al contratar al primer colaborador en el IESS y SUT?',
    ],
  },
  {
    match: ['/sustainability'],
    code: 'sustainability',
    label: 'Sostenibilidad ODS 8 y Auditoría Legal',
    prompts: [
      '¿Cuál es el estado actual de cumplimiento ODS 8 (metas 8.3, 8.5 y 8.8) en la empresa y qué artículos aplican?',
      'Explícame los indicadores de Trabajo Decente de la OIT implementados en el sistema.',
    ],
  },
  {
    match: [
      '/employees',
      '/register-employee',
      '/profile',
      '/expedientes',
      '/my-expedient',
      '/assets',
      '/my-assets',
      '/admin/settings',
      '/empleado',
    ],
    code: 'employees',
    label: 'Talento Humano, LOPDP y Seguridad Social',
    prompts: [
      '¿Desde qué día es obligatoria la afiliación al IESS y cuándo se genera derecho a Fondos de Reserva (8.33%)?',
      '¿Cómo protege el sistema los datos salariales y biométricos bajo la LOPDP del Ecuador?',
      '¿Qué garantías establece el Art. 326 de la Constitución sobre irrenunciabilidad e igualdad salarial?',
    ],
  },
];

export const ADVISOR_PRESETS = [
  {
    id: 'finiquito-art188',
    domain: 'FINIQUITOS · ART. 185 / 188',
    label: 'Liquidación por Despido Intempestivo y Desahucio',
    prompt:
      'Calcula paso a paso la liquidación por despido intempestivo y desahucio en Ecuador para un colaborador con sueldo de $850 USD y 4 años y 2 meses de servicio.',
    ods: '8.8',
  },
  {
    id: 'contabilidad-niif',
    domain: 'CONTABILIDAD · NIIF PYMES',
    label: 'Rol de Pagos, IESS y Asiento de Partida Doble',
    prompt:
      'Calcula el rol de pagos, aportes al IESS (9.45% y 11.15%) y genera el asiento contable NIIF por partida doble para un sueldo de $1200 USD.',
    ods: '8.5',
  },
  {
    id: 'horas-extras-vacaciones',
    domain: 'JORNADA · ART. 49 / 55 / 69',
    label: 'Horas Suplementarias (50%), Extraordinarias (100%) y Vacaciones',
    prompt:
      '¿Cómo se calculan 10 horas suplementarias, 6 extraordinarias y los días adicionales de vacaciones por antigüedad para un sueldo de $750 USD?',
    ods: '8.8',
  },
  {
    id: 'utilidades-sri',
    domain: 'TRIBUTACIÓN SRI · ART. 97',
    label: 'Reparto del 15% de Utilidades e Impuesto a la Renta',
    prompt:
      '¿Cómo se distribuye legalmente el 15% de utilidades (10% general y 5% cargas familiares) y cómo aplica la rebaja del 18% por gastos personales ante el SRI?',
    ods: '8.5',
  },
  {
    id: 'contratos-prueba',
    domain: 'CONTRATOS · ART. 14 / 15 / 17',
    label: 'Período de Prueba (90 días), Eventuales y Teletrabajo',
    prompt:
      '¿Cuáles son las reglas legales del período de prueba de 90 días, el recargo del 35% en contratos eventuales y la desconexión digital en teletrabajo?',
    ods: '8.3',
  },
  {
    id: 'lopdp-firmas',
    domain: 'GOBERNANZA · LOPDP / FIRMAS',
    label: 'Cifrado AES-256-GCM, Biometría FIDO2 y Firma .p12',
    prompt:
      '¿Cómo cumple el sistema con la LOPDP del Ecuador en el cifrado de salarios, geolocalización, biometría WebAuthn y validez de firmas electrónicas?',
    ods: '8.8',
  },
];

export function resolveActiveModuleContext(pathname = '') {
  const path = String(pathname || '').toLowerCase();
  const found = MODULE_CONTEXT_MAP.find((item) =>
    item.match.some((prefix) => path.includes(prefix))
  );
  return (
    found || {
      code: 'general',
      label: 'Consulta Jurídica, Laboral y Contable',
      prompts: [
        'Calcula la liquidación por despido intempestivo y desahucio para $900 USD y 3 años y 4 meses.',
        'Calcula el rol de pagos, aportes al IESS y asiento contable NIIF para un sueldo de $1,000 USD.',
        '¿Cuáles son los porcentajes de recargo de horas suplementarias, extraordinarias y jornada nocturna?',
      ],
    }
  );
}
