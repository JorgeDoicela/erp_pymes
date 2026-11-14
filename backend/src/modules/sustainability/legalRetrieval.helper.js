/**
 * @file legalRetrieval.helper.js
 * @description Motor de expansión léxico-semántica jurídica ecuatoriana, reglas de co-recuperación
 * multi-artículo (finiquitos, vacaciones, décimos, reformas) y ponderación de vigencia temporal.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import {
  NON_LABOR_EXCLUSION_PATTERNS,
  ECUADOR_LEGAL_DOMAIN_SIGNALS,
  ECUADOR_LEGAL_SYNONYMS,
  SPANISH_STOPWORDS,
  SIERRA_AMAZONIA_CITIES,
  COSTA_INSULAR_CITIES,
} from './data/ecuadorLegalSynonyms.js';

export {
  NON_LABOR_EXCLUSION_PATTERNS,
  ECUADOR_LEGAL_DOMAIN_SIGNALS,
  ECUADOR_LEGAL_SYNONYMS,
  SPANISH_STOPWORDS,
};

const NORMATIVE_SOURCE_PATTERNS = [
  { category: 'CONSTITUTION', pattern: /\b(constitucion|constitucional|carta magna)\b/ },
  {
    category: 'LABOR_CODE',
    pattern:
      /\b(codigo del? trabajo|codigo laboral|fondos? de reserva|desahucio|despido|vacaciones|utilidades|decimo)\b/,
  },
  { category: 'IESS_REGULATION', pattern: /\b(iess|seguridad social|afiliacion)\b/ },
  { category: 'ODS_8_FRAMEWORK', pattern: /\b(oit|ods\s*8|trabajo decente|8\.[1-9])\b/ },
];

export function detectRequestedNormativeCategories(normQuery) {
  const query = String(normQuery || '');
  return NORMATIVE_SOURCE_PATTERNS.filter(({ pattern }) => pattern.test(query)).map(
    ({ category }) => category
  );
}

export function selectBalancedByCategory(items, limit, requestedCategories, _scoreField) {
  if (!Array.isArray(requestedCategories) || requestedCategories.length <= 1) {
    return items.slice(0, limit);
  }
  const selected = [];
  const seenIds = new Set();
  const minPerCategory = Math.max(1, Math.floor(limit / requestedCategories.length));

  for (const category of requestedCategories) {
    let taken = 0;
    for (const item of items) {
      if (item.document?.category === category && !seenIds.has(item.id)) {
        selected.push(item);
        seenIds.add(item.id);
        if (++taken >= minPerCategory) break;
      }
    }
  }
  for (const item of items) {
    if (selected.length >= limit) break;
    if (!seenIds.has(item.id)) {
      selected.push(item);
      seenIds.add(item.id);
    }
  }
  return selected.slice(0, limit);
}

export function resolveLegalRoot(token) {
  if (!token || typeof token !== 'string') return null;
  const t = token.toLowerCase();
  if (SIERRA_AMAZONIA_CITIES.has(t)) return 'regimen_sierra';
  if (COSTA_INSULAR_CITIES.has(t)) return 'regimen_costa';
  if (
    t.startsWith('despid') ||
    t.startsWith('desped') ||
    t.startsWith('botar') ||
    t.startsWith('echar')
  ) {
    return 'despido';
  }
  if (t.startsWith('renunc')) return 'renuncia';
  if (t.startsWith('liquid') || t.startsWith('finiquit') || t.startsWith('indemniz')) {
    return 'finiquito';
  }
  if (t.startsWith('desahu')) return 'desahucio';
  if (t.startsWith('jubil')) return 'jubilacion';
  if (t.startsWith('vacaci')) return 'vacaciones';
  if (t.startsWith('embaraz') || t.startsWith('matern')) return 'maternidad';
  if (t.startsWith('patern')) return 'paternidad';
  if (t.startsWith('lactan')) return 'lactancia';
  if (t.startsWith('utilida')) return 'utilidades';
  if (
    t.startsWith('decim') ||
    t === '14to' ||
    t === '14vo' ||
    t === '13er' ||
    t === '13ro' ||
    t === '13vo' ||
    t === 'cuarto' ||
    t === 'tercer'
  ) {
    return 'decimo';
  }
  if (t.startsWith('hor') || t.startsWith('sobretiemp') || t.startsWith('suplementar')) {
    return 'horas';
  }
  if (t.startsWith('extraordinar')) return 'extra';
  if (t.startsWith('afili') || t.startsWith('aport') || t.startsWith('cesant')) return 'iess';
  if (t.startsWith('prescrib') || t.startsWith('prescripc')) return 'prescripcion';
  if (t.startsWith('impugn')) return 'finiquito';
  if (t.startsWith('ineficaz')) return 'maternidad';
  if (t.startsWith('irrenunciab') || t.startsWith('terceriz')) return 'constitucion';
  if (t.startsWith('acos') || t.startsWith('hostig') || t === 'mobbing') return 'acoso';
  if (t.startsWith('embarg') || t.startsWith('inembarg') || t.startsWith('aliment'))
    return 'embargo';
  if (t.startsWith('enfermed')) return 'enfermedad';
  if (t.startsWith('accident') || t.startsWith('riesg')) return 'accidente';
  if (t.startsWith('adolescen')) return 'adolescente';
  if (t.startsWith('mult')) return 'multa';
  if (t.startsWith('discapacid')) return 'discapacidad';
  if (t.startsWith('solidar')) return 'solidaria';
  if (t.startsWith('reform') || t.startsWith('derog') || t.startsWith('vigenc')) {
    return 'reforma_laboral';
  }
  return null;
}

const SPECIFIC_CO_RETRIEVAL_RULES = [
  {
    pattern:
      /\b(visto\s+bueno|causales?\s+de\s+visto|justa\s+causa|falta\s+grave|indisciplina|falta\w*\s+\d+\s+dias|mas\s+de\s+tres\s+dias|no\s+paga\s+puntual\w*)\b/,
    articles: ['172', '173', '621'],
  },
  {
    pattern: /\b(acoso\s+laboral|hostigamient\w*|mobbing)\b/,
    articles: ['172', '173', '44', '42'],
  },
  {
    pattern:
      /\b(embaraz\w*|maternidad\w*|paternidad\w*|lactancia\w*|despido\s+ineficaz|ineficaz|dirigente\w*\s+sindical\w*)\b/,
    articles: ['195.1', '195.3', '153', '152', '155', '187'],
  },
  {
    pattern: /\b(jubilaci\w*\s+(?:ordinaria\s+de\s+)?vejez|imposiciones\s+en\s+el\s+iess)\b/,
    articles: ['IESS_REGULATION::185', 'IESS_REGULATION::186'],
  },
  {
    pattern: /\b(cesantia|seguro\s+de\s+desempleo)\b/,
    articles: ['IESS_REGULATION::283'],
  },
  {
    pattern:
      /\b(jubilaci\w*\s+patronal|25\s+anos|20\s+y\s+25\s+anos|22\s+anos|veinticinco\s+anos)\b/,
    articles: ['216', '188'],
  },
  {
    pattern: /\b(cambio\s+de\s+ocupacion|rebaja\s+de\s+categoria|192)\b/,
    articles: ['192', '188'],
  },
  {
    pattern: /\b(cierre\s+de\s+(?:la\s+)?empresa|liquid\w*\s+definitivamente\s+el\s+negocio|193)\b/,
    articles: ['193', '188', '185'],
  },
  {
    pattern: /\b(responsabilidad\s+solidaria)\b/,
    articles: ['41', 'CONSTITUTION::327'],
  },
  {
    pattern: /\b(enfermedad\w*\s+catastrofic\w*|vih)\b/,
    articles: ['195.3', '42', 'CONSTITUTION::326'],
  },
  {
    pattern: /\b(jornada\s+ordinaria|40\s+horas\s+semanales|descanso\s+de\s+almuerzo)\b/,
    articles: ['47', '50', '57'],
  },
  {
    pattern: /\b(asiento\s+contable|partida\s+doble|rol\s+de\s+pagos?)\b/,
    articles: ['196', 'IESS_REGULATION::11'],
  },
  {
    pattern: /\b(impugn\w*|acta\s+de\s+finiquito|pormenorizad\w*)\b/,
    articles: ['595', '185', '188'],
  },
  {
    pattern: /\b(prescrib\w*|prescripcion\w*)\b/,
    articles: ['635'],
  },
  {
    pattern: /\b(periodo\s+de\s+prueba|90\s+dias|noventa\s+dias)\b/,
    articles: ['15', '14'],
  },
  {
    pattern: /\b(eventual\w*|ocasional\w*|temporada|recargo\s+del\s+35|35\s*%)\b/,
    articles: ['17', '14'],
  },
  {
    pattern:
      /\b(utilidad\w*|reparto\s+de\s+utilidades|15\s*%\s*de\s*utilidades|cargas?\s+familiar\w*)\b/,
    articles: ['97', '100'],
  },
  {
    pattern: /\b(fondos?\s+de\s+reserva|8[.,]33\s*%)\b/,
    articles: ['196', '200'],
  },
  {
    pattern:
      /\b(horas?\s+suplementar\w*|horas?\s+extra\w*|sobretiemp\w*|jornada\s+nocturn\w*|recargo\s+nocturn\w*|feriad\w*|domingo\w*)\b/,
    articles: ['55', '49', '47'],
  },
  {
    pattern:
      /\b(afiliacion\w*\s+al?\s+iess|mora\s+patronal|responsabilidad\s+patronal|primer\s+dia\s+de\s+trabajo)\b/,
    articles: ['IESS_REGULATION::73', 'IESS_REGULATION::94'],
  },
  {
    pattern: /\b(irrenunciab\w*|intangib\w*|tercerizaci\w*|intermediaci\w*)\b/,
    articles: ['CONSTITUTION::326', 'CONSTITUTION::327', '4'],
  },
  {
    pattern: /\b(discapacid\w*|sustitut\w*|25\s+trabajadores)\b/,
    articles: ['42', 'CONSTITUTION::47'],
  },
  {
    pattern: /\b(multa\w*|reglamento\s+interno)\b/,
    articles: ['44', '42'],
  },
  {
    pattern: /\b(embarg\w*|inembargab\w*|pension\w*\s+alimentici\w*|alimentos)\b/,
    articles: ['91', '90', 'CONSTITUTION::328'],
  },
  {
    pattern: /\b(enfermedad\w*\s+no\s+profesional\w*)\b/,
    articles: ['177', '175', '176', '42'],
  },
  {
    pattern:
      /\b(accidente\w*\s+de\s+trabajo|enfermedad\w*\s+profesional\w*|riesgos?\s+del?\s+trabajo)\b/,
    articles: ['348', '353', '360'],
  },
  {
    pattern: /\b(edad\s+minima|adolescent\w*|menores\s+de\s+edad)\b/,
    articles: ['134', '35', '34.1'],
  },
  {
    pattern: /\b(contrato\s+colectivo|pacto\s+colectivo|huelga\w*)\b/,
    articles: ['220', '467'],
  },
];

function parseMandatoryArticleSpec(spec) {
  if (String(spec).includes('::')) {
    const [category, number] = String(spec).split('::');
    return { category, number };
  }
  return { category: 'LABOR_CODE', number: String(spec) };
}

/**
 * Determina los artículos obligatorios de co-recuperación según la intención jurídica de la consulta.
 * Prioriza instituciones específicas antes del paquete general de liquidación/finiquito.
 * @param {string} normalizedQuery
 * @returns {string[]} Lista de especificaciones de artículos a co-recuperar
 */
