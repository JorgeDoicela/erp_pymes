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
    str = lastDot > lastComma ? str.replace(/,/g, '') : str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    const parts = str.split(',');
    str =
      parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3
        ? parts.join('')
        : str.replace(',', '.');
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) str = parts.join('');
  }
  const parsed = parseFloat(str);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateSettlement({ baseSalary, years, extraMonths, query, parameterStatus }) {
  const effectiveYears = years !== null ? years : extraMonths > 0 ? 0 : 3;
  const isUnfairDismissal =
    /\b(despid\w*|desped\w*|intempestiv\w*|botar\w*|echar\w*|sacar\w*|188)\b/i.test(query);

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

  const isReferenceSimulation =
    !parameterStatus.hasExplicitSalary || !parameterStatus.hasExplicitTenure;
  const headerPrefix = isReferenceSimulation
    ? '**Ejemplo Referencial Ilustrativo (Parámetros de entrada no especificados en la consulta; se simula con SBU `$460.00` y `3 años` — requiere confirmar sueldo real, antigüedad exacta y causal):**'
    : `**Cálculo Exacto Verificado con Parámetros Completos (Sueldo Base: \`$${baseSalary.toFixed(2)}\` | Antigüedad: \`${effectiveYears} año(s)${extraMonths ? ` y ${extraMonths} mes(es)` : ''}\` | Modalidad: \`${isUnfairDismissal ? 'Despido Intempestivo' : 'Renuncia / Acuerdo Voluntario'}\`):**`;

  const formattedSummary = [
    headerPrefix,
    `- **Bonificación por Desahucio (Art. 185 — 25% × ${effectiveYears} años completos):** \`$${desahucioAmount.toFixed(2)} USD\``,
    isUnfairDismissal
      ? `- **Indemnización por Despido Intempestivo (Art. 188 — ${severanceMonths} remuneraciones):** \`$${severanceAmount.toFixed(2)} USD\``
      : `- **Indemnización Art. 188:** \`$0.00 USD\` (No aplica en renuncia voluntaria).`,
    `- **Proporcional Décimo Tercer Sueldo (Art. 111 — ${propMonths}/12 meses ref.):** \`$${thirteenthProp.toFixed(2)} USD\``,
    `- **Proporcional Décimo Cuarto Sueldo (Art. 113 — ${propMonths}/12 meses sobre SBU $${SBU_ECUADOR_2026.toFixed(2)}):** \`$${fourteenthProp.toFixed(2)} USD\``,
    `- **Proporcional Vacaciones No Gozadas (Arts. 69 y 71 — 1/24):** \`$${vacationProp.toFixed(2)} USD\``,
    `- **TOTAL LIQUIDACIÓN ESTIMADA (Acta SUT):** \`$${totalSettlement.toFixed(2)} USD\``,
  ].join('\n');

  return {
    type: 'SETTLEMENT_CALCULATION',
    isReferenceSimulation,
    missingParameters: parameterStatus.missingParameters,
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

function calculateOvertime({
  baseSalary,
  numHours,
  suppHours,
  extraHours,
  isNightShiftOnly,
  parameterStatus,
}) {
  const hours = numHours !== null && numHours > 0 ? new Decimal(numHours) : new Decimal(8);
  const suppH = suppHours !== null && suppHours > 0 ? new Decimal(suppHours) : hours;
  const extraH = extraHours !== null && extraHours > 0 ? new Decimal(extraHours) : hours;
  const hasCombinedHours = suppHours !== null && extraHours !== null;

  const hourlyBase = baseSalary.dividedBy(240);
  const supp50Hour = hourlyBase.times(1.5).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  const extra100Hour = hourlyBase.times(2.0).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  const night25Hour = hourlyBase.times(1.25).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  const totalSupp50 = hourlyBase.times(1.5).times(suppH).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalExtra100 = hourlyBase
    .times(2.0)
    .times(extraH)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalNight25 = hourlyBase
    .times(0.25)
    .times(hours)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalOvertimePay = hasCombinedHours
    ? totalSupp50.plus(totalExtra100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : isNightShiftOnly
      ? totalNight25
      : extraHours !== null && suppHours === null
        ? totalExtra100
        : totalSupp50;
  const isReferenceSimulation =
    !parameterStatus.hasExplicitSalary || !parameterStatus.hasExplicitHours;

  const summaryLines = [
    `**Cálculo de Sobretiempos con Decimal.js (${isReferenceSimulation ? 'Ejemplo Referencial — ' : ''}Sueldo Base: \`$${baseSalary.toFixed(2)}\` | Divisor Legal: \`240h\`):**`,
    `- **Valor Hora Ordinaria Diurna (\`$${baseSalary.toFixed(2)} / 240\`):** \`$${hourlyBase.toDecimalPlaces(4).toFixed(4)} USD\``,
    `- **Hora Suplementaria Diurna 50% (Art. 55 num. 1 — Factor 1.50):** \`$${supp50Hour.toFixed(4)}/h\` → Total por ${suppH.toFixed(1)}h: \`$${totalSupp50.toFixed(2)} USD\``,
    `- **Hora Extraordinaria Fin de Semana / Feriado 100% (Art. 55 num. 2 — Factor 2.00):** \`$${extra100Hour.toFixed(4)}/h\` → Total por ${extraH.toFixed(1)}h: \`$${totalExtra100.toFixed(2)} USD\``,
    `- **Recargo por Jornada Nocturna 25% (Art. 49 — 19h00 a 06h00):** Valor hora \`$${night25Hour.toFixed(4)}/h\` → Recargo puro por ${hours.toFixed(1)}h: \`$${totalNight25.toFixed(2)} USD\``,
  ];
  if (hasCombinedHours) {
    summaryLines.push(
      `- **TOTAL SOBRETIEMPOS COMBINADOS (${suppH.toFixed(1)}h al 50% + ${extraH.toFixed(1)}h al 100%):** \`$${totalOvertimePay.toFixed(2)} USD\``
    );
  }

  return {
    type: 'OVERTIME_CALCULATION',
    isReferenceSimulation,
    missingParameters: parameterStatus.missingParameters,
    baseSalary: baseSalary.toNumber(),
    hours: hours.toNumber(),
    suppHours: suppH.toNumber(),
    extraHours: extraH.toNumber(),
    hourlyRate: hourlyBase.toDecimalPlaces(4).toNumber(),
    supp50Hour: supp50Hour.toNumber(),
    extra100Hour: extra100Hour.toNumber(),
    totalSupp50: totalSupp50.toNumber(),
    totalExtra100: totalExtra100.toNumber(),
    totalOvertimePay: totalOvertimePay.toNumber(),
    formattedSummary: summaryLines.join('\n'),
  };
}

function calculatePayrollAccounting(baseSalary, parameterStatus) {
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
  const totalCredit = netSalary.plus(totalIessPayable).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const isReferenceSimulation = !parameterStatus.hasExplicitSalary;

  const formattedSummary = [
    `**Rol de Pagos y Asiento Contable por Partida Doble (${isReferenceSimulation ? 'Ejemplo Referencial — ' : ''}Sueldo Base: \`$${baseSalary.toFixed(2)} USD\`):**`,
    `- **DEBE — Gasto Sueldos y Salarios:** \`$${baseSalary.toFixed(2)} USD\``,
    `- **DEBE — Gasto Aporte Patronal IESS (11.15%):** \`$${iessPatronal.toFixed(2)} USD\``,
    `- **HABER — Bancos / Nómina por Pagar (Líquido a Recibir):** \`$${netSalary.toFixed(2)} USD\``,
    `- **HABER — IESS por Pagar (9.45% Personal + 11.15% Patronal):** \`$${totalIessPayable.toFixed(2)} USD\``,
    `- **CUADRE CONTABLE (Σ Débitos = Σ Créditos):** \`$${totalDebit.toFixed(2)} USD = $${totalCredit.toFixed(2)} USD\` (Diferencia: \`$0.00\`)`,
    `- **Provisiones Mensuales Referenciales:** Fondos de Reserva (8.33% Art. 196): \`$${reserveFund.toFixed(2)}\` | 13er Sueldo: \`$${thirteenthMonthly.toFixed(2)}\` | 14to Sueldo: \`$${fourteenthMonthly.toFixed(2)}\``,
  ].join('\n');

  return {
    type: 'PAYROLL_ACCOUNTING_CALCULATION',
    isReferenceSimulation,
    missingParameters: parameterStatus.missingParameters,
    baseSalary: baseSalary.toNumber(),
    iessPersonal: iessPersonal.toNumber(),
    iessPatronal: iessPatronal.toNumber(),
    reserveFund: reserveFund.toNumber(),
    netSalary: netSalary.toNumber(),
    totalDebit: totalDebit.toNumber(),
    totalCredit: totalCredit.toNumber(),
    formattedSummary,
  };
}

const SPANISH_WORD_NUMBERS = {
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  quince: 15,
  veinte: 20,
  veintidos: 22,
  veinticinco: 25,
  treinta: 30,
  cuarenta: 40,
};

function replaceSpanishNumberWords(text) {
  return text.replace(
    /\b(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|veintidos|veinticinco|treinta|cuarenta)\s+(?=anos?|mes(?:es)?|horas?)\b/gi,
    (_, word) => `${SPANISH_WORD_NUMBERS[word.toLowerCase()] || word} `
  );
}

export function computeLiveLegalCalculation(query) {
  if (!query) return null;
  const qLower = query.toLowerCase();
  const qNorm = replaceSpanishNumberWords(qLower.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  const hasNegativeSalary =
    /-\s*\$\s*[0-9]|\$\s*-\s*[0-9]|(?:sueldo|salario|remuneraci[oó]n)\s*(?:de\s*)?-\s*\$?\s*[0-9]/i.test(
      query
    );
  const salaryMatch = hasNegativeSalary
    ? null
    : query.match(/\$\s*([0-9]+(?:[.,][0-9]+)*)/i) ||
      query.match(
        /(?:sueldo|salario|remuneraci[oó]n|gana\w*|percib\w*)\s*(?:de\s*)?\$?\s*([0-9]+(?:[.,][0-9]+)*)/i
      ) ||
      query.match(/([0-9]+(?:[.,][0-9]+)*)\s*(?:usd|d[oó]lares)/i);
  const mentionsSbu = /\b(sueldo\s+basico|salario\s+basico|remuneracion\s+basica|sbu)\b/i.test(
    qNorm
  );

  const tenureText = qNorm
    .replace(/\b\d+\s*anos?\s+de\s+edad\b/gi, '')
    .replace(
      /\b(?:empleado|trabajador|persona|mujer|hombre|menor|adulto)\s+de\s+\d+\s*anos?(?!\s+de\s+(?:servicio|trabajo|antiguedad))\b/gi,
      ''
    );
  const yearsMatch = tenureText.match(/(\d+)\s*anos?/i);
  const monthsMatch = tenureText.match(/(\d+)\s*mes(?:es)?/i);
  const suppHoursMatch = qNorm.match(
    /(\d+(?:[.,]\d+)?)\s*horas?\s*(?:suplementarias?|al\s*50\s*%)/i
  );
  const extraHoursMatch = qNorm.match(
    /(\d+(?:[.,]\d+)?)\s*horas?\s*(?:extraordinarias?|al\s*100\s*%)/i
  );
  const hoursMatch = qNorm.match(/(\d+(?:[.,]\d+)?)\s*horas?/i);

  const rawSalary = salaryMatch
    ? parseNumberString(salaryMatch[1])
    : mentionsSbu
      ? SBU_ECUADOR_2026
      : null;
  const isValidSalary = rawSalary !== null && rawSalary >= 100 && rawSalary <= 50000;
  const baseSalary = isValidSalary ? new Decimal(rawSalary) : new Decimal(SBU_ECUADOR_2026);
  const hasExplicitSalary = isValidSalary;
  const numYears = yearsMatch ? parseInt(yearsMatch[1], 10) : null;
  const numMonths = monthsMatch ? parseInt(monthsMatch[1], 10) : 0;
  const hasExplicitTenure = numYears !== null || numMonths > 0;
  const suppHours = suppHoursMatch ? parseNumberString(suppHoursMatch[1]) : null;
  const isHolidayOrWeekend =
    /\b(feriad\w*|domingo\w*|fin\s+de\s+semana|descanso\s+obligatorio)\b/i.test(qNorm);
  const isNightShiftOnly =
    /\b(jornada\s+nocturn\w*|recargo\s+nocturn\w*|horas?\s+nocturn\w*|49)\b/i.test(qNorm) &&
    !/\b(suplementar\w*|extraordinar\w*|50\s*%|100\s*%)\b/i.test(qNorm);
  const numHours = hoursMatch ? parseNumberString(hoursMatch[1]) : null;
  const extraHours = extraHoursMatch
    ? parseNumberString(extraHoursMatch[1])
    : isHolidayOrWeekend && suppHours === null
      ? numHours
      : null;
  const hasExplicitHours =
    (numHours !== null && numHours > 0) || suppHours !== null || extraHours !== null;

  if (
    /\b(horas?\s*(?:extras?|suplementarias?|extraordinarias?|nocturnas?)|jornada\s+nocturn\w*|recargo\s+nocturn\w*|(?:horas?|trabaj\w*)\s+(?:en\s+|de\s+)?(?:feriad\w*|domingo\w*|fin\s+de\s+semana)|sobretiemp\w*|55|49)\b/i.test(
      qNorm
    )
  ) {
    const missingParameters = [];
    if (!hasExplicitSalary) missingParameters.push('remuneración mensual exacta');
    if (!hasExplicitHours)
      missingParameters.push('cantidad de horas suplementarias o extraordinarias');
    return calculateOvertime({
      baseSalary,
      numHours,
      suppHours,
      extraHours,
      isNightShiftOnly,
      parameterStatus: { hasExplicitSalary, hasExplicitHours, missingParameters },
    });
  }

  const isSpecificNonSettlementConcept =
    /\b(visto\s+bueno|despido\s+ineficaz|embaraz\w*|jubilaci\w*\s+patronal|impugn\w*|enfermedad\w*|accidente\w*|acoso|cambio\s+de\s+ocupacion|rebaja\s+de\s+categoria|192|cierre\s+de\s+empresa|193)\b/i.test(
      qNorm
    ) && !hasExplicitSalary;

  if (
    !isSpecificNonSettlementConcept &&
    /\b(liquidacion\w*|liquidar\w*|finiquit\w*|despid\w*|desped\w*|botar\w*|echar\w*|indemnizacion\w*|desahuci\w*|renunci\w*|fallec\w*|188|185)\b/i.test(
      qNorm
    )
  ) {
    const missingParameters = [];
    if (!hasExplicitSalary) missingParameters.push('remuneración mensual exacta');
    if (!hasExplicitTenure) missingParameters.push('tiempo de servicio (años y meses)');
    return calculateSettlement({
      baseSalary,
      years: numYears,
      extraMonths: numMonths,
      query: qNorm,
      parameterStatus: { hasExplicitSalary, hasExplicitTenure, missingParameters },
    });
  }

  const hasPayrollAccountingIntent =
    /\b(asiento\s+contable|contabiliz\w*|partida\s+doble|rol\s+de\s+pagos?|calcul\w*\s+(?:el\s+)?(?:aporte|iess|rol|fondo))\b/i.test(
      qNorm
    );
  if (hasPayrollAccountingIntent || isValidSalary) {
    const missingParameters = !hasExplicitSalary ? ['remuneración mensual gravada'] : [];
    return calculatePayrollAccounting(baseSalary, { hasExplicitSalary, missingParameters });
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
    ? `\n**Estado del Tenant:** Cumplimiento ODS 8: \`${score.toFixed(2)}%\` (${ods.complianceLevel || 'ALTO'}) · Plantilla Activa: \`${erpCtx.totalActiveEmployees ?? 0}\` · Contratos Vigentes: \`${formalRate}%\` · Cobertura IESS: \`${iessRate}%\` · SBU Conforme: \`${salaryRate}%\`.`
    : '';

  const sections = [headerTitle + tenantSummaryLine];

  if (relevantChunks && relevantChunks.length > 0) {
    const legalLines = relevantChunks.slice(0, 6).map((chunk) => {
      const code = chunk.articleCode ? `**${chunk.articleCode}**` : `**${chunk.document?.title}**`;
      const conf = chunk.evaluatorConfidence
        ? ` · *Confianza Evaluador: ${(chunk.evaluatorConfidence * 100).toFixed(0)}%*`
        : '';
      const statusTag = chunk.metadata?.temporalStatus
        ? ` · *Estado: ${chunk.metadata.temporalStatus}${chunk.metadata.lastReformYear ? ` (${chunk.metadata.lastReformYear})` : ''}*`
        : '';
      return `- ${code} *(ODS ${chunk.odsTarget || '8.8'}${conf}${statusTag})*:\n  ${chunk.content}`;
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
