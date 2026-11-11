/**
 * @file extractCorpusToDataset.js
 * @description Generador automático de pares de entrenamiento a partir del corpus legal de Ecuador y ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sustainabilityFineTuningService from '../sustainabilityFineTuning.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportLocalDataset() {
  console.log('[DATASET EXPORTER] Compilando pares de entrenamiento para Qwen 2.5 14B...');

  const result = await sustainabilityFineTuningService.generateDataset({
    targetModel: 'llama3', // Formato estándar compatible con Unsloth / Alpaca / Qwen
    includeTenantData: false,
  });

  const outputPath = path.resolve(__dirname, '../../../../../docs/09-sostenibilidad-ods/fine_tuning_ecuador_ods8_qwen.jsonl');
  const jsonlLines = result.samples.map((s) => JSON.stringify(s)).join('\n');

  fs.writeFileSync(outputPath, jsonlLines, 'utf-8');
  console.log(`[DATASET EXPORTER] Dataset generado exitosamente en:\n${outputPath}`);
  console.log(`[DATASET EXPORTER] Total de muestras: ${result.totalSamples}`);
}

exportLocalDataset().catch((err) => {
  console.error('[DATASET EXPORTER] Error:', err);
  process.exit(1);
});
