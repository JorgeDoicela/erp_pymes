/**
 * @file ecuadorLaborKnowledge.js
 * @description Cargador directo del Corpus Legal Oficial extraído al 100% de los 4 PDFs:
 * 1. Constitución de la República del Ecuador (2008) — 481 artículos
 * 2. Código del Trabajo del Ecuador — 714 artículos
 * 3. Ley de Seguridad Social (IESS) — 383 artículos
 * 4. Manual Metodológico OIT — Indicadores de Trabajo Decente (ODS 8) — 302 secciones
 * Total: 1,880 artículos y secciones oficiales sin resúmenes manuales.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTRACTED_PDF_CORPUS_PATH = path.resolve(__dirname, './extractedFullLegalCorpus.json');

function loadOfficialPdfCorpus() {
  if (!fs.existsSync(EXTRACTED_PDF_CORPUS_PATH)) {
    throw new Error(
      `No se encontró el corpus extraído en ${EXTRACTED_PDF_CORPUS_PATH}. Ejecute: node backend/src/modules/sustainability/data/extractAllFourPdfs.js`
    );
  }
  const raw = fs.readFileSync(EXTRACTED_PDF_CORPUS_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  return parsed.documents || [];
}

export const ECUADOR_LABOR_CORPUS = loadOfficialPdfCorpus();
export default ECUADOR_LABOR_CORPUS;
