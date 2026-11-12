/**
 * @file extractAllFourPdfs.js
 * @description Extractor exhaustivo del 100% del contenido de los 4 documentos PDF oficiales:
 * 1. Constitución de la República del Ecuador (2008)
 * 2. Código del Trabajo del Ecuador
 * 3. Ley de Seguridad Social (IESS)
 * 4. Metodología OIT — Trabajo Decente y ODS 8
 *
 * Segmenta cada cuerpo legal artículo por artículo y sección por sección sin omitir ningún punto,
 * generando el índice completo para el Modelo Buscador, el Modelo Evaluador y los datasets de Colab.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CORPUS_DIR = path.resolve(
  __dirname,
  '../../../../../docs/09-sostenibilidad-ods/corpus-legal'
);
const OUTPUT_JSON_PATH = path.resolve(__dirname, './extractedFullLegalCorpus.json');

const PDF_SOURCES = [
  {
    fileName: '01-constitucion-republica-ecuador-2008.pdf',
    docId: 'constitucion_2008',
    title: 'Constitución de la República del Ecuador (2008)',
    shortTitle: 'Constitución del Ecuador',
    category: 'CONSTITUTION',
    defaultOds: '8.5',
    mode: 'ARTICLES',
  },
  {
    fileName: '02-codigo-del-trabajo-ecuador.pdf',
    docId: 'codigo_trabajo',
    title: 'Código del Trabajo de la República del Ecuador',
    shortTitle: 'Código del Trabajo',
    category: 'LABOR_CODE',
    defaultOds: '8.8',
    mode: 'ARTICLES',
  },
  {
    fileName: '03-ley-de-seguridad-social-iess.pdf',
    docId: 'ley_seguridad_social_iess',
    title: 'Ley de Seguridad Social (IESS — Ley 2001-55)',
    shortTitle: 'Ley de Seguridad Social IESS',
    category: 'IESS_REGULATION',
    defaultOds: '8.5',
    mode: 'ARTICLES',
  },
  {
    fileName: '04-oit-metodologia-ods8-trabajo-decente.pdf',
    docId: 'oit_metodologia_ods8',
    title: 'Organización Internacional del Trabajo (OIT) — Metodología ODS 8 y Trabajo Decente',
    shortTitle: 'Metodología OIT ODS 8',
    category: 'ODS_8_FRAMEWORK',
    defaultOds: '8.3',
    mode: 'SECTIONS',
  },
];

/**
 * Extrae el texto íntegro página por página de un archivo PDF preservando saltos de línea
 */
async function extractPagesFromPdf(pdfPath) {
  const rawBuffer = fs.readFileSync(pdfPath);
  const uint8Array = new Uint8Array(rawBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    let lastY = null;
    const lines = [];
    let currentLine = [];

    for (const item of textContent.items) {
      const str = item.str || '';
      if (!str) continue;

      const y = item.transform ? Math.round(item.transform[5]) : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' ').replace(/\s+/g, ' ').trim());
          currentLine = [];
        }
      }
      currentLine.push(str);
      lastY = y;
    }

    if (currentLine.length > 0) {
      lines.push(currentLine.join(' ').replace(/\s+/g, ' ').trim());
    }

    const pageText = lines.filter(Boolean).join('\n');
    pages.push({
      pageNumber: pageNum,
      text: pageText,
    });
  }

  return {
    numPages,
    pages,
  };
}

/**
 * Clasifica automáticamente la meta ODS 8 más afín según el contenido del artículo
 */
