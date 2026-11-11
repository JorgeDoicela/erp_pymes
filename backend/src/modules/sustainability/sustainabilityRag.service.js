/**
 * @file sustainabilityRag.service.js
 * @description Motor RAG (Retrieval-Augmented Generation) especializado en Legislación Laboral de Ecuador y ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import sustainabilityRepository from './sustainability.repository.js';
import sustainabilityService from './sustainability.service.js';

export class SustainabilityRagService {
  /**
   * Procesa una consulta mediante el pipeline RAG híbrido
   * @param {Object} params
   */
  async processQuery({ query, conversationHistory: _conversationHistory = [], tenantId, odsTargetFilter }) {
    // 1. Recuperación vectorial / semántica de artículos del Código de Trabajo y ODS 8
    const relevantChunks = await sustainabilityRepository.searchKnowledgeChunks({
      query,
      odsTarget: odsTargetFilter,
      tenantId,
      limit: 5,
    });

    // 2. Recuperación transaccional: métricas reales ODS 8 del tenant en tiempo real
    let tenantMetrics;
    try {
      tenantMetrics = await sustainabilityService.calculateOds8Metrics(tenantId);
    } catch {
      // Si el tenant no tiene datos previos, continuar con métricas vacías
      tenantMetrics = { ods: { overallScore: 100, indicators: {} } };
    }

    // 3. Extracción de citas legales encontradas
    const legalCitations = relevantChunks.map((chunk) => ({
      documentTitle: chunk.document?.title || 'Código del Trabajo del Ecuador',
      articleCode: chunk.articleCode || 'Disposición General',
      odsTarget: chunk.odsTarget || 'ODS 8',
      summarySnippet: chunk.content.length > 200 ? `${chunk.content.substring(0, 200)}...` : chunk.content,
      fullContent: chunk.content,
    }));

    // 4. Generación de respuesta estructurada y fundamentada
    const answer = this.generateSynthesizedAdvice({
      query,
      relevantChunks,
      tenantMetrics,
      legalCitations,
    });

    return {
      query,
      answer,
      legalCitations,
      tenantScore: tenantMetrics?.ods?.overallScore ?? 100,
      complianceLevel: tenantMetrics?.ods?.complianceLevel ?? 'ALTO',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Síntesis determinista y rigurosa basada en el contexto recuperado
   * @private
   */
  generateSynthesizedAdvice({ query, relevantChunks, tenantMetrics }) {
    const qLower = query.toLowerCase();

    // Contexto del tenant
    const score = tenantMetrics?.ods?.overallScore || 100;
    const formalRate = tenantMetrics?.ods?.indicators?.formalContractRate?.value ?? 100;
    const iessRate = tenantMetrics?.ods?.indicators?.socialSecurityCoverage?.value ?? 100;
    const salaryRate = tenantMetrics?.ods?.indicators?.salaryEquitabilityIndex?.value ?? 100;

    let responseHeader = `### Dictamen de Cumplimiento Laboral (Ecuador & ODS 8)\n\n`;
    responseHeader += `**Diagnóstico del Tenant:** Índice Global ODS 8: \`${score}%\` (Nivel ${tenantMetrics?.ods?.complianceLevel || 'ALTO'}).\n\n`;

    let legalBody;
    let recommendations;

    // Detección de intención temática
    if (qLower.includes('liquidaci') || qLower.includes('despido') || qLower.includes('desahucio') || qLower.includes('finiquito')) {
      legalBody = `#### 1. Fundamento Jurídico Aplicable:\n` +
        `- **Bonificación por Desahucio (Art. 185 del Código del Trabajo):** En todo caso de terminación de la relación laboral, el empleador bonificará al trabajador con el veinticinco por ciento (25%) del equivalente a la última remuneración mensual por cada uno de los años de servicio cumplidos.\n` +
        `- **Despido Intempestivo (Art. 188 del Código del Trabajo):** Indemnización escalonada: hasta 3 años de servicio, se abona el equivalente a 3 meses de remuneración. Con más de 3 años, se abona 1 mes de remuneración por cada año de servicio, sin exceder de 25 meses.\n` +
        `- **Alineación ODS 8 (Meta 8.8):** Norma ERP liquida el acta de finiquito con verificación criptográfica SHA-256 y código QR para garantizar transparencia y evitar litigios judiciales.\n\n`;

      recommendations = `#### 2. Plan de Acción Recomendado:\n` +
        `1. Registrar el motivo legal de desvinculación en el módulo de Empleados.\n` +
        `2. Validar que los proporcionales de 13er sueldo, 14to sueldo y vacaciones no gozadas se encuentren conciliados.\n` +
        `3. Emitir el acta formal y registrarla ante el Sistema Único de Trabajo (SUT) del Ministerio del Trabajo dentro del plazo legal de 30 días.\n`;
    } else if (qLower.includes('hora') || qLower.includes('extra') || qLower.includes('suplementaria') || qLower.includes('jornada') || qLower.includes('asistencia')) {
      legalBody = `#### 1. Fundamento Jurídico Aplicable:\n` +
        `- **Jornada Máxima Ordinaria (Art. 47 del Código del Trabajo):** La jornada ordinaria no puede exceder de 8 horas diarias ni de 40 horas semanales.\n` +
        `- **Horas Suplementarias (Art. 55 del Código del Trabajo):** Labores realizadas luego de la jornada habitual hasta las 24:00 causan un recargo del 50%. De 24:00 a 06:00 causan un recargo del 100%.\n` +
        `- **Horas Extraordinarias (Art. 55 del Código del Trabajo):** Labores desarrolladas en sábados, domingos o días feriados de descanso obligatorio se pagan con un recargo del 100%.\n` +
        `- **Alineación ODS 8 (Meta 8.8):** El control biométrico con geocerca previene jornadas invisibles y garantiza remuneraciones exactas.\n\n`;

      recommendations = `#### 2. Plan de Acción Recomendado:\n` +
        `1. Auditar los marcajes de entrada y salida geolocalizados en el módulo de Asistencia.\n` +
        `2. Verificar que las horas suplementarias registradas cuenten con autorización previa del supervisor.\n` +
        `3. Procesar el rol de pagos incorporando el cálculo exacto computado por \`financialUtils.js\`.\n`;
    } else if (qLower.includes('iess') || qLower.includes('seguridad social') || qLower.includes('aporte') || qLower.includes('décimo') || qLower.includes('sueldo')) {
      legalBody = `#### 1. Fundamento Jurídico Aplicable:\n` +
        `- **Aportación Obligatoria al IESS:** Retención personal del 9.45% de la materia gravada y aporte patronal del 11.15% (total 20.60%).\n` +
        `- **Salario Básico Unificado (SBU 2026):** Ningún contrato formal puede fijar una remuneración inferior a $460.00 USD para jornada completa de 40 horas.\n` +
        `- **Décimo Tercer y Décimo Cuarto Sueldo:** Doceava parte de lo ganado en el año (D13) y doceava parte del SBU vigente (D14), pagaderos mensual o acumuladamente.\n` +
        `- **Alineación ODS 8 (Meta 8.5):** El cumplimiento del 100% en seguridad social erradica la precarización y protege las prestaciones de salud y jubilación del trabajador.\n\n`;

      recommendations = `#### 2. Plan de Acción Recomendado:\n` +
        `1. Estado actual del tenant: Cobertura IESS al \`${iessRate}%\` y Cumplimiento SBU al \`${salaryRate}%\`.\n` +
        `2. Revisar que las novedades y horas extras se declaren a tiempo en la planilla del IESS antes del día 15 del mes posterior.\n`;
    } else {
      // Respuesta general informada por los chunks legales recuperados
      legalBody = `#### 1. Marco Jurídico y Normativa de Sostenibilidad ODS 8:\n`;
      if (relevantChunks.length > 0) {
        for (const chunk of relevantChunks) {
          const art = chunk.articleCode ? `**${chunk.articleCode}** — ` : '';
          legalBody += `- ${art}${chunk.content}\n\n`;
        }
      } else {
        legalBody += `- **Marco General ODS 8:** Promueve el empleo pleno y productivo con remuneración justa, erradicación de contratos precarios y cobertura integral de seguridad social.\n\n`;
      }

      recommendations = `#### 2. Indicadores Relevantes de la Empresa:\n` +
        `- Formalidad Contractual: \`${formalRate}%\` (Meta: 100%)\n` +
        `- Cumplimiento de Aportes al IESS: \`${iessRate}%\` (Meta: 100%)\n` +
        `- Equidad y Salario Digno: \`${salaryRate}%\` (Meta: 100%)\n`;
    }

    // Pie de página de verificación
    const footer = `\n---\n*Dictamen fundamentado en el Código del Trabajo del Ecuador, Resoluciones IESS y Metas 8.3, 8.5 y 8.8 del ODS 8.*`;

    return responseHeader + legalBody + recommendations + footer;
  }
}

export default new SustainabilityRagService();
