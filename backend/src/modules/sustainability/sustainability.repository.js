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
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import prisma from '../../database/db.js';
import { ECUADOR_LABOR_CORPUS } from './data/ecuadorLaborKnowledge.js';
import {
  detectRequestedNormativeCategories,
  selectBalancedByCategory,
} from './legalEvaluator.service.js';
import neuralRetrieverService from './neuralRetriever.service.js';

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

const SPANISH_STOPWORDS = new Set([
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'unos',
  'unas',
  'de',
  'del',
  'al',
  'a',
  'en',
  'para',
  'por',
  'con',
  'sin',
  'sobre',
  'que',
  'me',
  'mi',
  'mis',
  'te',
  'ti',
  'tu',
  'tus',
  'se',
  'su',
  'sus',
  'le',
  'les',
  'nos',
  'como',
  'cual',
  'cuales',
  'cuando',
  'donde',
  'quien',
  'quienes',
  'si',
  'y',
  'o',
  'pero',
  'mas',
  'muy',
  'es',
  'son',
  'fue',
  'era',
  'ser',
  'estar',
  'ha',
  'han',
  'hay',
  'lo',
  'toca',
  'debo',
  'deben',
  'puedo',
  'pueden',
  'dice',
  'dicen',
  'este',
  'esta',
]);

function resolveLegalRoot(token) {
  if (!token || typeof token !== 'string') return null;
  const t = token.toLowerCase();
  if (t.startsWith('despid') || t.startsWith('desped')) return 'despido';
  if (t.startsWith('renunc')) return 'renuncia';
  if (t.startsWith('liquid')) return 'finiquito';
  if (t.startsWith('desahu')) return 'desahucio';
  if (t.startsWith('jubil')) return 'jubilacion';
  if (t.startsWith('vacaci')) return 'vacaciones';
  if (t.startsWith('embaraz') || t.startsWith('matern')) return 'maternidad';
  if (t.startsWith('patern')) return 'paternidad';
  if (t.startsWith('lactan')) return 'lactancia';
  if (t.startsWith('utilida')) return 'utilidades';
  if (t.startsWith('decim')) return 'decimo';
  if (t.startsWith('hor')) return 'horas';
  if (t.startsWith('sobretiemp')) return 'horas';
  if (t.startsWith('suplementar')) return 'horas';
  if (t.startsWith('extraordinar')) return 'extra';
  if (t.startsWith('afili') || t.startsWith('aport') || t.startsWith('cesant')) return 'iess';
  if (t.startsWith('finiquit')) return 'finiquito';
  return null;
}

export class SustainabilityRepository {
  constructor() {
    this._memoryIndex = null;
    this._knownArticleNumbers = new Set();
    this._trainedEmbeddingsMap = null;
    this._trainedEmbeddingsByKey = null;
    this._trainedEmbeddingsByComposite = null;
    this._trainedCrossEncoderMap = null;
    this._trainedQueryVocabMap = null;
    this._trainedEmbeddingDim = 0;
    this._pgVectorSeeded = false;
    this._pgVectorAvailable = null;
    this._pgSeedPromise = null;
  }

  computeContentHash(content) {
    return crypto
      .createHash('sha256')
      .update(String(content || '').trim())
      .digest('hex')
      .slice(0, 16);
  }

  buildChunkKey(category, articleCode, contentHash) {
    return `${category || 'LABOR_CODE'}::${articleCode || ''}::${contentHash || ''}`;
  }

  formatVectorLiteral(vec) {
    return `[${vec.map((v) => Number(v).toFixed(6)).join(',')}]`;
  }