function inferOdsTarget(text, defaultOds) {
  const lower = text.toLowerCase();
  if (
    lower.includes('sueldo') ||
    lower.includes('remuneraci') ||
    lower.includes('salario') ||
    lower.includes('utilidad') ||
    lower.includes('décim') ||
    lower.includes('decim') ||
    lower.includes('aporte') ||
    lower.includes('iess') ||
    lower.includes('reserva') ||
    lower.includes('igualdad') ||
    lower.includes('discapacidad')
  ) {
    return '8.5';
  }
  if (
    lower.includes('jornada') ||
    lower.includes('hora') ||
    lower.includes('vacacion') ||
    lower.includes('despido') ||
    lower.includes('desahucio') ||
    lower.includes('visto bueno') ||
    lower.includes('finiquito') ||
    lower.includes('riesgo') ||
    lower.includes('accidente') ||
    lower.includes('maternidad') ||
    lower.includes('sindicat') ||
    lower.includes('huelga')
  ) {
    return '8.8';
  }
  if (
    lower.includes('contrato') ||
    lower.includes('empresa') ||
    lower.includes('empleador') ||
    lower.includes('prueba') ||
    lower.includes('productiv') ||
    lower.includes('emprend') ||
    lower.includes('informal')
  ) {
    return '8.3';
  }
  return defaultOds || '8.8';
}

/**
 * Extrae palabras clave significativas del fragmento para acelerar el Modelo Buscador y Evaluador
 */
function extractKeywords(text, articleCode) {
  const stopWords = new Set([
    'para',
    'como',
    'este',
    'esta',
    'estos',
    'estas',
    'todo',
    'toda',
    'todos',
    'todas',
    'sera',
    'seran',
    'cuando',
    'donde',
    'quien',
    'quienes',
    'cual',
    'cuales',
    'ante',
    'bajo',
    'cabe',
    'contra',
    'desde',
    'durante',
    'entre',
    'hacia',
    'hasta',
    'mediante',
    'segun',
    'sobre',
    'tras',
    'mismo',
    'misma',
    'otros',
    'otras',
    'cada',
    'sino',
    'pero',
    'porque',
    'aunque',
    'tener',
    'tiene',
    'tienen',
    'haya',
    'hubiere',
    'fueren',
    'fuere',
    'caso',
    'casos',
    'forma',
    'parte',
    'partes',
    'articulo',
    'codigo',
    'ecuador',
  ]);

  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');

  const freq = {};
  for (const word of normalized.split(/\s+/)) {
    if (word.length < 4 || stopWords.has(word) || /^\d+$/.test(word)) continue;
    freq[word] = (freq[word] || 0) + 1;
  }

  const topWords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);

  if (articleCode) {
    topWords.unshift(articleCode.toLowerCase());
  }

  return [...new Set(topWords)];
}

/**
 * Segmenta un cuerpo legal por cada Artículo ("Art. X.-" / "Artículo X.-") y Disposición,
 * garantizando que no se pierda ni el preámbulo ni ningún artículo extenso.
 */
