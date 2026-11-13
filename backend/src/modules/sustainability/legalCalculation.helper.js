/**
 * @file legalCalculation.helper.js
 * @description Motor de cálculo jurídico-contable determinista con Decimal.js (20 dígitos, ROUND_HALF_UP)
 * y generador de síntesis verificada para el Asistente RAG de Norma ERP.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Decimal } from 'decimal.js';
import { SBU_ECUADOR_2026 } from './sustainability.service.js';

export function parseNumberString(rawNum) {
  if (!rawNum) return null;
  let str = String(rawNum).trim();
  if (str.includes(',') && str.includes('.')) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastDot > lastComma) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/\./g, '').replace(',', '.');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      str = parts.join('');
    } else {
      str = str.replace(',', '.');
    }
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      str = parts.join('');
    }
  }
  const parsed = parseFloat(str);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateSettlement(baseSalary, years, extraMonths, query) {
  const effectiveYears = years !== null ? years : extraMonths > 0 ? 0 : 3;
  const isUnfairDismissal = /despid|desped|intempestiv|\b188\b/i.test(query);

  const desahucioAmount = baseSalary
    .times(0.25)
    .times(effectiveYears)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const totalYearsWithFraction = extraMonths > 0 ? effectiveYears + 1 : Math.max(1, effectiveYears);
  const severanceMonths = isUnfairDismissal ? Math.min(25, Math.max(3, totalYearsWithFraction)) : 0;
  const severanceAmount = baseSalary
    .times(severanceMonths)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const propMonths = extraMonths > 0 ? extraMonths : 6;
  const thirteenthProp = baseSalary
    .times(propMonths)
    .dividedBy(12)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const fourteenthProp = new Decimal(SBU_ECUADOR_2026)
    .times(propMonths)
    .dividedBy(12)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const vacationProp = baseSalary
    .times(propMonths)
    .dividedBy(24)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const totalSettlement = desahucioAmount
    .plus(severanceAmount)
    .plus(thirteenthProp)
    .plus(fourteenthProp)
    .plus(vacationProp)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const formattedSummary = [
    `**Simulación Aritmética de Liquidación (Sueldo Base: \`$${baseSalary.toFixed(2)}\` | Antigüedad: \`${effectiveYears} año(s)${extraMonths ? ` y ${extraMonths} mes(es)` : ''}\` | Modalidad: \`${isUnfairDismissal ? 'Despido Intempestivo' : 'Renuncia / Acuerdo Voluntario'}\`):**`,
    `- **Bonificación por Desahucio (Art. 185 — 25% × ${effectiveYears} años completos):** \`$${desahucioAmount.toFixed(2)} USD\``,
    isUnfairDismissal
      ? `- **Indemnización por Despido Intempestivo (Art. 188 — ${severanceMonths} remuneraciones):** \`$${severanceAmount.toFixed(2)} USD\``
      : `- **Indemnización Art. 188:** \`$0.00 USD\` (No aplica en renuncia voluntaria).`,
    `- **Proporcional Décimo Tercer Sueldo (${propMonths}/12 meses ref.):** \`$${thirteenthProp.toFixed(2)} USD\``,
    `- **Proporcional Décimo Cuarto Sueldo (${propMonths}/12 meses sobre SBU $${SBU_ECUADOR_2026.toFixed(2)}):** \`$${fourteenthProp.toFixed(2)} USD\``,
    `- **Proporcional Vacaciones No Gozadas (Art. 69 — 1/24):** \`$${vacationProp.toFixed(2)} USD\``,
    `- **TOTAL LIQUIDACIÓN ESTIMADA (Acta SUT):** \`$${totalSettlement.toFixed(2)} USD\``,
  ].join('\n');

  return {
    type: 'SETTLEMENT_CALCULATION',
    baseSalary: baseSalary.toNumber(),
    years: effectiveYears,
    extraMonths,
    desahucioAmount: desahucioAmount.toNumber(),
    severanceAmount: severanceAmount.toNumber(),
    thirteenthProp: thirteenthProp.toNumber(),
    fourteenthProp: fourteenthProp.toNumber(),
    vacationProp: vacationProp.toNumber(),
    totalSettlement: totalSettlement.toNumber(),
    formattedSummary,
  };
}

function calculateOvertime(baseSalary, numHours) {
  const hours = numHours !== null && numHours > 0 ? new Decimal(numHours) : new Decimal(8);
  const hourlyBase = baseSalary.dividedBy(240);
  const supp50Hour = hourlyBase.times(1.5).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  const extra100Hour = hourlyBase.times(2.0).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  const night25Hour = hourlyBase.times(1.25).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);

  const totalSupp50 = hourlyBase.times(1.5).times(hours).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalExtra100 = hourlyBase
    .times(2.0)
    .times(hours)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalNight25 = hourlyBase
    .times(0.25)
    .times(hours)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const formattedSummary = [
    `**Cálculo de Sobretiempos con Decimal.js (Sueldo Base: \`$${baseSalary.toFixed(2)}\` | Divisor Legal: \`240h\` | Cantidad: \`${hours.toFixed(1)}h\`):**`,
    `- **Valor Hora Ordinaria Diurna (\`$${baseSalary.toFixed(2)} / 240\`):** \`$${hourlyBase.toDecimalPlaces(4).toFixed(4)} USD\``,
    `- **Hora Suplementaria Diurna 50% (Art. 55.1 — Factor 1.50):** \`$${supp50Hour.toFixed(4)}/h\` → Total por ${hours.toFixed(1)}h: \`$${totalSupp50.toFixed(2)} USD\``,
    `- **Hora Extraordinaria Fin de Semana / Feriado 100% (Art. 55.2 — Factor 2.00):** \`$${extra100Hour.toFixed(4)}/h\` → Total por ${hours.toFixed(1)}h: \`$${totalExtra100.toFixed(2)} USD\``,
    `- **Recargo por Jornada Nocturna 25% (Art. 49 — 19h00 a 06h00):** Valor hora \`$${night25Hour.toFixed(4)}/h\` → Recargo puro por ${hours.toFixed(1)}h: \`$${totalNight25.toFixed(2)} USD\``,
  ].join('\n');

  return {
    type: 'OVERTIME_CALCULATION',
    baseSalary: baseSalary.toNumber(),
    hours: hours.toNumber(),
    hourlyRate: hourlyBase.toDecimalPlaces(4).toNumber(),
    totalSupp50: totalSupp50.toNumber(),
    totalExtra100: totalExtra100.toNumber(),
    totalNight25: totalNight25.toNumber(),
    formattedSummary,
  };
}

function calculatePayrollAccounting(baseSalary) {
  const iessPersonal = baseSalary.times(0.0945).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const iessPatronal = baseSalary.times(0.1115).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const reserveFund = baseSalary
    .times(new Decimal(1).dividedBy(12))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const thirteenthMonthly = baseSalary.dividedBy(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const fourteenthMonthly = new Decimal(SBU_ECUADOR_2026)
    .dividedBy(12)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const netSalary = baseSalary.minus(iessPersonal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalDebit = baseSalary.plus(iessPatronal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalIessPayable = iessPersonal
    .plus(iessPatronal)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const formattedSummary = [
    `**Desglose de Nómina, IESS y Asiento Contable NIIF (Materia Gravada: \`$${baseSalary.toFixed(2)} USD\`):**`,
    `- **Aporte Personal IESS (9.45% retenido al trabajador):** \`$${iessPersonal.toFixed(2)} USD\``,
    `- **Aporte Patronal IESS (11.15% costo empleador):** \`$${iessPatronal.toFixed(2)} USD\``,
    `- **Líquido a Recibir (Sueldo Neto sin beneficios mensualizados):** \`$${netSalary.toFixed(2)} USD\``,
    `- **Fondo de Reserva (8.33% desde mes 13):** \`$${reserveFund.toFixed(2)} USD\` | **Décimo 3ro Mensual:** \`$${thirteenthMonthly.toFixed(2)} USD\` | **Décimo 4to Mensual:** \`$${fourteenthMonthly.toFixed(2)} USD\``,
    `- **Asiento Contable de Diario (Partida Doble Cuadrada):**`,
    `  - \`DÉBITO\` 5.1.01 Sueldos y Salarios: \`$${baseSalary.toFixed(2)}\` | \`DÉBITO\` 5.1.03 Aporte Patronal IESS: \`$${iessPatronal.toFixed(2)}\` (\`Σ Débitos = $${totalDebit.toFixed(2)}\`)`,
    `  - \`CRÉDITO\` 2.1.03 IESS por Pagar (20.60%): \`$${totalIessPayable.toFixed(2)}\` | \`CRÉDITO\` 2.1.01 Bancos / Sueldos por Pagar: \`$${netSalary.toFixed(2)}\` (\`Σ Créditos = $${totalDebit.toFixed(2)}\`)`,
  ].join('\n');

  return {
    type: 'PAYROLL_ACCOUNTING_CALCULATION',
    baseSalary: baseSalary.toNumber(),
    iessPersonal: iessPersonal.toNumber(),
    iessPatronal: iessPatronal.toNumber(),
    netSalary: netSalary.toNumber(),
    reserveFund: reserveFund.toNumber(),
    totalDebit: totalDebit.toNumber(),
    formattedSummary,
  };
}

export function computeLiveLegalCalculation(query) {
  if (!query) return null;
  const qLower = query.toLowerCase();

  const numPattern = '(-?\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?|-?\\d+(?:[.,]\\d+)?)';
  const salaryMatch =
    query.match(
      new RegExp('(?:-|\\b)(?:\\$\\s*' + numPattern + '|\\$\\s*-' + numPattern + ')', 'i')
    ) ||
    query.match(
      new RegExp(
        '(?:sueldo|salario|remuneraci[oó]n|gana|percibe)\\s+(?:de\\s+|mensual\\s+de\\s+)?(?:\\$\\s*)?(-?' +
          numPattern +
          ')',
        'i'
      )
    ) ||
    query.match(new RegExp('(-?' + numPattern + ')\\s*(?:usd|d[oó]lares)', 'i'));

  let extractedNum = null;
  if (salaryMatch) {
    const rawMatch = salaryMatch[0];
    const candidateNum = salaryMatch[1];
    const isNegative = rawMatch.includes('-') && !candidateNum.startsWith('-');
    extractedNum = isNegative ? `-${candidateNum}` : candidateNum;
  }

  const parsedSalary = extractedNum ? parseNumberString(extractedNum) : null;
  const baseSalary =
    parsedSalary && parsedSalary >= 100 && parsedSalary <= 50000
      ? new Decimal(parsedSalary)
      : new Decimal(SBU_ECUADOR_2026);

  const yearsMatch = query.match(/(\d+)\s*a[ñn]os?/i);
  const monthsMatch = query.match(/(\d+)\s*mes(?:es)?/i);
  const years = yearsMatch ? parseInt(yearsMatch[1], 10) : null;
  const extraMonths = monthsMatch ? parseInt(monthsMatch[1], 10) : 0;
  const hoursMatch = query.match(new RegExp(numPattern + '\\s*horas?', 'i'));
  const numHours = hoursMatch ? parseNumberString(hoursMatch[1]) : null;

  if (
    /liquidaci|finiquito|despid|desped|intempestiv|desahuci|renuncia|\b188\b|\b185\b/i.test(query)
  ) {
    return calculateSettlement(baseSalary, years, extraMonths, query);
  }
  if (/hora|suplementaria|extraordinaria|nocturna|sobretiempo/i.test(qLower)) {
    return calculateOvertime(baseSalary, numHours);
  }
  if (
    /iess|aporte|asiento|contab|rol de pago|fondos de reserva/i.test(qLower) ||
    parsedSalary !== null
  ) {
    return calculatePayrollAccounting(baseSalary);
  }
  return null;
}

export function buildContextualActionPlan(query, erpCtx, ods) {
  const qLower = (query || '').toLowerCase();
  if (/contab|asiento|niif|balance/i.test(qLower)) {
    return [
      `1. Verificar en el módulo de **Contabilidad Financiera** que exista un período \`OPEN\` (actualmente: \`${erpCtx.openAccountingPeriods ?? 0}\` abiertos y \`${erpCtx.totalJournalEntries ?? 0}\` asientos registrados).`,
      `2. Comprobar que el asiento de nómina valide la invariante de partida doble (\`Σ Débitos = Σ Créditos\`) antes de pasar a estado \`POSTED\`.`,
      `3. Conciliar las cuentas de pasivo \`IESS por Pagar (20.60%)\` y provisiones de décimos contra el estado de resultados mensual.`,
    ];
  }
  if (/impuesto|sri|renta|gastos personales/i.test(qLower)) {
    return [
      `1. Deducir el \`9.45%\` de aporte personal al IESS de los ingresos gravados anuales para determinar la base imponible en relación de dependencia.`,
      `2. Excluir de la base imponible del SRI el Décimo Tercer Sueldo, Décimo Cuarto Sueldo y Fondos de Reserva conforme al Art. 10 de la LORTI.`,
      `3. Aplicar la rebaja del \`18%\` sobre gastos personales proyectados según el número de cargas familiares registradas en el expediente del colaborador.`,
    ];
  }
  if (/lopdp|privacidad|encript|firma|biometr/i.test(qLower)) {
    return [
      `1. Mantener activo el cifrado de campo \`AES-256-GCM\` para remuneraciones y coordenadas GPS truncadas a 4 decimales (tasa actual de consentimiento LOPDP: \`${erpCtx.trackingConsentRate ?? 100}%\`).`,
      `2. Emitir roles de pago y actas de finiquito con firma electrónica \`.p12\` o sello criptográfico \`SHA-256\` verificable mediante código QR.`,
      `3. Auditar los accesos a datos sensibles en el registro inmutable \`AuditLog\`.`,
    ];
  }
  return [
    `1. Confirmar que el \`100%\` de la plantilla activa (\`${erpCtx.totalActiveEmployees ?? 0}\` colaboradores) mantenga contrato formalizado en el SUT y remuneración igual o superior al SBU (\`$${(ods?.sbuReferenceUsd || SBU_ECUADOR_2026).toFixed(2)} USD\`).`,
    `2. Conciliar las horas extraordinarias geolocalizadas (\`${erpCtx.overtimeHoursTracked30d ?? 0}h\` en los últimos 30 días) con los haberes liquidados en nómina.`,
    `3. Declarar las planillas de aportes personales (\`9.45%\`), patronales (\`11.15%\`) y fondos de reserva (\`8.33%\`) en el IESS hasta el día 15 del mes siguiente para evitar responsabilidad patronal.`,
  ];
}

export function generateSynthesizedAdvice({
  query,
  relevantChunks,
  tenantMetrics,
  liveCalculation,
  moduleContext,
}) {
  const ods = tenantMetrics?.ods || {};
  const erpCtx = tenantMetrics?.erpContext || {};
  const score = ods.overallScore ?? 100;
  const formalRate = ods.indicators?.formalContractRate?.value ?? 100;
  const iessRate = ods.indicators?.socialSecurityCoverage?.value ?? 100;
  const salaryRate = ods.indicators?.salaryEquitabilityIndex?.value ?? 100;

  const headerTitle = `### Dictamen Jurídico y Técnico Verificado — Norma ERP (Módulo: ${String(moduleContext || 'general').toUpperCase()})`;
  const tenantSummaryLine = tenantMetrics
    ? `\n**Estado del Tenant:** Cumplimiento ODS 8: \`${score.toFixed(2)}%\` (${ods.complianceLevel || 'ALTO'}) · ` +
      `Plantilla Activa: \`${erpCtx.totalActiveEmployees ?? 0}\` · ` +
      `Contratos Vigentes: \`${formalRate}%\` · Cobertura IESS: \`${iessRate}%\` · SBU Conforme: \`${salaryRate}%\`.`
    : '';

  const sections = [headerTitle + tenantSummaryLine];

  if (relevantChunks && relevantChunks.length > 0) {
    const legalLines = relevantChunks.slice(0, 4).map((chunk) => {
      const code = chunk.articleCode ? `**${chunk.articleCode}**` : `**${chunk.document?.title}**`;
      const conf = chunk.evaluatorConfidence
        ? ` · *Confianza Evaluador: ${(chunk.evaluatorConfidence * 100).toFixed(0)}%*`
        : '';
      return `- ${code} *(ODS ${chunk.odsTarget || '8.8'}${conf})*:\n  ${chunk.content}`;
    });
    sections.push(
      `#### 1. Artículos Exactos Recuperados de los 4 Documentos Oficiales\n${legalLines.join('\n\n')}`
    );
  }

  if (liveCalculation && liveCalculation.formattedSummary) {
    sections.push(
      `#### 2. Liquidación y Verificación Matemática (Decimal.js)\n${liveCalculation.formattedSummary}`
    );
  }

  const actionStepNum = liveCalculation ? 3 : 2;
  const actionLines = buildContextualActionPlan(query, erpCtx, ods);
  sections.push(
    `#### ${actionStepNum}. Protocolo Operativo en Norma ERP\n${actionLines.join('\n')}`
  );

  return sections.join('\n\n');
}
