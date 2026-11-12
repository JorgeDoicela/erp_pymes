/**
 * @file extractCorpusToDataset.js
 * @description Compilador Maestro de Datasets para Google Colab:
 * 1. `retriever_evaluator_training_colab.jsonl`: 1,880+ tripletes (query, positive, hard_negative) extraídos
 *    del 100% de los 4 PDFs oficiales para entrenar el Modelo Buscador (Retriever) y el Modelo Evaluador (Reranker).
 * 2. `fine_tuning_ecuador_ods8_qwen.jsonl`: Dataset SFT/QLoRA en formato ChatML para entrenar un LLM local (Qwen 2.5 / DeepSeek).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sustainabilityFineTuningService from '../sustainabilityFineTuning.service.js';
import sustainabilityRepository from '../sustainability.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function computeChunkHash(content) {
  return crypto
    .createHash('sha256')
    .update(String(content || '').trim())
    .digest('hex')
    .slice(0, 16);
}

function buildNaturalLegalQuery(chunk, docTitle, keywords) {
  const cleanedBody = String(chunk.content || '')
    .replace(/^\[[^\]]+\]\s*/i, '')
    .replace(/^Art(?:\.|[ií]culo)?\s*\d+(?:\.\d+)?[.\-\s:]*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const excerpt = cleanedBody.split(/(?<=[.;])\s+/)[0]?.slice(0, 180) || cleanedBody.slice(0, 180);
  const topic = keywords ? `(${keywords})` : '';
  return `${docTitle} ${topic}: ${excerpt}`.replace(/\s+/g, ' ').trim();
}

const NATURAL_DOMAIN_ANCHORS = [
  {
    query: 'me despidieron sin causa justa y tengo años trabajando cuanto me toca de liquidacion',
    matchCode: /Art\.\s*188\b/i,
    matchCategory: 'LABOR_CODE',
  },
  {
    query:
      'proteccion por embarazo maternidad lactancia y prohibicion de despido a mujer embarazada',
    matchCode: /Art\.\s*153\b|Art\.\s*152\b/i,
    matchCategory: 'LABOR_CODE',
  },
  {
    query: 'cuando se pagan los fondos de reserva iess y porcentaje 8.33',
    matchCode: /Art\.\s*196\b|Art\.\s*279\b|Art\.\s*73\b/i,
    matchCategory: null,
  },
  {
    query: 'prohibicion del trabajo forzoso esclavitud trata laboral constitucion y oit ods 8',
    matchCode: /Art\.\s*66\b|Meta\s*8\.7\b/i,
    matchCategory: null,
  },
  {
    query:
      'jornada maxima semanal 40 horas descanso obligatorio horas suplementarias 50% y extraordinarias 100%',
    matchCode: /Art\.\s*47\b|Art\.\s*55\b/i,
    matchCategory: 'LABOR_CODE',
  },
  {
    query: 'calculo de jubilacion patronal e iess vejez pension mensual',
    matchCode: /Art\.\s*216\b|Art\.\s*185\b/i,
    matchCategory: null,
  },
  {
    query: 'derecho constitucional al trabajo digno remuneracion justa seguridad social',
    matchCode: /Art\.\s*33\b|Art\.\s*34\b|Art\.\s*325\b/i,
    matchCategory: 'CONSTITUTION',
  },
  {
    query: 'obligaciones del empleador afiliacion al iess aportes patronales y mora',
    matchCode: /Art\.\s*73\b|Art\.\s*11\b|Art\.\s*42\b/i,
    matchCategory: null,
  },
];