  /**
   * Construye y cachea en memoria el índice invertido BM25 exclusivamente con los 1,880+
   * artículos y secciones extraídos al 100% de los 4 PDFs oficiales.
   */
  ensureMemoryIndexLoaded() {
    if (this._memoryIndex) return this._memoryIndex;

    const allChunks = [];

    // 1. Cargar exclusivamente los 1,880+ artículos y secciones íntegras de los 4 PDFs oficiales
    for (const doc of ECUADOR_LABOR_CORPUS) {
      const normalizedCategory = doc.docId === 'constitucion_2008' ? 'CONSTITUTION' : doc.category;
      for (const chunk of doc.chunks || []) {
        this.registerArticleNumbers(chunk.articleCode);
        const contentHash = this.computeContentHash(chunk.content);
        allChunks.push({
          id: `pdf_${doc.docId || normalizedCategory}_${allChunks.length}`,
          content: chunk.content,
          contentHash,
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

    // 2. Cargar vectores densos y priors del Evaluador pre-entrenados desde Colab en trained_retriever_index.json
    this._trainedEmbeddingsMap = null;
    this._trainedEmbeddingsByKey = null;
    this._trainedEmbeddingsByComposite = null;
    this._trainedCrossEncoderMap = null;
    this._trainedQueryVocabMap = null;
    this._trainedEmbeddingDim = 0;

    if (fs.existsSync(TRAINED_EMBEDDINGS_INDEX_PATH)) {
      try {
        const rawVectors = JSON.parse(fs.readFileSync(TRAINED_EMBEDDINGS_INDEX_PATH, 'utf-8'));
        this._trainedEmbeddingDim = Number(rawVectors.embeddingDim) || 0;

        if (rawVectors.embeddingsByArticle) {
          this._trainedEmbeddingsMap = rawVectors.embeddingsByArticle;
        } else if (Array.isArray(rawVectors.articles)) {
          this._trainedEmbeddingsMap = {};
          this._trainedEmbeddingsByKey = {};
          this._trainedEmbeddingsByComposite = {};
          this._trainedCrossEncoderMap = {};

          for (const item of rawVectors.articles) {
            if (!Array.isArray(item.embedding)) continue;
            if (!this._trainedEmbeddingDim) {
              this._trainedEmbeddingDim = item.embedding.length;
            }
            if (item.chunkKey) {
              this._trainedEmbeddingsByKey[item.chunkKey] = item.embedding;
            }
            if (item.category && item.articleCode) {
              this._trainedEmbeddingsByComposite[`${item.category}::${item.articleCode}`] =
                item.embedding;
            }
            if (item.articleCode) {
              this._trainedEmbeddingsMap[item.articleCode] = item.embedding;
              if (typeof item.crossEncoderScore === 'number') {
                this._trainedCrossEncoderMap[item.articleCode] = item.crossEncoderScore;
              }
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
        this._trainedEmbeddingsByKey = null;
        this._trainedEmbeddingsByComposite = null;
        this._trainedCrossEncoderMap = null;
        this._trainedQueryVocabMap = null;
        this._trainedEmbeddingDim = 0;
      }
    }

    // 3. Pre-tokenizar todos los fragmentos y asociar cada chunk con su vector exacto sin colisiones
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

      const chunkKey = this.buildChunkKey(
        chunk.document?.category,
        chunk.articleCode,
        chunk.contentHash
      );
      const compositeKey = `${chunk.document?.category || ''}::${chunk.articleCode || ''}`;
      const denseVector =
        this._trainedEmbeddingsByKey?.[chunkKey] ||
        this._trainedEmbeddingsByComposite?.[compositeKey] ||
        this._trainedEmbeddingsMap?.[chunk.articleCode] ||
        null;

      return {
        chunk,
        chunkKey,
        denseVector,
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
   * Sincroniza de forma idempotente los 1,880+ fragmentos legales y sus vectores 768-dim
   * hacia PostgreSQL + pgvector (HNSW). Falla de forma segura si BD no está disponible (ej. tests CI).
   */
  async ensurePgVectorCorpusSeeded() {
    if (process.env.NODE_ENV === 'test' && process.env.ENABLE_PGVECTOR_TEST !== 'true') {
      return false;
    }
    if (this._pgVectorSeeded) return this._pgVectorAvailable === true;
    if (this._pgSeedPromise) return this._pgSeedPromise;

    this._pgSeedPromise = (async () => {
      try {
        const index = this.ensureMemoryIndexLoaded();
        const availExt = await prisma.$queryRawUnsafe(
          `SELECT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') AS avail`
        );
        if (!availExt?.[0]?.avail) {
          this._pgVectorAvailable = false;
          return false;
        }

        // Auto-sanación idempotente de extensión pgvector, columnas e índices en entornos existentes
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "contentHash" TEXT, ADD COLUMN IF NOT EXISTS "embedding" vector(768)`
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "knowledge_chunks_contentHash_idx" ON "knowledge_chunks"("contentHash")`
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "knowledge_chunks_embedding_hnsw_idx" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64)`
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "knowledge_chunks_fts_es_gin_idx" ON "knowledge_chunks" USING gin (to_tsvector('spanish', coalesce("articleCode", '') || ' ' || "content"))`
        );

        const expectedVectorDim = this._trainedEmbeddingDim || 768;
        this._pgVectorAvailable = true;

        // Corregir categoría heredada de Constitución si ya existía en BD
        await prisma.$executeRawUnsafe(
          `UPDATE "knowledge_documents" SET category = 'CONSTITUTION' WHERE "tenantId" IS NULL AND title LIKE '%Constituci%' AND category = 'LABOR_CODE'`
        );

        const statsRows = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int AS total, COUNT(kc."embedding")::int AS embedded
           FROM "knowledge_chunks" kc
           INNER JOIN "knowledge_documents" kd ON kd.id = kc."documentId"
           WHERE kd."tenantId" IS NULL`
        );
        const totalInDb = statsRows?.[0]?.total || 0;
        const embeddedInDb = statsRows?.[0]?.embedded || 0;

        if (
          totalInDb >= index.totalDocs &&
          (expectedVectorDim !== 768 || embeddedInDb >= Math.floor(index.totalDocs * 0.95))
        ) {
          this._pgVectorSeeded = true;
          return true;
        }

        // Agrupar fragmentos por documento oficial
        const byDoc = new Map();
        for (const entry of index.indexedDocs) {
          const { chunk, denseVector } = entry;
          const key = `${chunk.document.category}::${chunk.document.title}`;
          if (!byDoc.has(key)) {
            byDoc.set(key, {
              meta: chunk.document,
              items: [],
            });
          }
          byDoc.get(key).items.push({ chunk, denseVector });
        }

        const canLiveEncode = neuralRetrieverService.hasBiEncoderFiles();

        for (const { meta, items } of byDoc.values()) {
          let doc = await prisma.knowledgeDocument.findFirst({
            where: { title: meta.title, tenantId: null },
          });
          if (!doc) {
            doc = await prisma.knowledgeDocument.create({
              data: {
                tenantId: null,
                title: meta.title,
                category: meta.category,
                sourceUrl: meta.sourceUrl || null,
                version: meta.version || '2026',
              },
            });
          } else if (doc.category !== meta.category) {
            doc = await prisma.knowledgeDocument.update({
              where: { id: doc.id },
              data: { category: meta.category },
            });
          }

          const existingRows = await prisma.$queryRawUnsafe(
            `SELECT id, "articleCode", content, "contentHash", ("embedding" IS NOT NULL) AS has_vec FROM "knowledge_chunks" WHERE "documentId" = $1`,
            doc.id
          );
          const existingByHash = new Map();
          const legacyByArticleQueue = new Map();
          const consumedRowIds = new Set();

          for (const row of existingRows) {
            const rowHash = row.contentHash || this.computeContentHash(row.content);
            if (!existingByHash.has(rowHash)) {
              existingByHash.set(rowHash, row);
            }
            if (!row.contentHash && row.articleCode) {
              if (!legacyByArticleQueue.has(row.articleCode)) {
                legacyByArticleQueue.set(row.articleCode, []);
              }
              legacyByArticleQueue.get(row.articleCode).push(row);
            }
          }

          for (const { chunk, denseVector } of items) {
            let vec768 =
              Array.isArray(denseVector) && denseVector.length === 768 ? denseVector : null;
            if (!vec768 && canLiveEncode) {
              vec768 = await neuralRetrieverService.embedPassage(
                `${chunk.articleCode || ''} - ${chunk.content}`
              );
            }

            let existing = existingByHash.get(chunk.contentHash) || null;
            if (!existing && chunk.articleCode) {
              const queue = legacyByArticleQueue.get(chunk.articleCode) || [];
              existing = queue.find((r) => !consumedRowIds.has(r.id)) || null;
            }
            if (existing) {
              consumedRowIds.add(existing.id);
            }

            if (!existing) {
              const created = await prisma.knowledgeChunk.create({
                data: {
                  documentId: doc.id,
                  content: chunk.content,
                  contentHash: chunk.contentHash,
                  articleCode: chunk.articleCode || null,
                  odsTarget: chunk.odsTarget || null,
                  metadata: chunk.metadata || {},
                },
              });
              existingByHash.set(chunk.contentHash, {
                id: created.id,
                contentHash: chunk.contentHash,
                has_vec: Boolean(vec768),
              });
              if (vec768) {
                await prisma.$executeRawUnsafe(
                  `UPDATE "knowledge_chunks" SET "embedding" = $1::vector WHERE id = $2`,
                  this.formatVectorLiteral(vec768),
                  created.id
                );
              }
            } else {
              if (!existing.contentHash) {
                await prisma.$executeRawUnsafe(
                  `UPDATE "knowledge_chunks" SET "contentHash" = $1 WHERE id = $2`,
                  chunk.contentHash,
                  existing.id
                );
                existing.contentHash = chunk.contentHash;
              }
              if (!existing.has_vec && vec768) {
                await prisma.$executeRawUnsafe(
                  `UPDATE "knowledge_chunks" SET "embedding" = $1::vector WHERE id = $2`,
                  this.formatVectorLiteral(vec768),
                  existing.id
                );
                existing.has_vec = true;
              }
            }
          }
        }

        this._pgVectorSeeded = true;
        return true;
      } catch {
        this._pgVectorAvailable = false;
        return false;
      } finally {
        this._pgSeedPromise = null;
      }
    })();

    return this._pgSeedPromise;
  }

  /**
   * Búsqueda vectorial HNSW + Full-Text Search en PostgreSQL (`pgvector`).
   * Cubre tanto el corpus público oficial como las políticas privadas del tenant con embeddings reales.
   * @private
   */
  async searchPgVectorHybrid({
    query,
    queryDenseVector,
    odsTarget,
    category,
    tenantId,
    limit = 24,
  }) {
    if (!this._pgVectorAvailable) return [];

    const vectorRows = [];
    const ftsRows = [];

    try {
      if (Array.isArray(queryDenseVector) && queryDenseVector.length === 768) {
        const vecLiteral = this.formatVectorLiteral(queryDenseVector);
        const rawVec = await prisma.$queryRawUnsafe(
          `SELECT kc.id, kc.content, kc."contentHash", kc."articleCode", kc."odsTarget", kc.metadata,
                  kd.title AS "docTitle", kd.category AS "docCategory", kd.version AS "docVersion", kd."sourceUrl" AS "docSourceUrl",
                  (1 - (kc."embedding" <=> $1::vector))::float AS cosine_sim
           FROM "knowledge_chunks" kc
           INNER JOIN "knowledge_documents" kd ON kd.id = kc."documentId"
           WHERE kc."embedding" IS NOT NULL
             AND (kd."tenantId" IS NULL OR kd."tenantId" = $2)
             AND ($3::text IS NULL OR kc."odsTarget" = $3)
             AND ($4::text IS NULL OR kd.category = $4)
           ORDER BY kc."embedding" <=> $1::vector
           LIMIT $5`,
          vecLiteral,
          tenantId || '__NO_TENANT__',
          odsTarget || null,
          category || null,
          Math.max(limit * 2, 24)
        );
        vectorRows.push(...rawVec);
      }

      if (query && query.trim()) {
        const rawFts = await prisma.$queryRawUnsafe(
          `SELECT kc.id, kc.content, kc."contentHash", kc."articleCode", kc."odsTarget", kc.metadata,
                  kd.title AS "docTitle", kd.category AS "docCategory", kd.version AS "docVersion", kd."sourceUrl" AS "docSourceUrl",
                  ts_rank_cd(to_tsvector('spanish', coalesce(kc."articleCode", '') || ' ' || kc."content"), plainto_tsquery('spanish', $1))::float AS fts_rank
           FROM "knowledge_chunks" kc
           INNER JOIN "knowledge_documents" kd ON kd.id = kc."documentId"
           WHERE to_tsvector('spanish', coalesce(kc."articleCode", '') || ' ' || kc."content") @@ plainto_tsquery('spanish', $1)
             AND (kd."tenantId" IS NULL OR kd."tenantId" = $2)
             AND ($3::text IS NULL OR kc."odsTarget" = $3)
             AND ($4::text IS NULL OR kd.category = $4)
           ORDER BY fts_rank DESC
           LIMIT $5`,
          query.trim(),
          tenantId || '__NO_TENANT__',
          odsTarget || null,
          category || null,
          Math.max(limit, 16)
        );
        ftsRows.push(...rawFts);
      }
    } catch {
      return [];
    }

    const byKey = new Map();
    const mapRow = (row) => ({
      id: row.id,
      content: row.content,
      contentHash: row.contentHash || this.computeContentHash(row.content),
      articleCode: row.articleCode,
      odsTarget: row.odsTarget || '8.8',
      metadata: row.metadata || {},
      document: {
        title: row.docTitle,
        category: row.docCategory,
        version: row.docVersion || '2026',
        sourceUrl: row.docSourceUrl || null,
      },
    });

    vectorRows.forEach((row, rankIdx) => {
      const chunk = mapRow(row);
      const key = this.buildChunkKey(chunk.document.category, chunk.articleCode, chunk.contentHash);
      const rrf = 1 / (60 + rankIdx + 1);
      byKey.set(key, {
        chunk,
        chunkKey: key,
        pgVectorScore: Math.max(0, Number(row.cosine_sim) || 0),
        pgFtsScore: 0,
        pgRrfScore: rrf * 100,
      });
    });

    ftsRows.forEach((row, rankIdx) => {
      const chunk = mapRow(row);
      const key = this.buildChunkKey(chunk.document.category, chunk.articleCode, chunk.contentHash);
      const rrf = 1 / (60 + rankIdx + 1);
      const existing = byKey.get(key);
      if (existing) {
        existing.pgFtsScore = Number(row.fts_rank) || 0;
        existing.pgRrfScore += rrf * 100;
      } else {
        byKey.set(key, {
          chunk,
          chunkKey: key,
          pgVectorScore: 0,
          pgFtsScore: Number(row.fts_rank) || 0,
          pgRrfScore: rrf * 100,
        });
      }
    });

    return [...byKey.values()];
  }

  /**
   * Modelo Buscador Híbrido (PostgreSQL pgvector HNSW + FTS Español + Bi-Encoder ONNX en vivo + BM25).
   * Busca sobre los 1,880+ fragmentos de los 4 PDFs oficiales y los reglamentos privados del tenant.
   * @param {Object} params
   */
  async searchKnowledgeChunks({ query, odsTarget, category, tenantId, limit = 12 }) {
    const index = this.ensureMemoryIndexLoaded();
    await this.ensurePgVectorCorpusSeeded();

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
          const contentHash = chunk.contentHash || this.computeContentHash(chunk.content);
          return {
            chunk: { ...chunk, contentHash },
            chunkKey: this.buildChunkKey(chunk.document?.category, chunk.articleCode, contentHash),
            denseVector: null,
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
    const allTokens = normalizedQuery.split(/\s+/).filter((t) => t.length >= 2);
    const rawTokens = allTokens.filter((t) => !SPANISH_STOPWORDS.has(t));
    const queryTokensToUse = rawTokens.length > 0 ? rawTokens : allTokens;

    // Expandir tokens con sinónimos jurídicos y contables del Ecuador y raíces lematizadas
    const expandedTokens = new Set(queryTokensToUse);
    for (const token of queryTokensToUse) {
      const rootKey = resolveLegalRoot(token);
      if (rootKey && ECUADOR_LEGAL_SYNONYMS[rootKey]) {
        expandedTokens.add(rootKey);
        for (const syn of ECUADOR_LEGAL_SYNONYMS[rootKey]) {
          this.normalizeText(syn)
            .split(/\s+/)
            .filter((s) => s.length >= 2 && !SPANISH_STOPWORDS.has(s))
            .forEach((s) => expandedTokens.add(s));
        }
      }

      for (const [key, synonyms] of Object.entries(ECUADOR_LEGAL_SYNONYMS)) {
        if (token === key || (token.length >= 4 && (token.includes(key) || key.includes(token)))) {
          for (const syn of synonyms) {
            this.normalizeText(syn)
              .split(/\s+/)
              .filter((s) => s.length >= 2 && !SPANISH_STOPWORDS.has(s))
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

    // 1. Vectorizar consulta completa en tiempo real con Bi-Encoder ONNX (o vocabulario legado si no existe ONNX)
    let queryDenseVector = null;
    if (neuralRetrieverService.hasBiEncoderFiles()) {
      try {
        queryDenseVector = await neuralRetrieverService.embedQuery(query);
      } catch {
        queryDenseVector = null;
      }
    }
    if (!queryDenseVector) {
      queryDenseVector = this.computeQueryDenseEmbedding(rawTokens, expandedTokens, idfMap);
    }

    // 2. Consultar en paralelo PostgreSQL pgvector HNSW + FTS español (si PostgreSQL pgvector está activo)
    const pgHits = await this.searchPgVectorHybrid({
      query,
      queryDenseVector,
      odsTarget,
      category,
      tenantId,
      limit: Math.max(limit * 2, 24),
    });
    const pgHitByKey = new Map(pgHits.map((hit) => [hit.chunkKey, hit]));

    const scoredByKey = new Map();

    for (const entry of candidates) {
      const { chunk, chunkKey, denseVector, termFreq, docLen, normArticleCode } = entry;
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

      // Fusión Híbrida Vectorial: preferir similitud exacta pgvector HNSW y luego coseno en memoria
      const pgHit = pgHitByKey.get(chunkKey);
      let denseSimilarity = pgHit?.pgVectorScore || 0;
      if (denseSimilarity === 0 && queryDenseVector && Array.isArray(denseVector)) {
        denseSimilarity = Math.max(0, this.cosineSimilarity(queryDenseVector, denseVector));
      }
      if (denseSimilarity > 0.25) {
        score += denseSimilarity * 24.0;
      }
      if (pgHit) {
        score += pgHit.pgRrfScore * 1.5 + Math.min(8.0, (pgHit.pgFtsScore || 0) * 6.0);
      }

      let trainedCrossEncoderPrior = 0;
      if (this._trainedCrossEncoderMap && chunk.articleCode) {
        trainedCrossEncoderPrior = this._trainedCrossEncoderMap[chunk.articleCode] || 0;
        if (score > 0 && trainedCrossEncoderPrior > 0) {
          score += trainedCrossEncoderPrior * 3.0;
        }
      }

      const chunkCategory = chunk.document?.category;

      // Boost de exactitud si el usuario pidió un número de artículo específico (ej. Art. 216 de los PDFs)
      if (articleMatches.length > 0 && normArticleCode) {
        for (const artNum of articleMatches) {
          const exactRegex = new RegExp(`\\bart(?:iculo)?\\s*${artNum.replace('.', '\\.')}\\b`);
          if (
            exactRegex.test(normArticleCode) ||
            new RegExp(`\\b${artNum.replace('.', '\\.')}\\b`).test(normArticleCode)
          ) {
            score += 40.0;
            // Preferencia por el Código del Trabajo cuando hay colisión con Constitución y no se pidió Constitución
            if (chunkCategory === 'LABOR_CODE' && !requestedCategorySet.has('CONSTITUTION')) {
              score += 25.0;
            }
          }
        }
      }

      // Boost si el usuario mencionó explícitamente este cuerpo normativo (ej. Constitución, IESS, OIT)
      if (score > 0 && chunkCategory && requestedCategorySet.has(chunkCategory)) {
        score += 18.0;
      }

      // Si es consulta laboral y el documento es Código del Trabajo sin petición explícita de Constitución
      if (
        score > 0 &&
        chunkCategory === 'LABOR_CODE' &&
        !requestedCategorySet.has('CONSTITUTION')
      ) {
        score += 8.0;
      }

      // Boost si es parte del catálogo curado con fórmulas verificadas del ERP
      if (chunk.metadata?.isCurated && score > 3.0) {
        score *= 1.25;
      }

      if (score > 0) {
        scoredByKey.set(chunkKey, {
          ...chunk,
          relevanceScore: Number(score.toFixed(4)),
          denseSimilarity: Number(denseSimilarity.toFixed(4)),
          trainedCrossEncoderPrior: Number(trainedCrossEncoderPrior.toFixed(4)),
        });
      }
    }

    // Incorporar hits puros de pgvector que hayan venido de políticas privadas del tenant
    for (const pgHit of pgHits) {
      if (scoredByKey.has(pgHit.chunkKey)) continue;
      let extraScore = pgHit.pgVectorScore * 24.0 + pgHit.pgRrfScore * 1.5;
      if (requestedCategorySet.has(pgHit.chunk.document?.category)) {
        extraScore += 18.0;
      }
      scoredByKey.set(pgHit.chunkKey, {
        ...pgHit.chunk,
        relevanceScore: Number(extraScore.toFixed(4)),
        denseSimilarity: Number(pgHit.pgVectorScore.toFixed(4)),
        trainedCrossEncoderPrior: 0,
      });
    }

    const scored = [...scoredByKey.values()];
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
   * Ingesta un documento con sus fragmentos en una transacción ACID y genera sus vectores pgvector
   * @param {Object} docData
   */
  async ingestDocument(docData, tenantId = null) {
    const createdDoc = await prisma.$transaction(async (tx) => {
      const document = await tx.knowledgeDocument.create({
        data: {
          tenantId,
          title: docData.title,
          category: docData.category,
          sourceUrl: docData.sourceUrl || null,
          version: docData.version || '2026',
        },
      });

      const createdChunks = [];
      if (docData.chunks && docData.chunks.length > 0) {
        for (const chunk of docData.chunks) {
          const created = await tx.knowledgeChunk.create({
            data: {
              documentId: document.id,
              content: chunk.content,
              contentHash: this.computeContentHash(chunk.content),
              articleCode: chunk.articleCode || null,
              odsTarget: chunk.odsTarget || null,
              metadata: chunk.metadata || {},
            },
          });
          createdChunks.push(created);
        }
      }

      return { document, createdChunks };
    });

    if (neuralRetrieverService.hasBiEncoderFiles() && createdDoc.createdChunks.length > 0) {
      try {
        for (const chunk of createdDoc.createdChunks) {
          const vec = await neuralRetrieverService.embedPassage(
            `${chunk.articleCode || ''} - ${chunk.content}`
          );
          if (Array.isArray(vec) && vec.length === 768) {
            await prisma.$executeRawUnsafe(
              `UPDATE "knowledge_chunks" SET "embedding" = $1::vector WHERE id = $2`,
              this.formatVectorLiteral(vec),
              chunk.id
            );
          }
        }
      } catch {
        // Si pgvector aún no está habilitado en test DB, el documento ya quedó persistido
      }
    }

    return createdDoc.document;
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
   * Devuelve estadísticas del corpus indexado, vectores pgvector y estado ONNX
   */
  getCorpusStatistics() {
    const index = this.ensureMemoryIndexLoaded();
    const onnxStatus = neuralRetrieverService.getStatus();
    const embeddedChunksCount = index.indexedDocs.filter((d) =>
      Array.isArray(d.denseVector)
    ).length;
    return {
      totalIndexedChunks: index.totalDocs,
      totalKnownArticles: this._knownArticleNumbers.size,
      hasTrainedEmbeddings: Boolean(this._trainedEmbeddingsByKey || this._trainedEmbeddingsMap),
      embeddingDim: this._trainedEmbeddingDim || 0,
      trainedArticlesCount: embeddedChunksCount,
      trainedQueryVocabSize: this._trainedQueryVocabMap
        ? Object.keys(this._trainedQueryVocabMap).length
        : 0,
      pgVectorAvailable: Boolean(this._pgVectorAvailable),
      pgVectorSeeded: Boolean(this._pgVectorSeeded),
      neuralBiEncoderReady: onnxStatus.biEncoderReady,
      neuralCrossEncoderReady: onnxStatus.crossEncoderReady,
    };
  }
}

export default new SustainabilityRepository();