export function resolveMandatoryCoRetrievalArticles(normalizedQuery) {
  const coArticles = new Set();
  const query = String(normalizedQuery || '');

  for (const rule of SPECIFIC_CO_RETRIEVAL_RULES) {
    if (rule.pattern.test(query)) {
      rule.articles.forEach((a) => coArticles.add(a));
    }
  }

  const hasSpecificInstitutionMatch =
    coArticles.size > 0 &&
    !/\b(liquidacion\w*|liquidar\w*|finiquit\w*|cuanto\s+me\s+toca|cuanto\s+recib\w*)\b/.test(
      query
    );
  const isDismissalOrSettlement =
    /\b(despid\w*|desped\w*|botar\w*|echar\w*|intempestiv\w*|liquidacion\w*|liquidar\w*|finiquit\w*|indemniz\w*|desvincul\w*|renunci\w*|fallec\w*)\b/.test(
      query
    );
  if (isDismissalOrSettlement && !hasSpecificInstitutionMatch) {
    ['188', '185', '69', '71', '111', '113'].forEach((a) => coArticles.add(a));
  }

  if (/\b(vacacion\w*|no\s+gozad\w*|veinticuatroav\w*|descanso\s+anual)\b/.test(query)) {
    ['69', '71', '73'].forEach((a) => coArticles.add(a));
  }
  if (
    /\b(decimo\s*cuarto|decimocuarto|14to|14vo|bonificacion\s+escolar|quito|kito|guayaquil|gye|sierra|amazonia|costa|galapagos|insular|regimen\s+escolar)\b/.test(
      query
    )
  ) {
    coArticles.add('113');
  }
  if (/\b(decimo\s*tercer\w*|decimotercer\w*|13er|13ro|13vo|bono\s+navideno)\b/.test(query)) {
    coArticles.add('111');
  }
  if (
    /\b(reform\w*|derogad\w*|vigente\w*|vigencia|plazo\s+fijo|justicia\s+laboral|legislacion\s+anterior)\b/.test(
      query
    )
  ) {
    ['14', '184', '181', '189'].forEach((a) => coArticles.add(a));
  }

  return [...coArticles];
}