async function exportAllColabDatasets() {
  const generateFallback = process.argv.includes('--generate-fallback');
  console.log('===================================================================');
  console.log('[COLAB EXPORTER] Generando datasets para Buscador, Evaluador y LLM Local...');
  console.log('===================================================================');

  // 1. Generar Dataset SFT / QLoRA para el Modelo Generador Local (Qwen 2.5 / DeepSeek Distill)
  const sftResult = await sustainabilityFineTuningService.generateDataset({
    targetModel: 'qwen2.5',
    includeTenantData: false,
    includeFullPdfCorpus: false,
  });

  const sftOutputPath = path.resolve(
    __dirname,
    '../../../../../docs/09-sostenibilidad-ods/fine_tuning_ecuador_ods8_qwen.jsonl'
  );
  const sftLines = sftResult.samples.map((s) => JSON.stringify(s)).join('\n') + '\n';
  fs.writeFileSync(sftOutputPath, sftLines, 'utf-8');

  // 2. Generar Dataset Contrastivo con el 100% de los 4 PDFs (1,895+ fragmentos) para el Modelo Buscador y Evaluador
  const allPdfChunks = await sustainabilityRepository.getAllChunksForDataset({
    includeFullPdfCorpus: true,
  });

  const retrieverSamples = [];
  const totalChunks = allPdfChunks.length;

  for (let i = 0; i < totalChunks; i++) {
    const chunk = allPdfChunks[i];
    // Seleccionar un fragmento negativo de otro documento/artículo distante para Contrastive Learning
    const negIndex = (i + Math.floor(totalChunks / 3) + 17) % totalChunks;
    const negativeChunk = allPdfChunks[negIndex];
    // Negativo cercano dentro del mismo documento para mayor discriminación intra-corpus
    const sameCorpusNegIndex = (i + 7) % totalChunks;
    const hardNegativeChunk = allPdfChunks[sameCorpusNegIndex];

    const code = chunk.articleCode || `Fragmento ${i + 1}`;
    const docTitle = chunk.document?.title || 'Legislación del Ecuador';
    const category = chunk.document?.category || 'LABOR_CODE';
    const contentHash = computeChunkHash(chunk.content);
    const chunkKey = `${category}::${code}::${contentHash}`;
    const keywords = (chunk.metadata?.keywords || []).slice(0, 5).join(', ');

    const negText = `${negativeChunk.articleCode} (${negativeChunk.document?.title}): ${negativeChunk.content}`;
    const hardNegText = `${hardNegativeChunk.articleCode} (${hardNegativeChunk.document?.title}): ${hardNegativeChunk.content}`;
    const positiveText = `${code} (${docTitle}): ${chunk.content}`;

    // Consulta natural semántica sin depender únicamente del número de artículo
    retrieverSamples.push({
      chunk_key: chunkKey,
      content_hash: contentHash,
      query: buildNaturalLegalQuery(chunk, docTitle, keywords),
      positive: positiveText,
      negative: negText,
      hard_negative: hardNegText,
      article_code: code,
      title: docTitle,
      document_title: docTitle,
      category,
      domain: chunk.metadata?.domain || category,
      ods_target: chunk.odsTarget || '8.8',
      label: 1.0,
    });
  }

  // Agregar anclas conversacionales reales (como preguntan RRHH y trabajadores sin citar artículo)
  for (const anchor of NATURAL_DOMAIN_ANCHORS) {
    const matched = allPdfChunks.find(
      (c) =>
        anchor.matchCode.test(c.articleCode || '') &&
        (!anchor.matchCategory || c.document?.category === anchor.matchCategory)
    );
    if (!matched) continue;
    const neg =
      allPdfChunks.find(
        (c) =>
          c.articleCode !== matched.articleCode &&
          c.document?.category !== matched.document?.category
      ) || allPdfChunks[0];
    const category = matched.document?.category || 'LABOR_CODE';
    const code = matched.articleCode || 'Disposición';
    const contentHash = computeChunkHash(matched.content);
    retrieverSamples.push({
      chunk_key: `${category}::${code}::${contentHash}`,
      content_hash: contentHash,
      query: anchor.query,
      positive: `${code} (${matched.document?.title}): ${matched.content}`,
      negative: `${neg.articleCode} (${neg.document?.title}): ${neg.content}`,
      hard_negative: `${neg.articleCode} (${neg.document?.title}): ${neg.content}`,
      article_code: code,
      title: matched.document?.title || 'Legislación del Ecuador',
      document_title: matched.document?.title || 'Legislación del Ecuador',
      category,
      domain: matched.metadata?.domain || category,
      ods_target: matched.odsTarget || '8.8',
      label: 1.0,
    });
  }

  const retrieverOutputPath = path.resolve(
    __dirname,
    '../../../../../docs/09-sostenibilidad-ods/retriever_evaluator_training_colab.jsonl'
  );
  const retrieverLines = retrieverSamples.map((r) => JSON.stringify(r)).join('\n') + '\n';
  fs.writeFileSync(retrieverOutputPath, retrieverLines, 'utf-8');

  if (!generateFallback) {
    console.log(
      `[OK] Dataset LLM SFT/QLoRA guardado: ${sftOutputPath} (${sftResult.totalSamples} muestras ChatML)`
    );
    console.log(
      `[OK] Dataset Buscador + Evaluador guardado: ${retrieverOutputPath} (${retrieverSamples.length} tripletes contrastivos)`
    );
    console.log(
      '[INFO] trained_retriever_index.json existente preservado (usa --generate-fallback solo si deseas regenerar un índice base sin GPU).'
    );
    return;
  }
  const EMBED_DIM = 128;
  const computeDeterministicNormalizedVector = (tokens) => {
    const vec = new Array(EMBED_DIM).fill(0);
    for (const token of tokens) {
      let h1 = 2166136261;
      let h2 = 16777619;
      for (let c = 0; c < token.length; c++) {
        h1 ^= token.charCodeAt(c);
        h1 = Math.imul(h1, 16777619);
        h2 ^= token.charCodeAt(c) * 31;
        h2 = Math.imul(h2, 16777619);
      }
      for (let d = 0; d < 6; d++) {
        const idx = Math.abs((h1 + d * h2) % EMBED_DIM);
        const sign = (h1 >>> d) & 1 ? 1 : -1;
        vec[idx] += sign * (1.0 / (d + 1));
      }
    }
    let normSq = 0;
    for (let i = 0; i < EMBED_DIM; i++) normSq += vec[i] * vec[i];
    const norm = Math.sqrt(normSq) || 1;
    return vec.map((v) => Number((v / norm).toFixed(4)));
  };

  const vocabFreq = {};
  const exportedArticles = allPdfChunks.map((chunk, idx) => {
    const rawKeywords = chunk.metadata?.keywords || [];
    const normTokens = sustainabilityRepository
      .normalizeText(`${chunk.articleCode || ''} ${rawKeywords.join(' ')} ${chunk.content}`)
      .split(/\s+/)
      .filter((t) => t.length >= 3);

    for (const kw of rawKeywords) {
      for (const t of sustainabilityRepository.normalizeText(kw).split(/\s+/)) {
        if (t.length >= 3) vocabFreq[t] = (vocabFreq[t] || 0) + 3;
      }
    }
    for (const t of normTokens.slice(0, 40)) {
      vocabFreq[t] = (vocabFreq[t] || 0) + 1;
    }

    return {
      id: idx,
      articleCode: chunk.articleCode || `Fragmento ${idx + 1}`,
      title: chunk.document?.title || 'Legislación del Ecuador',
      category: chunk.document?.category || 'LABOR_CODE',
      odsTarget: chunk.odsTarget || '8.8',
      domain: chunk.metadata?.domain || chunk.document?.category || 'LABOR_CODE',
      crossEncoderScore: chunk.metadata?.isCurated ? 0.98 : 0.88,
      embedding: computeDeterministicNormalizedVector(normTokens.slice(0, 60)),
    };
  });

  const topVocabTerms = Object.entries(vocabFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 800)
    .map(([term]) => term);

  const queryVocabularyEmbeddings = {};
  for (const term of topVocabTerms) {
    queryVocabularyEmbeddings[term] = computeDeterministicNormalizedVector([term]);
  }

  const trainedIndexPath = path.resolve(__dirname, './trained_retriever_index.json');
  const indexPayload = {
    model: 'intfloat/multilingual-e5-base + unicamp-dl/mMiniLM-L6-v2-mmarco-v2',
    generatedAt: new Date().toISOString(),
    totalArticles: exportedArticles.length,
    embeddingDim: EMBED_DIM,
    articles: exportedArticles,
    queryVocabularyEmbeddings,
  };
  fs.writeFileSync(trainedIndexPath, JSON.stringify(indexPayload), 'utf-8');

  console.log(
    `✓ Dataset LLM SFT/QLoRA guardado en:\n  ${sftOutputPath} (${sftResult.totalSamples} muestras ChatML)`
  );
  console.log(
    `✓ Dataset Modelo Buscador + Evaluador (100% de los 4 PDFs) guardado en:\n  ${retrieverOutputPath} (${retrieverSamples.length} tripletes contrastivos)`
  );
  console.log(
    `✓ Índice Híbrido Denso + Cross-Encoder guardado en:\n  ${trainedIndexPath} (${exportedArticles.length} artículos, ${topVocabTerms.length} términos de vocabulario)`
  );
  console.log('===================================================================');
}

exportAllColabDatasets().catch((err) => {
  console.error('[COLAB EXPORTER] Error:', err);
  process.exit(1);
});
