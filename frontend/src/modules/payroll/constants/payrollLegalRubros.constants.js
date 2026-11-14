/**
 * @file payrollLegalRubros.constants.js
 * @description Catálogo de rubros dinámicos del sistema y plantilla legal ecuatoriana (Código del Trabajo / IESS).
 */

export const SYSTEM_DYNAMIC_RUBROS = {
  'Sueldo Base': {
    category: 'SISTEMA_CONTRATO',
    tag: 'Por Contrato Individual',
    desc: 'El valor proviene del sueldo pactado en el contrato de cada colaborador (dividido para 30 días base).',
  },
  'Horas Extras 50%': {
    category: 'SISTEMA_BIOMETRICO',
    tag: 'Reloj Biométrico / Turnos',
    desc: 'Calculado automáticamente por marcaciones después de la jornada ordinaria hasta las 24h00 (Recargo 50%).',
  },
  'Horas Extras 100%': {
    category: 'SISTEMA_BIOMETRICO',
    tag: 'Reloj Biométrico / Feriados',
    desc: 'Calculado automáticamente en fines de semana, días de descanso y feriados nacionales (Recargo 100%).',
  },
  'Recargo Nocturno 25%': {
    category: 'SISTEMA_BIOMETRICO',
    tag: 'Turnos Nocturnos',
    desc: 'Calculado automáticamente para horas laboradas dentro de la franja nocturna de 19h00 a 06h00 (+25%).',
  },
  'Anticipo Quincenal / Sueldo': {
    category: 'SISTEMA_ANTICIPOS',
    tag: 'Módulo de Anticipos',
    desc: 'Descontado automáticamente según solicitudes de anticipo aprobadas y cobradas en el mes.',
  },
  'Impuesto a la Renta': {
    category: 'SISTEMA_SRI',
    tag: 'Tabla Progresiva SRI',
    desc: 'Retención mensual calculada bajo la proyección de ingresos gravables y rebaja por gastos personales del SRI.',
  },
  'Préstamo Quirografario IESS': {
    category: 'SISTEMA_BIESS',
    tag: 'Planilla BIESS / IESS',
    desc: 'Descuento mensual reportado por el BIESS por créditos quirografarios o hipotecarios.',
  },
};

export const LEGAL_PRESET_ITEMS = [
  { name: 'Sueldo Base', type: 'EARNING', isMandatory: true, percentage: null, fixedValue: null },
  {
    name: 'Horas Extras 50%',
    type: 'EARNING',
    isMandatory: false,
    percentage: null,
    fixedValue: null,
  },
  {
    name: 'Horas Extras 100%',
    type: 'EARNING',
    isMandatory: false,
    percentage: null,
    fixedValue: null,
  },
  {
    name: 'Aporte IESS Personal',
    type: 'DEDUCTION',
    isMandatory: true,
    percentage: 9.45,
    fixedValue: null,
  },
  {
    name: 'Aporte IESS Patronal',
    type: 'DEDUCTION',
    isMandatory: false,
    percentage: 12.15,
    fixedValue: null,
  },
  {
    name: 'Décimo Tercer Sueldo',
    type: 'EARNING',
    isMandatory: true,
    percentage: 8.33,
    fixedValue: null,
  },
  {
    name: 'Décimo Cuarto Sueldo',
    type: 'EARNING',
    isMandatory: true,
    percentage: null,
    fixedValue: 38.33,
  },
  {
    name: 'Fondo de Reserva',
    type: 'EARNING',
    isMandatory: false,
    percentage: 8.33,
    fixedValue: null,
  },
  {
    name: 'Anticipo Quincenal / Sueldo',
    type: 'DEDUCTION',
    isMandatory: false,
    percentage: null,
    fixedValue: null,
  },
  {
    name: 'Impuesto a la Renta',
    type: 'DEDUCTION',
    isMandatory: false,
    percentage: null,
    fixedValue: null,
  },
  {
    name: 'Préstamo Quirografario IESS',
    type: 'DEDUCTION',
    isMandatory: false,
    percentage: null,
    fixedValue: null,
  },
];