/**
 * Calcula el ajuste de puntaje por vigencia temporal del artículo y reglas de co-recuperación.
 */
export function computeTemporalAndCoRetrievalBoost({
  chunk,
  normArticleCode,
  normalizedQuery,
  mandatoryCoArticles,
}) {
  let boost = 0;
  const chunkCategory = chunk.document?.category;
  const isRepealed = chunk.metadata?.isRepealed === true;
  const temporalStatus = chunk.metadata?.temporalStatus || 'VIGENTE';
  const asksAboutReforms =
    /\b(reform\w*|derogad\w*|vigente\w*|vigencia|plazo\s+fijo|justicia\s+laboral|antes|anterior\w*)\b/.test(
      normalizedQuery
    );

  if (mandatoryCoArticles.length > 0 && normArticleCode) {
    for (const rawSpec of mandatoryCoArticles) {
      const { category, number } = parseMandatoryArticleSpec(rawSpec);
      if (chunkCategory !== category) continue;
      const exactArtRegex = new RegExp(`\\bart(?:iculo)?\\s*${number.replace('.', '\\.')}\\b`);
      if (exactArtRegex.test(normArticleCode)) {
        const isSecondaryPart = /\bparte\s+[2-9]\b/.test(normArticleCode);
        boost += isSecondaryPart ? 10.0 : 32.0;
      }
    }
  }

  if (asksAboutReforms) {
    if (temporalStatus === 'VIGENTE_REFORMADO' || isRepealed) {
      boost += 18.0;
    }
  } else if (isRepealed) {
    boost -= 25.0;
  }

  return boost;
}

