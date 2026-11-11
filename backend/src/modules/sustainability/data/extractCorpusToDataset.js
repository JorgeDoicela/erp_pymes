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
import { fileURLToPath } from 'url';
import sustainabilityFineTuningService from '../sustainabilityFineTuning.service.js';
import sustainabilityRepository from '../sustainability.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportAllColabDatasets() {
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

  // 2. Generar Dataset Contrastivo con el 100% de los 4 PDFs (1,910+ fragmentos) para el Modelo Buscador y Evaluador
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

    const code = chunk.articleCode || `Fragmento ${i + 1}`;
    const docTitle = chunk.document?.title || 'Legislación del Ecuador';
    const keywords = (chunk.metadata?.keywords || []).slice(0, 5).join(', ');

    const negText = `${negativeChunk.articleCode} (${negativeChunk.document?.title}): ${negativeChunk.content}`;

    // Consulta 1: Búsqueda por código/artículo y temática
    retrieverSamples.push({
      query: `¿Qué establece ${code} de ${docTitle} sobre ${keywords || 'la normativa ecuatoriana'}?`,
      positive: `${code} (${docTitle}): ${chunk.content}`,
      negative: negText,
      hard_negative: negText,
      article_code: code,
      title: docTitle,
      document_title: docTitle,
      category: chunk.document?.category || 'LABOR_CODE',
      domain: chunk.metadata?.domain || chunk.document?.category || 'LABOR_CODE',
      ods_target: chunk.odsTarget || '8.8',
      label: 1.0,
    });
  }

  const retrieverOutputPath = path.resolve(
    __dirname,
    '../../../../../docs/09-sostenibilidad-ods/retriever_evaluator_training_colab.jsonl'
  );
  const retrieverLines = retrieverSamples.map((r) => JSON.stringify(r)).join('\n') + '\n';
  fs.writeFileSync(retrieverOutputPath, retrieverLines, 'utf-8');

  console.log(
    `✓ Dataset LLM SFT/QLoRA guardado en:\n  ${sftOutputPath} (${sftResult.totalSamples} muestras ChatML)`
  );
  console.log(
    `✓ Dataset Modelo Buscador + Evaluador (100% de los 4 PDFs) guardado en:\n  ${retrieverOutputPath} (${retrieverSamples.length} tripletes contrastivos)`
  );
  console.log('===================================================================');
}

exportAllColabDatasets().catch((err) => {
  console.error('[COLAB EXPORTER] Error:', err);
  process.exit(1);
});
