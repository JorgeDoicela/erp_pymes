/**
 * @file voiceEngine.js
 * @description Selector y optimizador de voces naturales del sistema operativo para Norma ERP.
 * Prioriza voces neuronales de alta fidelidad sin requerir descargas externas de modelos.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

/**
 * Selecciona la voz en español más natural y humana disponible en el dispositivo.
 * @param {SpeechSynthesisVoice[]} voices
 * @returns {SpeechSynthesisVoice|null}
 */
export function selectOptimalSpanishVoice(voices = []) {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  // Filtrar voces de idioma español
  const spanish = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('es'));

  if (spanish.length === 0) {
    return voices.find((v) => v.default) || voices[0] || null;
  }

  // 1. Voces neuronales o naturales de Microsoft / Google / Apple
  const neuralVoice = spanish.find((v) =>
    /(natural|online|neural|sabina|jorge|monica|paulina|google.*español)/i.test(
      `${v.name} ${v.voiceURI || ''}`
    )
  );
  if (neuralVoice) return neuralVoice;

  // 2. Voces en español latinoamericano (es-EC, es-419, es-US, es-MX)
  const latamVoice = spanish.find((v) =>
    /(es-ec|es-419|es-us|es-mx|ecuador|latin)/i.test(`${v.lang} ${v.name}`)
  );
  if (latamVoice) return latamVoice;

  // 3. Voz española marcada como default
  const defaultSpanish = spanish.find((v) => v.default);
  if (defaultSpanish) return defaultSpanish;

  // 4. Primera voz española disponible
  return spanish[0];
}
