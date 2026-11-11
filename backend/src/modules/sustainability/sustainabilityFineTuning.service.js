/**
 * @file sustainabilityFineTuning.service.js
 * @description Generador y exportador de datasets de Fine-Tuning para modelos LLM grandes (Llama 3, Qwen, Mistral, OpenAI)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import sustainabilityRepository from './sustainability.repository.js';
import { ECUADOR_LABOR_CORPUS } from './data/ecuadorLaborKnowledge.js';

export class SustainabilityFineTuningService {
  /**
   * Genera el conjunto de datos de entrenamiento en formato JSONL o estándar Alpaca
   * @param {Object} options
   */
  async generateDataset({ targetModel = 'llama3', includeTenantData = false, tenantId = null, categories = [] }) {
    let rawChunks;
    try {
      rawChunks = await sustainabilityRepository.getAllChunksForDataset({
        categories,
        includeTenantData,
        tenantId,
      });
    } catch {
      // Fallback a memoria si la base de datos no está levantada
      rawChunks = [];
      for (const doc of ECUADOR_LABOR_CORPUS) {
        for (const chunk of doc.chunks) {
          rawChunks.push({
            ...chunk,
            document: { title: doc.title, category: doc.category },
          });
        }
      }
    }

    const dataset = [];

    // 1. Escenarios de entrenamiento fundamentales basados en la legislación de Ecuador y ODS 8
    const baseScenarios = this.getBaseScenarios();

    for (const scenario of baseScenarios) {
      dataset.push(this.formatRecord(scenario, targetModel));
    }

    // 2. Síntesis a partir de los chunks legales cargados en la base de datos
    for (const chunk of rawChunks) {
      const chunkScenario = {
        systemPrompt: 'Eres un asesor senior en legislación laboral del Ecuador y auditor técnico de sostenibilidad ODS 8 en Norma ERP.',
        userQuery: `¿Cuál es el marco legal y requerimiento técnico de ${chunk.articleCode || chunk.document?.title}?`,
        assistantResponse: `Fundamento Jurídico en Ecuador (${chunk.document?.title}):\n\n${chunk.content}\n\nAlineación con el ODS 8 (Meta ${chunk.odsTarget || '8.8'}): Toda transacción de nómina o contrato debe registrarse en el sistema con trazabilidad criptográfica y conciliación ante el IESS y el Ministerio del Trabajo.`,
      };
      dataset.push(this.formatRecord(chunkScenario, targetModel));
    }

    return {
      targetModel,
      totalSamples: dataset.length,
      format: 'jsonl',
      samples: dataset,
    };
  }

  /**
   * Convierte un registro al formato requerido por el framework del modelo grande
   * @private
   */
  formatRecord({ systemPrompt, userQuery, assistantResponse }, targetModel) {
    if (targetModel === 'openai') {
      return {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
          { role: 'assistant', content: assistantResponse },
        ],
      };
    }

    // Formato estándar Alpaca / Unsloth / LLaMA-Factory (Llama 3, Qwen 2.5, Mistral)
    return {
      instruction: userQuery,
      input: '',
      output: assistantResponse,
      system: systemPrompt,
    };
  }

  /**
   * Banco de escenarios de alta precisión para fine-tuning
   * @private
   */
  getBaseScenarios() {
    return [
      {
        systemPrompt: 'Eres el Asistente Experto de Cumplimiento Laboral de Ecuador y Gobernanza ODS 8 en Norma ERP.',
        userQuery: '¿Cómo se liquida a un trabajador con 4 años y 2 meses de servicio por despido intempestivo en Ecuador?',
        assistantResponse: 'Para una desvinculación por despido intempestivo en Ecuador:\n\n1. Indemnización por Despido Intempestivo (Art. 188 del Código del Trabajo): Al superar los 3 años de servicio, corresponden 5 meses de remuneración (la fracción de año se liquida como año completo).\n2. Bonificación por Desahucio (Art. 185 del Código del Trabajo): Corresponde el 25% del salario mensual por cada año completo cumplido (4 años = 1 salario mensual completo adicional).\n3. Proporcionales de Ley: Decimotercero, decimocuarto y vacaciones no gozadas devengadas hasta la fecha de cese.\n4. Cumplimiento ODS 8 (Meta 8.8): Norma ERP genera el acta formal con firma digital SHA-256 para verificación inmediata en el Ministerio del Trabajo (SUT).',
      },
      {
        systemPrompt: 'Eres el Asistente Experto de Cumplimiento Laboral de Ecuador y Gobernanza ODS 8 en Norma ERP.',
        userQuery: '¿Qué porcentaje de horas extras se debe cancelar a un colaborador que labora un domingo o feriado en Ecuador?',
        assistantResponse: 'Según el Artículo 55 del Código del Trabajo del Ecuador, el trabajo ejecutado en días sábados, domingos o de descanso obligatorio feriado se considera hora extraordinaria y tiene un recargo del 100% sobre el valor hora de la remuneración ordinaria. En Norma ERP, la marcación se audita mediante geocercas biométricas para asegurar el pago íntegro sin recortes arbitrarios (ODS 8, Meta 8.8).',
      },
      {
        systemPrompt: 'Eres el Asistente Experto de Cumplimiento Laboral de Ecuador y Gobernanza ODS 8 en Norma ERP.',
        userQuery: '¿Cuál es la aportación obligatoria al IESS y cómo impacta en el ODS 8?',
        assistantResponse: 'En el Ecuador, la aportación mensual obligatoria al IESS sobre la materia gravada es del 20.60% (9.45% de retención personal al trabajador y 11.15% de aporte patronal). Adicionalmente, a partir del mes 13 de relación continua, se cancela el 8.33% por fondos de reserva. El cumplimiento de este indicador alimenta la Meta 8.5 del ODS 8, garantizando cobertura médica, jubilación y erradicación de la informalidad laboral.',
      },
      {
        systemPrompt: 'Eres el Asistente Experto de Cumplimiento Laboral de Ecuador y Gobernanza ODS 8 en Norma ERP.',
        userQuery: '¿Puede un contrato formal de jornada completa pactar un salario de 400 USD?',
        assistantResponse: 'No es legal. En Ecuador, para el año 2026, el Salario Básico Unificado (SBU) se ubica en $460.00 USD mensuales para jornada completa de 40 horas semanales (Art. 81 y 117 del Código del Trabajo). Todo contrato por debajo del SBU infringe la ley laboral ecuatoriana y degrada el indicador 8.5.2 (Salario Digno) de Norma ERP al estado NEEDS_ATTENTION.',
      },
    ];
  }
}

export default new SustainabilityFineTuningService();