/**
 * Garantiza que los artículos obligatorios de co-recuperación presentes entre los candidatos
 * entren en el conjunto final topK junto con los fragmentos de mayor puntaje.
 */
export function ensureMandatoryArticlesInSelection(sortedItems, mandatoryCoArticles, topK) {
  if (!Array.isArray(mandatoryCoArticles) || mandatoryCoArticles.length === 0) {
    return sortedItems.slice(0, topK);
  }

  const selected = [];
  const seenIds = new Set();

  for (const rawSpec of mandatoryCoArticles) {
    if (selected.length >= topK) break;
    const { category, number } = parseMandatoryArticleSpec(rawSpec);
    const regex = new RegExp(`\\bart(?:[ií]culo|\\.)?\\s*${number.replace('.', '\\.')}\\b`, 'i');
    const match = sortedItems.find(
      (item) =>
        !seenIds.has(item.id) &&
        item.document?.category === category &&
        regex.test(String(item.articleCode || '').trim())
    );
    if (match) {
      selected.push(match);
      seenIds.add(match.id);
    }
  }

  for (const item of sortedItems) {
    if (selected.length >= topK) break;
    if (!seenIds.has(item.id)) {
      selected.push(item);
      seenIds.add(item.id);
    }
  }

  return selected.sort(
    (a, b) =>
      (b.evaluatorConfidence ?? b.relevanceScore ?? 0) -
      (a.evaluatorConfidence ?? a.relevanceScore ?? 0)
  );
}
