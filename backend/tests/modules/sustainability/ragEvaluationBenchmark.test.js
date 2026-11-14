/**
 * @file ragEvaluationBenchmark.test.js
 * @description Suite de certificación extremo a extremo del sistema RAG Jurídico de Norma ERP:
 * 6 métricas (Context Precision, Context Recall, Faithfulness, Answer Correctness, Citation Accuracy,
 * Temporal Validity) y las 5 pruebas de estrés obligatorias (Despido Art. 188 íntegro, Vacaciones Arts. 69/71,
 * Décimo Cuarto Quito Sierra Art. 113, Control Fuera del Corpus y Reforma Vigente vs Derogado).
 */

import { describe, it, expect } from 'vitest';
import ragEvaluationService from '../../../src/modules/sustainability/ragEvaluation.service.js';
import sustainabilityRagService from '../../../src/modules/sustainability/sustainabilityRag.service.js';
import sustainabilityRepository from '../../../src/modules/sustainability/sustainability.repository.js';
import legalEvaluatorService from '../../../src/modules/sustainability/legalEvaluator.service.js';
import { computeLiveLegalCalculation } from '../../../src/modules/sustainability/legalCalculation.helper.js';

describe('RAG Legal Evaluation Benchmark (Ragas / DeepEval Standard)', () => {
  it('verifica higiene del corpus: 1,810 fragmentos con vectores 768d y Art. 188 íntegro sin ruido de Gaceta Judicial', () => {
    const stats = sustainabilityRepository.getCorpusStatistics();
    expect(stats.totalIndexedChunks).toBeGreaterThanOrEqual(1800);
    expect(stats.embeddingDim).toBe(768);
    expect(stats.trainedArticlesCount).toBe(stats.totalIndexedChunks);

    const mem = sustainabilityRepository.ensureMemoryIndexLoaded();
    const art188Chunks = mem.indexedDocs.filter(
      (d) =>
        d.chunk.document?.category === 'LABOR_CODE' &&
        /\bArt\.\s*188\b/i.test(d.chunk.articleCode || '')
    );

    // Art. 188 debe existir como un único fragmento íntegro (sin Parte 2 ni Parte 3 de Gaceta Judicial)
    expect(art188Chunks).toHaveLength(1);
    const art188Content = art188Chunks[0].chunk.content;
    expect(art188Content).toContain('Hasta tres años de servicio');
    expect(art188Content).toContain('veinte y cinco meses de remuneración');
    expect(art188Content).toContain('fracción de un año se considerará como año completo');
    expect(art188Content).not.toMatch(/Gaceta Judicial/i);
    expect(art188Content).not.toMatch(/LEXIS FINDER/i);
  });

  it('supera las 5 pruebas obligatorias de diagnóstico RAG con >= 90% en las 6 métricas', async () => {
    const report = await ragEvaluationService.runMandatoryBenchmarkSuite({ provider: 'local' });

    expect(report.totalCases).toBe(5);
    for (const testCase of report.cases) {
      expect(
        testCase.passed,
        `Fallo en caso ${testCase.id}: ${JSON.stringify(testCase.metrics)}`
      ).toBe(true);
      expect(testCase.metrics.contextPrecision).toBeGreaterThanOrEqual(0.8);
      expect(testCase.metrics.contextRecall).toBeGreaterThanOrEqual(0.95);
      expect(testCase.metrics.faithfulness).toBeGreaterThanOrEqual(0.85);
      expect(testCase.metrics.answerCorrectness).toBeGreaterThanOrEqual(0.85);
      expect(testCase.metrics.citationAccuracy).toBeGreaterThanOrEqual(0.95);
      expect(testCase.metrics.temporalValidity).toBeGreaterThanOrEqual(0.95);
    }
    expect(report.allPassed).toBe(true);
    expect(report.summaryMetrics.overallScore).toBeGreaterThanOrEqual(0.92);
  }, 30000);

  it('impide presentar como 100% verificado un artículo del corpus que no fue recuperado en el contexto', () => {
    const retrievedChunks = [
      {
        articleCode: 'Art. 188',
        content: 'Art. 188.- Indemnización por despido intempestivo.',
        evaluatorConfidence: 0.95,
      },
    ];
    const knownSet = new Set(['188', '69', '71']);

    // Simula el fallo reportado: DeepSeek cita Art. 188 y Art. 69, pero Art. 69 no está en retrievedChunks
    const audit = legalEvaluatorService.verifyAnswerFidelity({
      answerText:
        'Según el Art. 188 corresponde indemnización por despido y según el Art. 69 corresponden vacaciones.',
      retrievedChunks,
      liveCalculation: null,
      allKnownArticleCodes: knownSet,
    });

    expect(audit.verifiedArticles).toEqual(['Art. 188']);
    expect(audit.corpusSupportedArticles).toEqual(['Art. 69']);
    expect(audit.citationAccuracy).toBe(0.5);
    expect(audit.status).toBe('AUDITED_WITH_CORRECTION');
    expect(audit.auditedAnswer).toContain(
      '*Artículos existentes en el corpus pero ausentes en los fragmentos primarios de esta consulta:* Art. 69'
    );
  });

  it('detecta cuando se cita un artículo derogado sin advertir su derogatoria (Temporal Validity)', () => {
    const retrievedChunks = [
      {
        articleCode: 'Art. 175',
        content: 'Art. 175.- Caso de contrato por tiempo fijo. Nota: Artículo derogado.',
        metadata: { isRepealed: true, temporalStatus: 'DEROGADO' },
        evaluatorConfidence: 0.9,
      },
    ];

    const auditBad = legalEvaluatorService.verifyAnswerFidelity({
      answerText: 'El Art. 175 permite aplicar el visto bueno en contratos por tiempo fijo.',
      retrievedChunks,
      liveCalculation: null,
      allKnownArticleCodes: new Set(['175']),
    });

    expect(auditBad.temporalValidity).toBe(0.5);
    expect(auditBad.repealedCitationsWarning).toEqual(['Art. 175']);
    expect(auditBad.auditedAnswer).toContain('*Alerta de Vigencia Temporal:* Art. 175');

    const auditGood = legalEvaluatorService.verifyAnswerFidelity({
      answerText: 'El Art. 175 se encuentra derogado por la Ley Orgánica para la Justicia Laboral.',
      retrievedChunks,
      liveCalculation: null,
      allKnownArticleCodes: new Set(['175']),
    });

    expect(auditGood.temporalValidity).toBe(1.0);
    expect(auditGood.repealedCitationsWarning).toEqual([]);
  });

  it('distingue entre simulación referencial sin parámetros y cálculo exacto con parámetros completos', () => {
    const simCalc = computeLiveLegalCalculation('¿Cuánto debo pagar al despedir a un trabajador?');
    expect(simCalc).not.toBeNull();
    expect(simCalc.isReferenceSimulation).toBe(true);
    expect(simCalc.missingParameters).toContain('remuneración mensual exacta');
    expect(simCalc.missingParameters).toContain('tiempo de servicio (años y meses)');
    expect(simCalc.formattedSummary).toContain('Ejemplo Referencial Ilustrativo');

    const exactCalc = computeLiveLegalCalculation(
      'Calcular liquidación por despido con sueldo de $1200 y 5 años de servicio'
    );
    expect(exactCalc).not.toBeNull();
    expect(exactCalc.isReferenceSimulation).toBe(false);
    expect(exactCalc.missingParameters).toEqual([]);
    expect(exactCalc.formattedSummary).toContain(
      'Cálculo Exacto Verificado con Parámetros Completos'
    );
  });

  it('supera la batería extrema de 18 escenarios complejos (instituciones jurídicas, cálculos combinados y fuera de dominio)', async () => {
    const extremeScenarios = [
      {
        name: 'Visto Bueno (Empleador / Trabajador)',
        query:
          '¿Cuáles son las causales de visto bueno para que el empleador despida a un trabajador con justa causa?',
        expectArticles: ['172', '173'],
      },
      {
        name: 'Despido Ineficaz Embarazada',
        query: '¿Qué pasa si despiden a una mujer embarazada o en período de maternidad?',
        expectArticles: ['195.1', '195.3', '153'],
      },
      {
        name: 'Jubilación Patronal',
        query:
          '¿Cuántos años se necesitan para la jubilación patronal y qué pasa si lo despiden a los 22 años?',
        expectArticles: ['216', '188'],
      },
      {
        name: 'Licencia Maternidad, Paternidad y Lactancia',
        query:
          '¿Cuántos días dura la licencia por maternidad y paternidad y cuántas horas el permiso de lactancia?',
        expectArticles: ['152', '155'],
      },
      {
        name: 'Utilidades 15% (10% y 5% cargas)',
        query:
          '¿Cómo se reparte el 15% de utilidades a los trabajadores y cargas familiares y hasta qué fecha se paga?',
        expectArticles: ['97'],
      },
      {
        name: 'Fondos de Reserva',
        query: '¿Quiénes tienen derecho a fondos de reserva y desde qué mes se pagan?',
        expectArticles: ['196'],
      },
      {
        name: 'Décimo Cuarto en Guayaquil (Costa)',
        query: '¿Cuándo se paga el décimo cuarto sueldo en Guayaquil y la región Costa?',
        expectArticles: ['113'],
      },
      {
        name: 'Décimo Tercer Sueldo',
        query:
          '¿Cómo se calcula el décimo tercer sueldo o bono navideño y cuál es el período de cálculo?',
        expectArticles: ['111'],
      },
      {
        name: 'Período de Prueba',
        query:
          '¿Cuál es la duración máxima del período de prueba en un contrato indefinido por primera vez?',
        expectArticles: ['15'],
      },
      {
        name: 'Contratos Eventuales y Ocasionales (Recargo 35%)',
        query: '¿Qué es un contrato eventual u ocasional y cuál es el recargo del 35%?',
        expectArticles: ['17'],
      },
      {
        name: 'Prescripción de Acciones Laborales',
        query:
          '¿En cuánto tiempo prescriben las acciones provenientes de los actos y contratos de trabajo?',
        expectArticles: ['635'],
      },
      {
        name: 'Impugnación de Acta de Finiquito',
        query:
          '¿Se puede impugnar un acta de finiquito si no fue practicada ante el inspector del trabajo ni pormenorizada?',
        expectArticles: ['595'],
      },
      {
        name: 'Derechos Constitucionales (Irrenunciabilidad y Tercerización)',
        query:
          '¿Qué dice la Constitución sobre la irrenunciabilidad e intangibilidad de los derechos laborales y prohibición de tercerización?',
        expectArticles: ['326', '327'],
      },
      {
        name: 'Afiliación IESS desde el primer día y Mora Patronal',
        query:
          '¿Desde qué día es obligatoria la afiliación al IESS y qué pasa si hay mora patronal?',
        expectArticles: ['73'],
      },
      {
        name: 'Cálculo Horas Suplementarias 50% + Extraordinarias 100%',
        query:
          'Un trabajador gana $960 mensuales y trabajó 10 horas suplementarias al 50% y 6 horas extraordinarias al 100%, ¿cuánto se le paga?',
        expectArticles: ['55'],
        expectMath: 108.0,
      },
      {
        name: 'Cálculo Liquidación por Renuncia Voluntaria con 8 meses (< 1 año)',
        query:
          'Renunció voluntariamente un empleado que ganaba $600 y trabajó 8 meses, ¿cuánto le toca de liquidación?',
        expectArticles: ['185', '69', '71', '111', '113'],
        expectMath: 906.67,
      },
      {
        name: 'Fuera de Dominio: Receta de cocina',
        query: '¿Cómo preparar un ceviche de camarón ecuatoriano paso a paso?',
        expectOutOfScope: true,
      },
      {
        name: 'Fuera de Dominio: Fútbol / Deportes',
        query: '¿Quién ganó el mundial de fútbol de Qatar 2022 y cuántos goles metió Messi?',
        expectOutOfScope: true,
      },
      // Fase 3: Batería Ultra-Dura (Jerga, Trampas Edad vs Antigüedad, Feriados, Nocturna, Abreviaturas y Multas Tránsito)
      {
        name: 'Jerga Ecuatoriana ("me botaron", "cuatro años" en letras, "sueldo básico")',
        query:
          'Me botaron del trabajo sin aviso después de cuatro años ganando el sueldo básico, ¿cuánto me toca de liquidación?',
        expectArticles: ['188', '185'],
        expectMath: 2875.0,
      },
      {
        name: 'Trampa Edad (45 años de edad) vs Antigüedad Real (4 años de servicio)',
        query:
          'Un empleado de 45 años de edad que trabajó 4 años en la empresa con un sueldo de $1,000 fue despedido intempestivamente, ¿cuánto recibe?',
        expectArticles: ['188', '185'],
        expectMath: 5980.0,
      },
      {
        name: 'Faltas Injustificadas (> 3 días consecutivos - Art. 172)',
        query:
          '¿Qué pasa si un trabajador falta 4 días consecutivos sin justificar a su puesto de trabajo?',
        expectArticles: ['172'],
      },
      {
        name: 'Visto Bueno solicitado por el Trabajador (Art. 173)',
        query:
          'Si el empleador disminuye o no paga puntualmente la remuneración, ¿puede el trabajador pedir visto bueno y recibir indemnización?',
        expectArticles: ['173'],
      },
      {
        name: 'Acoso Laboral / Hostigamiento (Arts. 172 y 173)',
        query:
          '¿Qué sanciones e indemnizaciones aplican en caso de acoso laboral o hostigamiento contra un trabajador?',
        expectArticles: ['172', '173'],
      },
      {
        name: 'Cuota de Inclusión de Personas con Discapacidad (Art. 42)',
        query:
          '¿Cuál es el porcentaje obligatorio de contratación de personas con discapacidad en empresas con al menos 25 trabajadores?',
        expectArticles: ['42'],
      },
      {
        name: 'Límite Legal de Multas Reglamentarias (10% - Art. 44)',
        query:
          '¿Cuál es el porcentaje máximo de multa que el empleador puede descontar del sueldo del trabajador por reglamento interno?',
        expectArticles: ['44'],
      },
      {
        name: 'Inembargabilidad de la Remuneración y Pensiones Alimenticias (Art. 91)',
        query:
          '¿Se puede embargar o retener el sueldo de un trabajador por deudas comunes o solo por pensiones alimenticias?',
        expectArticles: ['91'],
      },
      {
        name: 'Enfermedad No Profesional y Prohibición de Despido (Arts. 42 y 177)',
        query:
          '¿Qué obligación tiene el empleador cuando el trabajador sufre una enfermedad no profesional y no puede ser despedido?',
        expectArticles: ['42', '177'],
      },
      {
        name: 'Riesgos del Trabajo y Accidente Laboral (Art. 353)',
        query:
          '¿Qué obligaciones e indemnizaciones existen cuando ocurre un accidente de trabajo o enfermedad profesional?',
        expectArticles: ['353'],
      },
      {
        name: 'Cálculo de Trabajo en Feriado y Domingo (Recargo 100% - Art. 55)',
        query:
          'Trabajé 8 horas en feriado nacional de carnaval y domingo ganando $960 mensuales, ¿cuánto me deben pagar por esas horas?',
        expectArticles: ['55'],
        expectMath: 64.0,
      },
      {
        name: 'Cálculo de Jornada Nocturna Pura (Recargo 25% - Art. 49)',
        query:
          'Un empleado gana $720 mensuales y realizó 40 horas en jornada nocturna entre las 19h00 y las 06h00, ¿cuánto es el recargo nocturno del 25%?',
        expectArticles: ['49'],
        expectMath: 30.0,
      },
      {
        name: 'Tope Legal de 25 Remuneraciones en Despido con 30 Años de Servicio (Art. 188)',
        query:
          'Despido intempestivo de un trabajador con 30 años de servicio y sueldo de $1,000 mensuales',
        expectArticles: ['188', '185'],
        expectMath: 33480.0,
      },
      {
        name: 'Contrato Colectivo de Trabajo (Art. 220)',
        query:
          '¿Qué es el contrato o pacto colectivo de trabajo y cómo se regula en el Código del Trabajo?',
        expectArticles: ['220'],
      },
      {
        name: 'Edad Mínima y Jornada de Adolescentes (Art. 134)',
        query:
          '¿Cuál es la edad mínima para trabajar en el Ecuador y cuál es la jornada máxima para adolescentes?',
        expectArticles: ['134'],
      },
      {
        name: 'Errores Ortográficos Severos y Abreviaturas ("kito", "14vo")',
        query: 'kiero saber kuanto me pagan x 14vo sueldo en kito o en la sierra',
        expectArticles: ['113'],
      },
      {
        name: 'Jornada Ordinaria de 40 Horas y Descanso de Almuerzo (Arts. 47, 50, 57)',
        query:
          '¿Cuántas horas máximas tiene la jornada ordinaria diaria y de 40 horas semanales y cuánto dura el descanso de almuerzo?',
        expectArticles: ['47', '50', '57'],
      },
      {
        name: 'Liquidación por Fallecimiento del Trabajador (6 años, $800 - Art. 185 sin Art. 188)',
        query:
          'Si un trabajador fallece después de 6 años de servicio ganando $800, ¿qué haberes o desahucio reciben sus herederos?',
        expectArticles: ['185', '69', '71'],
        expectMath: 2030.0,
      },
      {
        name: 'Liquidación en Gye con 9 meses y Abreviaturas ("13vo", "14vo")',
        query:
          'Un empleado en Gye con sueldo de $1,200 trabajó 9 meses y renunció, ¿cuánto recibe por 13vo, 14vo y vacaciones en su liquidación?',
        expectArticles: ['185', '111', '113', '69'],
        expectMath: 1695.0,
      },
      {
        name: 'Despido con Fracción de Año (3 años y 2 meses -> 4 remuneraciones Art. 188)',
        query: 'Despido intempestivo de un trabajador que ganaba $1,000 y trabajó 3 años y 2 meses',
        expectArticles: ['188', '185'],
        expectMath: 5076.67,
      },
      {
        name: 'Despido con Menos de 1 Año (5 meses -> mínimo 3 remuneraciones Art. 188)',
        query:
          'Me despidieron intempestivamente cuando solo llevaba 5 meses trabajando con un sueldo de $600',
        expectArticles: ['188', '185'],
        expectMath: 2366.67,
      },
      {
        name: 'Asiento Contable de Partida Doble y Rol de Pagos ($1,500)',
        query:
          'Generar el asiento contable de partida doble y rol de pagos para un sueldo de $1,500 mensuales',
        expectArticles: ['196'],
        expectMath: 1667.25,
      },
      {
        name: 'Cambio de Ocupación o Rebaja de Categoría (Despido Indirecto Art. 192)',
        query:
          'Si el empleador cambia de ocupación o rebaja de categoría al trabajador sin su consentimiento, ¿se considera despido intempestivo según el Art. 192?',
        expectArticles: ['192', '188'],
      },
      {
        name: 'Cierre o Liquidación Definitiva del Negocio (Art. 193)',
        query:
          'Si el empleador cierra o liquida definitivamente el negocio o la empresa, ¿debe indemnizar a los trabajadores según el Art. 193?',
        expectArticles: ['193', '188', '185'],
      },
      {
        name: 'Responsabilidad Solidaria (Código del Trabajo Art. 41 y Constitución Art. 327)',
        query:
          '¿Qué dice el Código del Trabajo y la Constitución sobre la responsabilidad solidaria entre empleadores o contratistas?',
        expectArticles: ['41', '327'],
      },
      {
        name: 'Jubilación Ordinaria de Vejez en el IESS (Art. 185 LSS)',
        query:
          '¿Cuáles son los requisitos de edad e imposiciones en el IESS para la jubilación ordinaria de vejez?',
        expectArticles: ['185'],
      },
      {
        name: 'Cesantía y Seguro de Desempleo en el IESS (Art. 283 LSS)',
        query:
          '¿Qué requisitos exige la Ley de Seguridad Social para cobrar la cesantía o el seguro de desempleo en el IESS?',
        expectArticles: ['283'],
      },
      {
        name: 'Fuera de Dominio con Trampa de Números: Compra de Auto ($12,000 y 5 años)',
        query:
          'Quiero comprar un auto Toyota usado que cuesta $12,000 con 5 años de garantía y llantas nuevas, ¿qué motor tiene?',
        expectOutOfScope: true,
      },
      {
        name: 'Fuera de Dominio con Trampa Legal: Multa de Tránsito y Licencia de Conducir ($460 en Quito)',
        query:
          'Me pusieron una multa de tránsito de $460 por exceso de velocidad en Quito hace 2 años, ¿cuántos puntos me quitan de la licencia de conducir?',
        expectOutOfScope: true,
      },
    ];

    for (const sc of extremeScenarios) {
      const res = await sustainabilityRagService.processQuery({
        query: sc.query,
        moduleContext: 'sustainability',
        providerOverrides: { provider: 'local' },
      });

      if (sc.expectOutOfScope) {
        expect(res.evaluationAudit?.status, `Fallo fuera de dominio en: ${sc.name}`).toBe(
          'OUT_OF_CORPUS_SCOPE'
        );
        continue;
      }

      expect(res.evaluationAudit?.status, `Falso fuera de dominio en: ${sc.name}`).not.toBe(
        'OUT_OF_CORPUS_SCOPE'
      );
      const retrievedText = (res.legalCitations || [])
        .map((c) => `${c.articleCode || ''} ${c.excerpt || ''}`)
        .join(' ');
      for (const art of sc.expectArticles) {
        const rx = new RegExp(`\\bArt(?:[ií]culo|\\.)?\\s*${art.replace('.', '\\.')}\\b`, 'i');
        expect(rx.test(retrievedText), `No recuperó Art. ${art} en escenario "${sc.name}"`).toBe(
          true
        );
      }
      expect(
        res.evaluationAudit?.citationAccuracy,
        `Citation Accuracy baja en "${sc.name}": ${JSON.stringify(res.evaluationAudit)}`
      ).toBeGreaterThanOrEqual(0.95);

      if (typeof sc.expectMath === 'number') {
        expect(res.liveCalculation, `No ejecutó cálculo en "${sc.name}"`).not.toBeNull();
        expect(res.liveCalculation.isReferenceSimulation).toBe(false);
        const actualTotal =
          res.liveCalculation.totalSettlement ??
          res.liveCalculation.totalOvertimePay ??
          res.liveCalculation.totalDebit;
        expect(actualTotal).toBeCloseTo(sc.expectMath, 1);
      }
    }
  }, 90000);
});
