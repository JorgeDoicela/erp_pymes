/**
 * @file sustainability.repository.js
 * @description Repositorio de persistencia relacional y Motor Buscador Híbrido (BM25 + Índice Invertido +
 * Vectores Entrenados) sobre el 100% de los 4 PDFs oficiales (1,880+ artículos y secciones íntegras).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../database/db.js';
import { ECUADOR_LABOR_CORPUS } from './data/ecuadorLaborKnowledge.js';
import {
  detectRequestedNormativeCategories,
  selectBalancedByCategory,
} from './legalEvaluator.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRAINED_EMBEDDINGS_INDEX_PATH = path.resolve(
  __dirname,
  './data/trained_retriever_index.json'
);

// Diccionario de expansión semántica jurídica y contable de Ecuador
const ECUADOR_LEGAL_SYNONYMS = {
  finiquito: ['liquidacion', 'desvinculacion', 'salida', 'acta', 'haberes', 'cese', '595'],
  despido: ['intempestivo', 'indemnizacion', '188', 'ineficaz', '195', 'cese'],
  desahucio: ['bonificacion', '25%', '185', 'renuncia', 'acuerdo', '184'],
  renuncia: ['voluntaria', 'acuerdo', 'desahucio', '185', '169'],
  visto: ['bueno', 'inspector', '172', '173', 'causal', 'indisciplina', 'faltas'],
  horas: [
    'suplementarias',
    'extraordinarias',
    'sobretiempo',
    'nocturna',
    'jornada',
    '55',
    '47',
    '49',
  ],
  extra: ['suplementarias', 'extraordinarias', 'recargo', '50%', '100%', '55'],
  iess: [
    'seguridad',
    'social',
    'aporte',
    'patronal',
    'personal',
    '9.45%',
    '11.15%',
    'reserva',
    'mora',
    'afiliacion',
    '73',
    '11',
    'primer',
    'dia',
  ],
  fondos: ['reserva', '8.33%', '196', '200', '202', 'iess', 'mensualizado', 'ano'],
  reserva: ['fondos', '8.33%', '196', '200', '202', 'iess', 'mensualizado'],
  decimo: ['decimotercer', 'decimocuarto', '13er', '14to', 'navideno', 'escolar', '111', '113'],
  utilidades: ['15%', '10%', '5%', 'cargas', 'familiares', 'abril', '97', 'reparto'],
  impuesto: ['renta', 'sri', 'lorti', 'gastos', 'personales', 'retencion', 'rdep', '107'],
  contabilidad: [
    'asiento',
    'partida',
    'doble',
    'niif',
    'diario',
    'mayor',
    'balance',
    'debito',
    'credito',
    'provision',
  ],
  asiento: ['contabilidad', 'partida', 'doble', 'journal', 'debito', 'credito', 'pasivo', 'gasto'],
  vacaciones: ['15', 'antiguedad', 'veinticuatroava', '1/24', '69', '71', 'descanso'],
  maternidad: [
    'embarazo',
    'lactancia',
    '12',
    'semanas',
    'paternidad',
    'licencia',
    'ineficaz',
    '152',
    '155',
  ],
  discapacidad: ['4%', 'inclusion', 'sustituto', '42', '47', '330', 'persona'],
  discapacidades: ['4%', 'discapacidad', 'inclusion', 'sustituto', '42', '47', '330'],
  constitucion: [
    'constitucional',
    'republica',
    'derecho',
    'trabajo',
    '33',
    '34',
    '66',
    '325',
    '326',
    '327',
    '328',
  ],
  constitucional: ['constitucion', 'derechos', '33', '66', '325', '326', 'trabajo'],
  forzoso: ['esclavitud', 'servidumbre', 'trabajo', 'obligatorio', '66', '8.7', '8.8', '325'],
  pleno: ['empleo', 'productivo', 'trabajo', 'decente', '8.5', '325', '326'],
  contrato: [
    'indefinido',
    'prueba',
    '90',
    'eventual',
    'ocasional',
    'obra',
    'teletrabajo',
    'sut',
    '14',
    '15',
    '17',
  ],
  sbu: ['salario', 'basico', '460', 'sueldo', 'minimo', 'digno', '81', '117'],
  jubilacion: ['patronal', '25', 'anos', '216', 'vejez', 'pension'],
  lopdp: [
    'proteccion',
    'datos',
    'privacidad',
    'aes-256-gcm',
    'encriptacion',
    'geocerca',
    'consentimiento',
    'biometria',
  ],
  firma: ['electronica', 'p12', 'pkcs12', 'qr', 'sha-256', 'comercio'],
};

export class SustainabilityRepository {
  constructor() {
    this._memoryIndex = null;
    this._knownArticleNumbers = new Set();
    this._trainedEmbeddingsMap = null;
  }

  /**
   * Construye y cachea en memoria el índice invertido BM25 exclusivamente con los 1,880
   * artículos y secciones extraídos al 100% de los 4 PDFs oficiales.
   */
  ensureMemoryIndexLoaded() {
    if (this._memoryIndex) return this._memoryIndex;

    const allChunks = [];

    // 1. Cargar exclusivamente los 1,880 artículos y secciones íntegras de los 4 PDFs oficiales
    for (const doc of ECUADOR_LABOR_CORPUS) {
      const normalizedCategory = doc.docId === 'constitucion_2008' ? 'CONSTITUTION' : doc.category;
      for (const chunk of doc.chunks || []) {
        this.registerArticleNumbers(chunk.articleCode);
        allChunks.push({
          id: `pdf_${doc.docId || normalizedCategory}_${allChunks.length}`,
          content: chunk.content,
          articleCode: chunk.articleCode,
          odsTarget: chunk.odsTarget || '8.8',
          metadata: {
            ...(chunk.metadata || {}),
            docId: doc.docId,
            isFullPdfExtract: true,
          },
          document: {
            title: doc.title,
            category: normalizedCategory,
            version: doc.version || '2026',
            sourceUrl: doc.sourceUrl || null,
          },
        });
      }
    }

    // 3. Cargar vectores densos y priors del Evaluador pre-entrenados desde Colab en trained_retriever_index.json
    this._trainedEmbeddingsMap = null;
    this._trainedCrossEncoderMap = null;
    this._trainedQueryVocabMap = null;

    if (fs.existsSync(TRAINED_EMBEDDINGS_INDEX_PATH)) {
      try {
        const rawVectors = JSON.parse(fs.readFileSync(TRAINED_EMBEDDINGS_INDEX_PATH, 'utf-8'));
        if (rawVectors.embeddingsByArticle) {
          this._trainedEmbeddingsMap = rawVectors.embeddingsByArticle;
        } else if (Array.isArray(rawVectors.articles)) {
          this._trainedEmbeddingsMap = {};
          this._trainedCrossEncoderMap = {};
          for (const item of rawVectors.articles) {
            if (item.articleCode && Array.isArray(item.embedding)) {
              this._trainedEmbeddingsMap[item.articleCode] = item.embedding;
            }
            if (item.articleCode && typeof item.crossEncoderScore === 'number') {
              this._trainedCrossEncoderMap[item.articleCode] = item.crossEncoderScore;
            }
          }
        }
        if (
          rawVectors.queryVocabularyEmbeddings &&
          typeof rawVectors.queryVocabularyEmbeddings === 'object'
        ) {
          this._trainedQueryVocabMap = rawVectors.queryVocabularyEmbeddings;
        }
      } catch {
        this._trainedEmbeddingsMap = null;
        this._trainedCrossEncoderMap = null;
        this._trainedQueryVocabMap = null;
      }
    }

    // 4. Pre-tokenizar todos los fragmentos y construir tabla de frecuencias e IDF para búsqueda en <5ms
    const totalDocs = allChunks.length || 1;
    const docFreq = {};
    let totalLengthSum = 0;

    const indexedDocs = allChunks.map((chunk) => {
      const fullText = `${chunk.articleCode || ''} ${chunk.document?.title || ''} ${chunk.content} ${(chunk.metadata?.keywords || []).join(' ')}`;
      const tokens = this.normalizeText(fullText)
        .split(/\s+/)
        .filter((t) => t.length >= 2);

      const termFreq = {};
      for (const token of tokens) {
        termFreq[token] = (termFreq[token] || 0) + 1;
      }

      for (const uniqueTerm of Object.keys(termFreq)) {
        docFreq[uniqueTerm] = (docFreq[uniqueTerm] || 0) + 1;
      }

      totalLengthSum += tokens.length;

      return {
        chunk,
        termFreq,
        docLen: tokens.length,
        normArticleCode: this.normalizeText(chunk.articleCode || ''),
      };
    });

    const avgDocLength = totalLengthSum / totalDocs || 1;
    const idfMap = {};
    for (const [term, df] of Object.entries(docFreq)) {
      idfMap[term] = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5));
    }

    this._memoryIndex = {
      totalDocs,
      avgDocLength,
      idfMap,
      indexedDocs,
    };

    return this._memoryIndex;
  }

  registerArticleNumbers(articleCode) {
    if (!articleCode) return;
    const matches = [...String(articleCode).matchAll(/(\d+(?:\.\d+)?)/g)];
    for (const m of matches) {
      this._knownArticleNumbers.add(m[1]);
    }
  }

  getKnownArticleNumbers() {
    this.ensureMemoryIndexLoaded();
    return this._knownArticleNumbers;
  }

  /**
   * Obtiene los datos agregados reales de todos los módulos del ERP para computar los KPIs del ODS 8
   * y nutrir el contexto transaccional en vivo del asistente de IA.
   * @param {string} tenantId
   */
  async getOds8AggregatedData(tenantId) {
    // Aislamiento estricto multi-tenant (LOPDP): nunca agregar ni desencriptar salarios si no hay tenantId activo
    if (!tenantId) {
      return {
        totalEmployees: 0,
        employeesWithActiveContract: 0,
        allActiveEmployees: [],
        recentPayrolls: [],
        recentAttendances: [],
        recentOffboardings: [],
        erpSummary: {
          openAccountingPeriods: 0,
          totalJournalEntries: 0,
          openJobVacancies: 0,
          totalPerformanceEvaluations: 0,
          activeEntrepreneurships: 0,
        },
      };
    }

    const whereTenant = { tenantId };
    const whereEmployeeTenant = { employee: { tenantId } };

    const [
      totalEmployees,
      employeesWithActiveContract,
      allActiveEmployees,
      recentPayrolls,
      recentAttendances,
      recentOffboardings,
      accountingPeriodsCount,
      journalEntriesCount,
      activeVacanciesCount,
      evaluationsCount,
      entrepreneurshipsCount,
    ] = await Promise.all([
      prisma.employee.count({
        where: { ...whereTenant, isActive: true },
      }),

      prisma.employee.count({
        where: {
          ...whereTenant,
          isActive: true,
          contracts: {
            some: { status: 'Active' },
          },
        },
      }),

      prisma.employee.findMany({
        where: { ...whereTenant, isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          salary: true,
          department: true,
          position: true,
          contractType: true,
          hireDate: true,
          trackingConsent: true,
          contracts: {
            where: { status: 'Active' },
            select: {
              id: true,
              salary: true,
              type: true,
              startDate: true,
              endDate: true,
              hasDoubleOvertime: true,
              hasNightSurcharge: true,
            },
          },
        },
      }),

      prisma.payroll.findMany({
        where: {
          ...whereTenant,
          status: { in: ['PAID', 'APPROVED', 'PROCESSED', 'DRAFT'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          details: {
            select: {
              id: true,
              employeeId: true,
              baseSalary: true,
              workedDays: true,
              overtimeHours: true,
              overtimeAmount: true,
              bonuses: true,
              deductions: true,
              netSalary: true,
              signatureStatus: true,
              signatureType: true,
            },
          },
        },
      }),

      prisma.attendance.findMany({
        where: {
          ...whereEmployeeTenant,
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          employeeId: true,
          workedHours: true,
          overtimeHours: true,
          isLate: true,
          isEarlyDeparture: true,
          status: true,
        },
      }),

      prisma.offboardingProcess.findMany({
        where: whereEmployeeTenant,
        select: {
          id: true,
          employeeId: true,
          exitDate: true,
          causal: true,
          status: true,
          baseSalary: true,
          monthsWorked: true,
          thirteenthProportional: true,
          fourteenthProportional: true,
          vacationDaysOwed: true,
          vacationAmount: true,
          desahucioAmount: true,
          severanceAmount: true,
          totalSettlement: true,
          createdAt: true,
        },
      }),

      prisma.accountingPeriod.count({ where: { ...whereTenant, status: 'OPEN' } }),
      prisma.journalEntry.count({ where: whereTenant }),
      prisma.jobVacancy.count({ where: { ...whereTenant, status: 'OPEN' } }),
      prisma.employeeEvaluation.count({ where: whereEmployeeTenant }),
      prisma.entrepreneurship.count({
        where: tenantId ? { owner: { tenantId } } : {},
      }),
    ]);

    return {
      totalEmployees,
      employeesWithActiveContract,
      allActiveEmployees,
      recentPayrolls,
      recentAttendances,
      recentOffboardings,
      erpSummary: {
        openAccountingPeriods: accountingPeriodsCount,
        totalJournalEntries: journalEntriesCount,
        openJobVacancies: activeVacanciesCount,
        totalPerformanceEvaluations: evaluationsCount,
        activeEntrepreneurships: entrepreneurshipsCount,
      },
    };
  }

  /**
   * Modelo Buscador Híbrido (BM25 Pre-Indexado + Lookup Exacto de Artículo + Expansión Semántica)
   * Busca sobre los 1,910+ fragmentos de los 4 PDFs oficiales y los reglamentos privados del tenant.
   * @param {Object} params
   */
  async searchKnowledgeChunks({ query, odsTarget, category, tenantId, limit = 12 }) {
    const index = this.ensureMemoryIndexLoaded();

    // Si hay un tenantId específico, consultar también si ese tenant subió políticas internas privadas en BD
    let tenantPrivateDocs = [];
    if (tenantId) {
      try {
        const dbPrivate = await prisma.knowledgeChunk.findMany({
          where: {
            document: { tenantId },
            ...(odsTarget ? { odsTarget } : {}),
          },
          include: {
            document: { select: { title: true, category: true, version: true } },
          },
          take: 20,
        });
        tenantPrivateDocs = dbPrivate.map((chunk) => {
          const tokens = this.normalizeText(`${chunk.articleCode || ''} ${chunk.content}`).split(
            /\s+/
          );
          const termFreq = {};
          for (const t of tokens) termFreq[t] = (termFreq[t] || 0) + 1;
          return {
            chunk,
            termFreq,
            docLen: tokens.length,
            normArticleCode: this.normalizeText(chunk.articleCode || ''),
          };
        });
      } catch {
        tenantPrivateDocs = [];
      }
    }

    const candidates = [...index.indexedDocs, ...tenantPrivateDocs].filter(({ chunk }) => {
      if (odsTarget && chunk.odsTarget !== odsTarget) return false;
      if (category && chunk.document?.category !== category) return false;
      return true;
    });

    if (!query || !query.trim()) {
      return candidates.slice(0, limit).map((c) => ({ ...c.chunk, relevanceScore: 1.0 }));
    }

    const normalizedQuery = this.normalizeText(query);
    const rawTokens = normalizedQuery.split(/\s+/).filter((t) => t.length >= 2);

    // Expandir tokens con sinónimos jurídicos y contables del Ecuador
    const expandedTokens = new Set(rawTokens);
    for (const token of rawTokens) {
      for (const [key, synonyms] of Object.entries(ECUADOR_LEGAL_SYNONYMS)) {
        if (token === key || (token.length >= 4 && (token.includes(key) || key.includes(token)))) {
          for (const syn of synonyms) {
            this.normalizeText(syn)
              .split(/\s+/)
              .filter((s) => s.length >= 2)
              .forEach((s) => expandedTokens.add(s));
          }
        }
      }
    }

    // Detectar cuerpos normativos explícitamente solicitados en la consulta
    const requestedCategories = detectRequestedNormativeCategories(normalizedQuery);
    const requestedCategorySet = new Set(requestedCategories);

    // Detectar mención explícita de número de artículo (ej. "Art. 188", "artículo 216", "Art 55")
    const articleMatches = [...query.matchAll(/art(?:[ií]culo|\.)?\s*(\d+(?:\.\d+)?)/gi)].map(
      (m) => m[1]
    );

    const k1 = 1.5;
    const b = 0.75;
    const avgDocLength = index.avgDocLength;
    const idfMap = index.idfMap;

    // Si existen embeddings entrenados en Colab, proyectar la consulta al espacio vectorial denso (128-dim)
    const queryDenseVector = this.computeQueryDenseEmbedding(rawTokens, expandedTokens, idfMap);

    const scored = [];

    for (const entry of candidates) {
      const { chunk, termFreq, docLen, normArticleCode } = entry;
      let score = 0;

      for (const qToken of expandedTokens) {
        const isPrimary = rawTokens.includes(qToken);
        const weight = isPrimary ? 2.2 : 0.85;

        let tf = termFreq[qToken] || 0;
        if (tf === 0 && qToken.length >= 5) {
          // Coincidencia de raíz léxica (stemming ligero en español)
          const stem = qToken.substring(0, qToken.length - 2);
          for (const [docTerm, count] of Object.entries(termFreq)) {
            if (docTerm.startsWith(stem)) {
              tf += count * 0.65;
            }
          }
        }

        if (tf > 0) {
          const idf = idfMap[qToken] ?? 2.5;
          const bm25 = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgDocLength))));
          score += bm25 * weight;
        }
      }

      // Fusión Híbrida Densa + Cross-Encoder cuando trained_retriever_index.json está cargado
      let denseSimilarity = 0;
      let trainedCrossEncoderPrior = 0;
      if (this._trainedEmbeddingsMap && chunk.articleCode) {
        const docVector = this._trainedEmbeddingsMap[chunk.articleCode];
        if (queryDenseVector && Array.isArray(docVector)) {
          denseSimilarity = Math.max(0, this.cosineSimilarity(queryDenseVector, docVector));
          if (denseSimilarity > 0.15) {
            score += denseSimilarity * 18.0;
          }
        }
      }
      if (this._trainedCrossEncoderMap && chunk.articleCode) {
        trainedCrossEncoderPrior = this._trainedCrossEncoderMap[chunk.articleCode] || 0;
        if (score > 0 && trainedCrossEncoderPrior > 0) {
          score += trainedCrossEncoderPrior * 3.0;
        }
      }

      // Boost de exactitud si el usuario pidió un número de artículo específico (ej. Art. 216 de los PDFs)
      if (articleMatches.length > 0 && normArticleCode) {
        for (const artNum of articleMatches) {
          const exactRegex = new RegExp(`\\bart(?:iculo)?\\s*${artNum.replace('.', '\\.')}\\b`);
          if (
            exactRegex.test(normArticleCode) ||
            new RegExp(`\\b${artNum.replace('.', '\\.')}\\b`).test(normArticleCode)
          ) {
            score += 40.0;
          }
        }
      }

      // Boost si el usuario mencionó explícitamente este cuerpo normativo (ej. Constitución, IESS, OIT)
      const chunkCategory = chunk.document?.category;
      if (score > 0 && chunkCategory && requestedCategorySet.has(chunkCategory)) {
        score += 18.0;
      }

      // Boost si es parte del catálogo curado con fórmulas verificadas del ERP
      if (chunk.metadata?.isCurated && score > 3.0) {
        score *= 1.25;
      }

      if (score > 0) {
        scored.push({
          ...chunk,
          relevanceScore: Number(score.toFixed(4)),
          denseSimilarity: Number(denseSimilarity.toFixed(4)),
          trainedCrossEncoderPrior: Number(trainedCrossEncoderPrior.toFixed(4)),
        });
      }
    }

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    if (scored.length > 0) {
      return selectBalancedByCategory(scored, limit, requestedCategories, 'relevanceScore');
    }

    return candidates.slice(0, limit).map((c) => ({ ...c.chunk, relevanceScore: 0.5 }));
  }

  /**
   * Normaliza texto en español removiendo tildes y puntuación para indexación léxico-semántica
   * @private
   */
  normalizeText(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.%]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Ingesta un documento con sus fragmentos en una transacción ACID
   * @param {Object} docData
   */
  async ingestDocument(docData, tenantId = null) {
    return prisma.$transaction(async (tx) => {
      const document = await tx.knowledgeDocument.create({
        data: {
          tenantId,
          title: docData.title,
          category: docData.category,
          sourceUrl: docData.sourceUrl || null,
          version: docData.version || '2026',
        },
      });

      if (docData.chunks && docData.chunks.length > 0) {
        await tx.knowledgeChunk.createMany({
          data: docData.chunks.map((chunk) => ({
            documentId: document.id,
            content: chunk.content,
            articleCode: chunk.articleCode || null,
            odsTarget: chunk.odsTarget || null,
            metadata: chunk.metadata || {},
          })),
        });
      }

      return document;
    });
  }

  /**
   * Obtiene fragmentos de los 4 PDFs oficiales para construcción de datasets.
   * Si includeFullPdfCorpus es true, devuelve los 1,880 artículos íntegros;
   * por defecto selecciona una muestra estratificada de los 4 documentos oficiales para SFT.
   */
  async getAllChunksForDataset({ categories, includeFullPdfCorpus = false } = {}) {
    const index = this.ensureMemoryIndexLoaded();
    let docs = index.indexedDocs.map((d) => d.chunk);

    if (categories && categories.length > 0) {
      docs = docs.filter((chunk) => categories.includes(chunk.document?.category));
    }

    if (!includeFullPdfCorpus) {
      // 1. Conservar siempre el 100% de las síntesis doctrinales curadas
      const curated = docs.filter((c) => c.metadata?.isCurated);
      const pdfDocs = docs.filter((c) => !c.metadata?.isCurated);

      // 2. Muestreo estratificado uniforme a lo largo de todo el documento (inicio, medio y fin)
      // para cubrir los 4 PDFs completos (ej. Art. 325-333 de la Constitución, todo el Código del Trabajo, IESS y OIT)
      const byDoc = {};
      for (const chunk of pdfDocs) {
        const title = chunk.document?.title || 'default';
        if (!byDoc[title]) byDoc[title] = [];
        byDoc[title].push(chunk);
      }

      const sampledPdfChunks = [];
      const targetPerDoc = 25;
      for (const docChunks of Object.values(byDoc)) {
        if (docChunks.length <= targetPerDoc) {
          sampledPdfChunks.push(...docChunks);
        } else {
          const step = docChunks.length / targetPerDoc;
          for (let i = 0; i < targetPerDoc; i++) {
            sampledPdfChunks.push(docChunks[Math.floor(i * step)]);
          }
        }
      }

      docs = [...curated, ...sampledPdfChunks];
    }

    return docs;
  }

  /**
   * Proyecta los tokens de la consulta al espacio vectorial denso (128-dim) del Bi-Encoder entrenado en Colab
   * @private
   */
  computeQueryDenseEmbedding(rawTokens, expandedTokens, idfMap) {
    if (!this._trainedQueryVocabMap) return null;

    let pooled = null;
    let totalWeight = 0;

    for (const token of expandedTokens) {
      const vec = this._trainedQueryVocabMap[token];
      if (!Array.isArray(vec) || vec.length === 0) continue;

      if (!pooled) pooled = new Array(vec.length).fill(0);
      const isPrimary = rawTokens.includes(token);
      const idf = idfMap[token] ?? 2.0;
      const weight = (isPrimary ? 2.0 : 0.75) * idf;

      for (let i = 0; i < vec.length; i++) {
        pooled[i] += vec[i] * weight;
      }
      totalWeight += weight;
    }

    if (!pooled || totalWeight === 0) return null;

    let normSq = 0;
    for (let i = 0; i < pooled.length; i++) {
      normSq += pooled[i] * pooled[i];
    }
    const norm = Math.sqrt(normSq) || 1;
    return pooled.map((v) => v / norm);
  }

  /**
   * Calcula similitud coseno entre dos vectores normalizados
   * @private
   */
  cosineSimilarity(vecA, vecB) {
    const len = Math.min(vecA.length, vecB.length);
    if (len === 0) return 0;
    let dot = 0;
    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }

  /**
   * Devuelve estadísticas del corpus indexado de los 4 PDFs oficiales
   */
  getCorpusStatistics() {
    const index = this.ensureMemoryIndexLoaded();
    return {
      totalIndexedChunks: index.totalDocs,
      totalKnownArticles: this._knownArticleNumbers.size,
      hasTrainedEmbeddings: Boolean(this._trainedEmbeddingsMap),
      trainedArticlesCount: this._trainedEmbeddingsMap
        ? Object.keys(this._trainedEmbeddingsMap).length
        : 0,
      trainedQueryVocabSize: this._trainedQueryVocabMap
        ? Object.keys(this._trainedQueryVocabMap).length
        : 0,
    };
  }
}

export default new SustainabilityRepository();