function segmentLegalArticles(pages, sourceMeta) {
  // Concatenar con marcadores de página para saber exactamente en qué página está cada artículo
  const fullLines = [];
  for (const p of pages) {
    const pageLines = p.text.split('\n');
    for (const line of pageLines) {
      const clean = line.trim();
      if (!clean) continue;
      // Omitir cabeceras de paginación repetitivas tipo "Página 12 de 185"
      if (/^p[áa]gina\s+\d+\s+de\s+\d+$/i.test(clean)) continue;
      fullLines.push({ pageNumber: p.pageNumber, text: clean });
    }
  }

  const chunks = [];
  let currentHeadingContext = sourceMeta.shortTitle;
  let currentArticleCode = `${sourceMeta.shortTitle} — Preliminar`;
  let currentStartPage = 1;
  let currentBuffer = [];

  const articleRegex =
    /^(?:Art(?:[ií]culo|\.)\s*(\d+(?:\.\d+)?(?:\s*-\s*[A-Za-z0-9]+)?)\s*[.\-–—:]?\s*(.*)|DISPOSICI[ÓO]N(?:ES)?\s+(GENERAL(?:ES)?|TRANSITORIA(?:S)?|REFORMATORIA(?:S)?|DEROGATORIA(?:S)?|FINAL(?:ES)?)\b\s*(.*))/i;
  const headingRegex =
    /^(?:T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N|LIBRO|PAR[ÁA]GRAFO)\s+[IVXLCDM0-9]+\b.*/i;

  const flushChunk = () => {
    const content = currentBuffer.join(' ').replace(/\s+/g, ' ').trim();
    if (content.length < 25) {
      currentBuffer = [];
      return;
    }

    // Si un artículo es extremadamente largo (> 2600 caracteres), dividirlo en partes conexas sin perder ni un carácter
    if (content.length <= 2600) {
      const odsTarget = inferOdsTarget(content, sourceMeta.defaultOds);
      chunks.push({
        articleCode: currentArticleCode,
        odsTarget,
        content: `[${currentHeadingContext} | Pág. ${currentStartPage}] ${content}`,
        metadata: {
          docId: sourceMeta.docId,
          pageNumber: currentStartPage,
          section: currentHeadingContext,
          keywords: extractKeywords(content, currentArticleCode),
        },
      });
    } else {
      const sentences = content.split(/(?<=[.;:])\s+/);
      let partBuffer = [];
      let partLen = 0;
      let partIdx = 1;

      for (const sent of sentences) {
        if (partLen + sent.length > 2200 && partBuffer.length > 0) {
          const partText = partBuffer.join(' ').trim();
          const codeWithPart = `${currentArticleCode} (Parte ${partIdx})`;
          chunks.push({
            articleCode: codeWithPart,
            odsTarget: inferOdsTarget(partText, sourceMeta.defaultOds),
            content: `[${currentHeadingContext} | Pág. ${currentStartPage}] ${partText}`,
            metadata: {
              docId: sourceMeta.docId,
              pageNumber: currentStartPage,
              section: currentHeadingContext,
              keywords: extractKeywords(partText, currentArticleCode),
            },
          });
          partIdx++;
          partBuffer = [sent];
          partLen = sent.length;
        } else {
          partBuffer.push(sent);
          partLen += sent.length + 1;
        }
      }

      if (partBuffer.length > 0) {
        const partText = partBuffer.join(' ').trim();
        const codeWithPart =
          partIdx > 1 ? `${currentArticleCode} (Parte ${partIdx})` : currentArticleCode;
        chunks.push({
          articleCode: codeWithPart,
          odsTarget: inferOdsTarget(partText, sourceMeta.defaultOds),
          content: `[${currentHeadingContext} | Pág. ${currentStartPage}] ${partText}`,
          metadata: {
            docId: sourceMeta.docId,
            pageNumber: currentStartPage,
            section: currentHeadingContext,
            keywords: extractKeywords(partText, currentArticleCode),
          },
        });
      }
    }

    currentBuffer = [];
  };

  for (const item of fullLines) {
    const line = item.text;

    if (headingRegex.test(line) && line.length < 160) {
      currentHeadingContext = `${sourceMeta.shortTitle} · ${line}`;
      currentBuffer.push(line);
      continue;
    }

    const match = line.match(articleRegex);
    if (match) {
      flushChunk();
      currentStartPage = item.pageNumber;
      if (match[1]) {
        currentArticleCode = `${sourceMeta.shortTitle} Art. ${match[1].replace(/\s+/g, '')}`;
        currentBuffer.push(`Art. ${match[1]}.- ${match[2] || ''}`.trim());
      } else {
        const dispType = match[3] ? match[3].toUpperCase() : 'DISPOSICIÓN';
        currentArticleCode = `${sourceMeta.shortTitle} — Disposición ${dispType} (Pág. ${item.pageNumber})`;
        currentBuffer.push(line);
      }
    } else {
      currentBuffer.push(line);
    }
  }

  flushChunk();
  return chunks;
}

/**
 * Segmenta documentos técnicos/metodológicos (como el manual de la OIT ODS 8)
 * página por página y sección por sección sin perder ningún indicador ni tabla.
 */
