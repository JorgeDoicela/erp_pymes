/**
 * @file talkBackInteractionManager.js
 * @description Gestor de interacción TalkBack: exploración al primer toque, ejecución al segundo toque,
 * deduplicación foco/clic, lectura de cambios en selectores y atajos de teclado globales.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import {
  describeElement,
  getAccessibleNavigationSequence,
  isInteractiveElement,
} from './semanticElementDescriptor.js';

const HIGHLIGHT_STYLE_ID = 'norma-accessibility-highlight-style';
const DOUBLE_TAP_TIMEOUT_MS = 3500;
const DEDUPE_SPEECH_WINDOW_MS = 120;

/**
 * Inyecta los estilos de resaltado de alto contraste para el elemento enfocado por TalkBack.
 */
export function ensureAccessibilityHighlightStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = HIGHLIGHT_STYLE_ID;
  style.innerHTML = `
    [data-talkback-active="true"] {
      outline: 3px solid #2563eb !important;
      outline-offset: 2px !important;
      border-radius: 4px !important;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25) !important;
      transition: outline 0.15s ease-in-out !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Limpia el resaltado visual anterior.
 */
export function clearCurrentHighlight() {
  if (typeof document === 'undefined') return;
  document
    .querySelectorAll('[data-talkback-active="true"]')
    .forEach((el) => el.removeAttribute('data-talkback-active'));
}

/**
 * Resalta visualmente un elemento en pantalla.
 * @param {HTMLElement} element
 */
export function highlightElement(element) {
  clearCurrentHighlight();
  if (element && element instanceof Element) {
    element.setAttribute('data-talkback-active', 'true');
  }
}

/**
 * Verifica si el evento ocurre dentro de controles propios de accesibilidad que no deben interceptarse.
 * @param {EventTarget|null} target
 * @returns {boolean}
 */
function isInternalAccessibilityControl(target) {
  if (!target || !(target instanceof Element)) return false;
  return Boolean(
    target.closest('[data-accessibility-player="true"], [data-accessibility-settings="true"]')
  );
}

/**
 * Controlador de eventos de toque, clic, foco y teclado en modo TalkBack.
 */
export class TalkBackController {
  constructor({ onSpeak, onActivate, onStop, onToggleSpeech }) {
    this.onSpeak = onSpeak;
    this.onActivate = onActivate;
    this.onStop = onStop;
    this.onToggleSpeech = onToggleSpeech;
    this.selectedElement = null;
    this.selectedTimestamp = 0;
    this.lastSpokenElement = null;
    this.lastSpokenTimestamp = 0;
    this.isBypassing = false;
  }

  reset() {
    this.selectedElement = null;
    this.selectedTimestamp = 0;
    clearCurrentHighlight();
  }

  /**
   * Verbaliza evitando doble disparo cuando focusin y click ocurren simultáneamente.
   * @param {HTMLElement} element
   * @param {string} phrase
   */
  speakDeduped(element, phrase) {
    if (!phrase || !this.onSpeak) return;
    const now = Date.now();
    if (
      this.lastSpokenElement === element &&
      now - this.lastSpokenTimestamp < DEDUPE_SPEECH_WINDOW_MS
    ) {
      return;
    }
    this.lastSpokenElement = element;
    this.lastSpokenTimestamp = now;
    this.onSpeak(phrase);
  }

  /**
   * Intercepta el clic y decide si es lectura previa o confirmación de activación.
   * @param {MouseEvent} e
   * @returns {boolean}
   */
  handleClick(e) {
    if (this.isBypassing || isInternalAccessibilityControl(e.target)) return false;

    // Si se hizo clic en el overlay exterior del modal, no cerrar accidentalmente sin confirmación
    if (e.target instanceof Element && e.target.getAttribute('role') === 'dialog') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.speakDeduped(e.target, 'Ventana modal activa');
      return true;
    }

    const desc = describeElement(e.target);
    if (!desc || !desc.element) return false;

    const target = desc.element;
    const now = Date.now();
    const isSameTarget = this.selectedElement === target;
    const isWithinTimeout = now - this.selectedTimestamp < DOUBLE_TAP_TIMEOUT_MS;

    if (desc.isInteractive && isSameTarget && isWithinTimeout) {
      this.reset();
      if (typeof target.focus === 'function') target.focus();
      if (this.onActivate) this.onActivate(desc);
      return false;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.selectedElement = target;
    this.selectedTimestamp = now;

    highlightElement(target);
    this.speakDeduped(target, desc.phrase);
    return true;
  }

  /**
   * Maneja el foco por teclado (Tab) sin interferir con el conteo de toques de clic.
   * @param {FocusEvent} e
   */
  handleFocusIn(e) {
    const target = e.target;
    if (!target || !(target instanceof Element)) return;
    if (isInternalAccessibilityControl(target)) return;

    highlightElement(target);
    const desc = describeElement(target);
    if (desc?.phrase) {
      this.speakDeduped(desc.element, desc.phrase);
    }
  }

  /**
   * Verbaliza cambios de valor en menús desplegables (<select>) o casillas.
   * @param {Event} e
   */
  handleChange(e) {
    const target = e.target;
    if (!target || !(target instanceof Element)) return;
    if (isInternalAccessibilityControl(target)) return;

    const desc = describeElement(target);
    if (desc?.phrase && this.onSpeak) {
      this.onSpeak(desc.phrase);
    }
  }

  /**
   * Maneja atajos de teclado de accesibilidad (Alt+V, Escape, Alt+Flechas, Enter).
   * @param {KeyboardEvent} e
   * @param {boolean} isSpeechEnabled
   */
  handleKeyDown(e, isSpeechEnabled) {
    if (e.altKey && (e.code === 'KeyV' || e.key?.toLowerCase() === 'v')) {
      e.preventDefault();
      if (this.onToggleSpeech) this.onToggleSpeech();
      return;
    }

    if (!isSpeechEnabled) return;

    if (e.key === 'Escape') {
      if (this.onStop) this.onStop();
      this.reset();
      return;
    }

    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      this.navigateStep('next');
      return;
    }

    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      this.navigateStep('prev');
      return;
    }

    if (
      e.key === 'Enter' &&
      this.selectedElement &&
      document.activeElement !== this.selectedElement
    ) {
      e.preventDefault();
      this.activateCurrent();
    }
  }

  /**
   * Navega secuencialmente al elemento siguiente o anterior.
   * @param {'next'|'prev'} direction
   */
  navigateStep(direction = 'next') {
    const container = document.querySelector('main') || document.body;
    const sequence = getAccessibleNavigationSequence(container);
    if (sequence.length === 0) return;

    const currentIndex = this.selectedElement ? sequence.indexOf(this.selectedElement) : -1;
    const nextIndex =
      direction === 'next'
        ? currentIndex + 1 >= sequence.length
          ? 0
          : currentIndex + 1
        : currentIndex <= 0
          ? sequence.length - 1
          : currentIndex - 1;

    const nextEl = sequence[nextIndex];
    if (!nextEl) return;

    this.selectedElement = nextEl;
    this.selectedTimestamp = Date.now();

    highlightElement(nextEl);
    if (typeof nextEl.scrollIntoView === 'function') {
      nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const desc = describeElement(nextEl);
    if (desc?.phrase) {
      this.speakDeduped(nextEl, desc.phrase);
    }
  }

  /**
   * Activa programáticamente el elemento seleccionado si es interactivo.
   */
  activateCurrent() {
    if (!this.selectedElement || !isInteractiveElement(this.selectedElement)) return;
    const target = this.selectedElement;
    this.reset();

    this.isBypassing = true;
    try {
      if (typeof target.focus === 'function') target.focus();
      target.click();
    } finally {
      this.isBypassing = false;
    }
  }
}
