/**
 * @file ecuadorLaborKnowledge.js
 * @description Corpus de Conocimiento Normativo: Legislación Laboral de Ecuador y Metas ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export const ECUADOR_LABOR_CORPUS = [
  {
    title: 'Código del Trabajo del Ecuador — Modalidades Contractuales',
    category: 'LABOR_CODE',
    version: '2026',
    chunks: [
      {
        articleCode: 'Art. 11 y 14',
        odsTarget: '8.3',
        content: 'Clasificación de los contratos de trabajo: El contrato individual de trabajo puede ser a tiempo indefinido, eventual, ocasional, de temporada, por obra cierta o de aprendizaje. En el régimen laboral ecuatoriano, el contrato a tiempo indefinido constituye la modalidad contractual típica y principal de la relación laboral.',
        metadata: { subject: 'contratos', type: 'indefinido' },
      },
      {
        articleCode: 'Art. 15',
        odsTarget: '8.3',
        content: 'Período de prueba: En los contratos a tiempo indefinido podrá estipularse un período de prueba de hasta noventa días de duración. Durante este período, cualquiera de las partes puede dar por terminada la relación laboral libremente sin indemnización.',
        metadata: { subject: 'periodo_prueba', days: 90 },
      },
    ],
  },
  {
    title: 'Código del Trabajo del Ecuador — Jornada de Trabajo y Horas Suplementarias',
    category: 'LABOR_CODE',
    version: '2026',
    chunks: [
      {
        articleCode: 'Art. 47',
        odsTarget: '8.8',
        content: 'Jornada máxima de trabajo: La jornada máxima de trabajo será de ocho horas diarias, de manera que no exceda de cuarenta horas semanales, salvo disposición de la ley en contrario. El tiempo de descanso obligatorio entre jornadas es de al menos doce horas continuas.',
        metadata: { subject: 'jornada_maxima', hoursPerWeek: 40 },
      },
      {
        articleCode: 'Art. 55 Numeral 1',
        odsTarget: '8.8',
        content: 'Horas Suplementarias: Las horas trabajadas a continuación de la jornada ordinaria diurna hasta las 24:00 horas causan un recargo del cincuenta por ciento (50%) sobre el valor hora normal. Si se realizan entre las 24:00 y las 06:00 horas, el recargo es del cien por ciento (100%).',
        metadata: { subject: 'horas_suplementarias', surchargePercent: 50 },
      },
      {
        articleCode: 'Art. 55 Numeral 2',
        odsTarget: '8.8',
        content: 'Horas Extraordinarias: El trabajo que se ejecute en días sábados, domingos o días feriados de descanso obligatorio se pagará con el cien por ciento (100%) de recargo sobre el valor de la hora ordinaria.',
        metadata: { subject: 'horas_extraordinarias', surchargePercent: 100 },
      },
    ],
  },
  {
    title: 'Código del Trabajo del Ecuador — Terminación de la Relación Laboral e Indemnizaciones',
    category: 'LABOR_CODE',
    version: '2026',
    chunks: [
      {
        articleCode: 'Art. 185',
        odsTarget: '8.8',
        content: 'Bonificación por Desahucio: En los casos de terminación de la relación laboral, el empleador bonificará al trabajador con el veinticinco por ciento (25%) del equivalente a la última remuneración mensual por cada uno de los años de servicio prestados a la misma empresa o empleador.',
        metadata: { subject: 'desahucio', percentagePerYear: 25 },
      },
      {
        articleCode: 'Art. 188',
        odsTarget: '8.8',
        content: 'Indemnización por Despido Intempestivo: El empleador que despidiere intempestivamente al trabajador será condenado a indemnizarle: Hasta tres años de servicio, con el valor correspondiente a tres meses de remuneración. Con más de tres años de servicio, con el valor equivalente a un mes de remuneración por cada año de servicio, sin que en ningún caso ese valor exceda de veinticinco meses de remuneración. La fracción de un año se considerará como año completo.',
        metadata: { subject: 'despido_intempestivo', maxMonths: 25 },
      },
    ],
  },
  {
    title: 'Normativa de Seguridad Social IESS y Beneficios de Ley',
    category: 'IESS_REGULATION',
    version: '2026',
    chunks: [
      {
        articleCode: 'Resolución C.D. 516 IESS',
        odsTarget: '8.5',
        content: 'Aportaciones obligatorias al Seguro General Obligatorio: La tasa de aportación personal del trabajador bajo relación de dependencia es del 9.45% de la materia gravada, y la aportación patronal es del 11.15%, totalizando 20.60% mensual que debe ser cancelado dentro de los quince primeros días del mes posterior.',
        metadata: { subject: 'iess_aportes', personalRate: 9.45, employerRate: 11.15 },
      },
      {
        articleCode: 'Art. 111 y 113',
        odsTarget: '8.5',
        content: 'Décimo Tercer y Décimo Cuarto Sueldo: El decimotercer sueldo equivale a la doceava parte de las remuneraciones percibidas durante el año calendario laboral (diciembre a noviembre). El decimocuarto sueldo equivale a un Salario Básico Unificado completo en el año, prorrateado mensualmente o acumulado según solicitud del trabajador.',
        metadata: { subject: 'decimos', period: 'anual' },
      },
      {
        articleCode: 'Fondos de Reserva IESS',
        odsTarget: '8.5',
        content: 'Fondos de Reserva: Todo trabajador que preste servicios por más de un año tiene derecho a que el empleador le abone una suma equivalente a un mes de sueldo o salario por cada año completo posterior al primero (8.33% mensual de la remuneración).',
        metadata: { subject: 'fondos_reserva', percentage: 8.33, startingMonth: 13 },
      },
    ],
  },
  {
    title: 'Marco Metodológico de Sostenibilidad ODS 8 — Norma ERP',
    category: 'ODS_8_FRAMEWORK',
    version: '2026',
    chunks: [
      {
        articleCode: 'Meta ONU 8.3',
        odsTarget: '8.3',
        content: 'Formalización de PyMEs y Emprendimiento: Monitoreo sistemático de contratos legalizados, expedientes digitales completos y reducción a cero de trabajadores sin contrato formal registrado en el Ministerio del Trabajo.',
        metadata: { indicator: '8.3.1', label: 'Tasa de Formalidad' },
      },
      {
        articleCode: 'Meta ONU 8.5',
        odsTarget: '8.5',
        content: 'Salario Justo, Trabajo Decente e Inclusión: Liquidación sin sesgos con aritmética de alta precisión (Decimal.js, 20 dígitos), cumplimiento del Salario Básico Unificado y cobertura total en aportes al IESS.',
        metadata: { indicator: '8.5.1', label: 'Seguridad Social y Salario Digno' },
      },
      {
        articleCode: 'Meta ONU 8.8',
        odsTarget: '8.8',
        content: 'Protección de Derechos Laborales: Registro fidedigno de jornadas con geocercas, liquidación transparente de horas extras y actas de finiquito legales verificables criptográficamente mediante QR y SHA-256.',
        metadata: { indicator: '8.8.1', label: 'Jornada Justa y Desvinculaciones Transparentes' },
      },
    ],
  },
];
