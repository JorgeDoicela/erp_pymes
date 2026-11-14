/**
 * @file semanticElementDescriptor.js
 * @description Extractor y calculador de descripciones accesibles para TalkBack en Norma ERP.
 * Reconoce controles interactivos, etiquetas asociadas, pares clave-valor, cifras y abreviaturas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

const INTERACTIVE_SELECTOR =
  'button, a[href], input, select, textarea, [role="button"], [role="combobox"], [role="option"], [role="checkbox"], [role="tab"], [role="menuitem"], [role="link"], [role="switch"], [tabindex="0"]';

const TEXT_CONTAINER_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, label, dt, dd, th, td, li, blockquote, [role="status"], [role="alert"]';

/**
 * Normaliza abreviaturas ecuatorianas, cédulas/RUC, monedas, porcentajes y fechas.
 * @param {string} text
 * @returns {string}
 */
export function formatSpeechText(text = '') {
  if (!text) return '';
  return text
    .replace(/\bIng\.(?=\s|$)/gi, 'Ingeniero')
    .replace(/\bSra\.(?=\s|$)/gi, 'Señora')
    .replace(/\bSr\.(?=\s|$)/gi, 'Señor')
    .replace(/\bDra\.(?=\s|$)/gi, 'Doctora')
    .replace(/\bDr\.(?=\s|$)/gi, 'Doctor')
    .replace(/\bArt\.(?=\s|$)/gi, 'Artículo')
    .replace(/\bN[°º]\s*/gi, 'Número ')
    .replace(/\b(\d{10}|\d{13})\b/g, (match) => match.split('').join(' '))
    .replace(/\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(USD)?/gi, (_, num) => {
      const cleanNum = num.replace(/,/g, '');
      return `${cleanNum} dólares americanos`;
    })
    .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, '$1 del $2 de $3')
    .replace(/(\d+(?:\.\d+)?)%/g, '$1 por ciento')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Identifica si un elemento es interactivo (accionable).
 * @param {HTMLElement} el
 * @returns {boolean}
 */
export function isInteractiveElement(el) {
  if (!el || !(el instanceof Element)) return false;
  return Boolean(el.closest(INTERACTIVE_SELECTOR));
}

/**
 * Resuelve la etiqueta <label> asociada a un campo de formulario.
 * @param {HTMLElement} el
 * @returns {string}
 */
function resolveAssociatedLabelText(el) {
  if (el.id && typeof document !== 'undefined') {
    const explicit = document.querySelector(`label[for="${el.id}"]`);
    if (explicit?.textContent?.trim()) return explicit.textContent.trim();
  }

  const wrappingLabel = el.closest('label');
  if (wrappingLabel?.textContent?.trim()) {
    return wrappingLabel.textContent.trim();
  }

  const parent = el.parentElement;
  const fieldGroup = parent?.querySelector(':scope > label') ? parent : parent?.parentElement;
  const groupLabel = fieldGroup?.querySelector(':scope > label');
  if (groupLabel?.textContent?.trim()) {
    return groupLabel.textContent.trim();
  }
  return '';
}

/**
 * Detecta si un elemento forma parte de un par compacto Clave-Valor (ej. DEPARTAMENTO: Gerencia).
 * @param {HTMLElement} el
 * @returns {string}
 */
function resolveKeyValuePairText(el) {
  if (!el || isInteractiveElement(el)) return '';
  const tag = el.tagName.toLowerCase();
  if (tag !== 'span' && tag !== 'div') return '';

  const parent = el.parentElement;
  if (!parent || parent.tagName.toLowerCase() !== 'div') return '';
  if (parent.children.length < 2 || parent.children.length > 3) return '';
  if (parent.querySelector(INTERACTIVE_SELECTOR)) return '';

  const children = Array.from(parent.children);
  const allLeafNodes = children.every(
    (c) => c.children.length === 0 && ['span', 'div'].includes(c.tagName.toLowerCase())
  );
  if (!allLeafNodes) return '';

  const parts = children
    .map((child) => (child.textContent || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (parts.length >= 2 && parts.join(' ').length <= 120) {
    return parts.join(': ');
  }
  return '';
}

/**
 * Encuentra el elemento de accesibilidad más significativo (interactivo o bloque de texto).
 * @param {HTMLElement} element
 * @returns {HTMLElement|null}
 */
export function findAccessibleTarget(element) {
  if (!element || !(element instanceof Element)) return null;

  const interactive = element.closest(INTERACTIVE_SELECTOR);
  if (interactive) return interactive;

  const textContainer = element.closest(TEXT_CONTAINER_SELECTOR);
  if (textContainer) return textContainer;

  if (element.children.length === 0 && element.textContent?.trim()) {
    return element;
  }

  let curr = element;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    if (curr.textContent?.trim() && (curr.innerText || curr.textContent).length < 150) {
      return curr;
    }
    curr = curr.parentElement;
  }

  return element;
}

/**
 * Obtiene el nombre accesible de un elemento.
 * @param {HTMLElement} el
 * @returns {string}
 */
export function resolveAccessibleName(el) {
  if (!el) return '';
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy && typeof document !== 'undefined') {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl?.textContent?.trim()) return labelEl.textContent.trim();
  }

  const tag = el.tagName.toLowerCase();
  const roleAttr = el.getAttribute('role') || '';
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || roleAttr === 'combobox') {
    const labelText = resolveAssociatedLabelText(el);
    if (labelText) return labelText;
    if (tag === 'select' || roleAttr === 'combobox') {
      return el.getAttribute('title')?.trim() || '';
    }
    if ('placeholder' in el && el.placeholder?.trim()) {
      return el.placeholder.trim();
    }
  }

  const kvPair = resolveKeyValuePairText(el);
  if (kvPair) return kvPair;

  const title = el.getAttribute('title');
  if (title && title.trim()) return title.trim();

  const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  return text.slice(0, 160);
}