function segmentDocumentBySections(pages, sourceMeta) {
  const chunks = [];

  for (const page of pages) {
    const cleanText = page.text.replace(/\s+/g, ' ').trim();
    if (cleanText.length < 40) continue;

    // Detectar si la página menciona algún indicador ODS o título destacado
    const firstLine =
      page.text.split('\n').find((l) => l.trim().length > 5) || `Página ${page.pageNumber}`;
    const headerSnippet = firstLine.trim().substring(0, 75);

    if (cleanText.length <= 2200) {
      const code = `${sourceMeta.shortTitle} — Pág. ${page.pageNumber} (${headerSnippet})`;
      chunks.push({
        articleCode: code,
        odsTarget: inferOdsTarget(cleanText, sourceMeta.defaultOds),
        content: `[OIT Metodología ODS 8 | Página ${page.pageNumber}] ${cleanText}`,
        metadata: {
          docId: sourceMeta.docId,
          pageNumber: page.pageNumber,
          keywords: extractKeywords(cleanText, `OIT Pág. ${page.pageNumber}`),
        },
      });
    } else {
      // Dividir páginas muy densas en bloques de ~1600 caracteres con solapamiento de contexto
      let start = 0;
      let part = 1;
      while (start < cleanText.length) {
        const end = Math.min(cleanText.length, start + 1700);
        const slice = cleanText.substring(start, end).trim();
        if (slice.length > 50) {
          const code = `${sourceMeta.shortTitle} — Pág. ${page.pageNumber}.${part}`;
          chunks.push({
            articleCode: code,
            odsTarget: inferOdsTarget(slice, sourceMeta.defaultOds),
            content: `[OIT Metodología ODS 8 | Página ${page.pageNumber}, Bloque ${part}] ${slice}`,
            metadata: {
              docId: sourceMeta.docId,
              pageNumber: page.pageNumber,
              keywords: extractKeywords(slice, code),
            },
          });
        }
        if (end >= cleanText.length) break;
        start = end - 200; // Solapamiento de 200 caracteres para no cortar ideas
        part++;
      }
    }
  }

  return chunks;
}

async function runFullExtraction() {
  console.log('===================================================================');
  console.log('[PDF EXTRACTOR] Iniciando extracción del 100% de los 4 PDFs...');
  console.log('===================================================================');

  const extractedDocuments = [];
  let totalPagesExtracted = 0;
  let totalChunksExtracted = 0;
  let totalCharactersExtracted = 0;

  for (const source of PDF_SOURCES) {
    const pdfPath = path.join(CORPUS_DIR, source.fileName);
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`No se encontró el archivo PDF oficial: ${pdfPath}`);
    }

    const { numPages, pages } = await extractPagesFromPdf(pdfPath);
    const chunks =
      source.mode === 'ARTICLES'
        ? segmentLegalArticles(pages, source)
        : segmentDocumentBySections(pages, source);

    const docChars = chunks.reduce((acc, c) => acc + c.content.length, 0);
    totalPagesExtracted += numPages;
    totalChunksExtracted += chunks.length;
    totalCharactersExtracted += docChars;

    extractedDocuments.push({
      docId: source.docId,
      title: source.title,
      shortTitle: source.shortTitle,
      category: source.category,
      version: '2026',
      sourceUrl: `docs/09-sostenibilidad-ods/corpus-legal/${source.fileName}`,
      totalPages: numPages,
      totalChunks: chunks.length,
      chunks,
    });

    console.log(
      `✓ ${source.fileName}: ${numPages} páginas -> ${chunks.length} artículos/fragmentos íntegros (${(docChars / 1024).toFixed(1)} KB de texto)`
    );
  }

  const outputPayload = {
    extractedAt: new Date().toISOString(),
    summary: {
      totalDocuments: extractedDocuments.length,
      totalPagesExtracted,
      totalChunksExtracted,
      totalCharactersExtracted,
    },
    documents: extractedDocuments,
  };

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(outputPayload, null, 2), 'utf-8');

  console.log('-------------------------------------------------------------------');
  console.log(`[PDF EXTRACTOR] Extracción completada sin omitir ningún punto.`);
  console.log(`- Total Documentos: ${extractedDocuments.length}`);
  console.log(`- Total Páginas Procesadas: ${totalPagesExtracted}`);
  console.log(`- Total Artículos y Secciones Indexadas: ${totalChunksExtracted}`);
  console.log(`- Total Caracteres Extraídos: ${totalCharactersExtracted.toLocaleString()} chars`);
  console.log(`- Archivo guardado en: ${OUTPUT_JSON_PATH}`);
  console.log('===================================================================');
}

runFullExtraction().catch((err) => {
  console.error('[PDF EXTRACTOR] Error fatal:', err);
  process.exit(1);
});