/**
 * Determina el estado interactivo del elemento.
 * @param {HTMLElement} el
 * @returns {string}
 */
function resolveElementState(el) {
  const parts = [];
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
    parts.push('Deshabilitado.');
  }
  if (el.hasAttribute('required') || el.getAttribute('aria-required') === 'true') {
    parts.push('Obligatorio.');
  }
  if (el.getAttribute('aria-selected') === 'true') parts.push('Seleccionado.');
  if (el.getAttribute('aria-expanded') === 'true') parts.push('Expandido.');
  if (el.getAttribute('aria-expanded') === 'false') parts.push('Colapsado.');

  const selectedLabelAttr = el.getAttribute('data-selected-label');
  if (selectedLabelAttr?.trim()) {
    parts.push(`Seleccionado: ${selectedLabelAttr.trim()}.`);
  }

  if (el instanceof HTMLSelectElement) {
    const selectedOpt = el.selectedOptions?.[0]?.textContent?.trim();
    if (selectedOpt) parts.push(`Seleccionado: ${selectedOpt}.`);
  } else if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') {
      parts.push(el.checked ? 'Marcado.' : 'No marcado.');
    } else if (el.type === 'password') {
      parts.push(el.value ? 'Contraseña ingresada.' : 'Vacío.');
    } else {
      parts.push(el.value ? `Valor: ${el.value}.` : 'Vacío.');
    }
  }
  return parts.join(' ');
}

/**
 * Resuelve el prefijo de rol para controles interactivos críticos.
 * @param {HTMLElement} target
 * @returns {string}
 */
function resolveControlPrefix(target) {
  const tag = target.tagName.toLowerCase();
  const roleAttr = target.getAttribute('role') || '';

  if (roleAttr === 'combobox' || tag === 'select') return 'Menú desplegable';
  if (roleAttr === 'option') return 'Opción';
  if (roleAttr === 'tab') return 'Pestaña';
  if (tag === 'button' || roleAttr === 'button') return 'Botón';
  if (tag === 'a' || roleAttr === 'link') return 'Enlace';
  if (tag === 'textarea') return 'Área de texto';
  if (tag === 'input') {
    const type = target.getAttribute('type') || 'text';
    if (type === 'checkbox') return 'Casilla de verificación';
    if (type === 'radio') return 'Opción';
    if (type === 'password') return 'Campo de contraseña';
    return 'Campo de texto';
  }
  return '';
}

/**
 * Describe un elemento del DOM para verbalización en TalkBack.
 * @param {HTMLElement} element
 * @returns {{ phrase: string, element: HTMLElement, isInteractive: boolean } | null}
 */
export function describeElement(element) {
  const target = findAccessibleTarget(element);
  if (!target) return null;

  const rawName = resolveAccessibleName(target);
  const name = formatSpeechText(rawName);
  const state = resolveElementState(target);
  const isInteractive = Boolean(target.closest(INTERACTIVE_SELECTOR));
  const prefix = resolveControlPrefix(target);

  if (!prefix && !name && !state) return null;

  let phrase;
  if (prefix) {
    const main = name ? `${prefix}: ${name}` : prefix;
    phrase = state ? `${main}. ${state}` : main;
  } else {
    phrase = state ? `${name}. ${state}` : name;
  }

  return {
    phrase: phrase.replace(/\s+/g, ' ').trim(),
    element: target,
    isInteractive,
  };
}

/**
 * Recopila todos los elementos accesibles ordenados en la pantalla actual para navegación secuencial.
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
export function getAccessibleNavigationSequence(container) {
  if (!container) return [];
  const query =
    'h1, h2, h3, h4, [role="tab"], input, select, textarea, button, a[href], p, dt, dd, th, td, span';
  const nodes = Array.from(container.querySelectorAll(query));
  const seenParents = new Set();

  return nodes.filter((el) => {
    if (el.closest('[aria-hidden="true"], [data-accessibility-player="true"]')) return false;
    if (el.tagName.toLowerCase() === 'span') {
      if (el.closest('button, a, label, h1, h2, h3, h4, p, th, td')) return false;
      if (resolveKeyValuePairText(el)) {
        if (seenParents.has(el.parentElement)) return false;
        seenParents.add(el.parentElement);
      }
    }
    const rect = el.getBoundingClientRect();
    const hasSize = rect.width > 0 && rect.height > 0;
    const hasContent = Boolean(el.textContent?.trim() || el.getAttribute('aria-label'));
    return hasSize && hasContent;
  });
}

/**
 * Resumen general de la pantalla.
 * @param {HTMLElement} container
 * @returns {string}
 */
export function summarizeContainer(container) {
  if (!container) return 'Pantalla sin contenido disponible.';
  const heading = container.querySelector('h1, h2, h3');
  const headingText = heading ? resolveAccessibleName(heading) : 'Principal';
  const buttons = container.querySelectorAll('button:not([disabled])');
  const inputs = container.querySelectorAll('input, select, textarea');

  return `Pantalla: ${headingText}. Contiene ${inputs.length} campos de entrada y ${buttons.length} botones.`;
}
