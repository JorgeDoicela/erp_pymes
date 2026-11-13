/**
 * @file AccessibilityContext.jsx
 * @description Contexto Global de Accesibilidad y Lectura por Voz (TalkBack Asistido) para Norma ERP.
 * Gestiona de manera aislada las preferencias del usuario, sintetizador de voz nativo y reproducción.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEYS = {
  ENABLED: 'norma_accessibility_speech_enabled',
  RATE: 'norma_accessibility_speech_rate',
  PITCH: 'norma_accessibility_speech_pitch',
};

const AccessibilityContext = createContext(null);

export const AccessibilityProvider = ({ children }) => {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [isSpeechEnabled, setIsSpeechEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_KEYS.ENABLED) === 'true';
    } catch {
      return false;
    }
  });

  const [voiceRate, setVoiceRateState] = useState(() => {
    if (typeof window === 'undefined') return 1.0;
    try {
      const saved = parseFloat(localStorage.getItem(STORAGE_KEYS.RATE));
      return Number.isFinite(saved) && saved >= 0.7 && saved <= 1.8 ? saved : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTextSnippet, setCurrentTextSnippet] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const activeUtteranceRef = useRef(null);

  // Cargar y seleccionar la mejor voz en español del dispositivo
  const loadVoices = useCallback(() => {
    if (!isSupported) return;
    const voices = window.speechSynthesis.getVoices() || [];
    setAvailableVoices(voices);

    // Priorizar español: es-EC, es-419, es-ES, es-US, o cualquier voz que empiece por es
    const spanishVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('es'));
    const preferredVoice =
      spanishVoices.find((v) => /ecuador|latin|419/i.test(v.name || v.lang)) ||
      spanishVoices[0] ||
      voices.find((v) => v.default) ||
      voices[0] ||
      null;

    setSelectedVoice(preferredVoice);
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;
    loadVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported, loadVoices]);

  // Detener voz
  const stop = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignorar
    }
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentTextSnippet('');
  }, [isSupported]);

  // Alternar activación de la funcionalidad
  const setSpeechEnabled = useCallback(
    (enabled) => {
      const val = Boolean(enabled);
      setIsSpeechEnabled(val);
      try {
        localStorage.setItem(STORAGE_KEYS.ENABLED, String(val));
      } catch {
        // Ignorar
      }
      if (!val) {
        stop();
      }
    },
    [stop]
  );

  // Actualizar velocidad de habla
  const setVoiceRate = useCallback((rate) => {
    const validRate = Math.max(0.7, Math.min(1.8, Number(rate) || 1.0));
    setVoiceRateState(validRate);
    try {
      localStorage.setItem(STORAGE_KEYS.RATE, String(validRate));
    } catch {
      // Ignorar
    }
  }, []);

  // Sintetizar y hablar un texto
  const speak = useCallback(
    (textToSpeak) => {
      if (!isSupported || !isSpeechEnabled) return;
      if (!textToSpeak || typeof textToSpeak !== 'string' || !textToSpeak.trim()) return;

      stop();

      const cleanedText = textToSpeak
        .replace(/https?:\/\/\S+/gi, 'enlace web')
        .replace(/[#*_~`>[\]()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanedText) return;

      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        utterance.lang = selectedVoice?.lang || 'es-ES';
        utterance.rate = voiceRate;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
          setCurrentTextSnippet(cleanedText.slice(0, 60));
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentTextSnippet('');
          activeUtteranceRef.current = null;
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentTextSnippet('');
          activeUtteranceRef.current = null;
        };

        utterance.onpause = () => setIsPaused(true);
        utterance.onresume = () => setIsPaused(false);

        activeUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Error al invocar SpeechSynthesis:', err);
        stop();
      }
    },
    [isSupported, isSpeechEnabled, selectedVoice, voiceRate, stop]
  );

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    try {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } catch {
      // Ignorar
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    try {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } catch {
      // Ignorar
    }
  }, [isSupported, isPaused]);

  // Leer el contenido visible de la pantalla actual (etiqueta main o contenedor)
  const speakScreen = useCallback(() => {
    if (!isSupported || !isSpeechEnabled) return;

    if (isSpeaking && !isPaused) {
      pause();
      return;
    }
    if (isPaused) {
      resume();
      return;
    }

    const container = document.querySelector('main') || document.body;
    if (!container) return;

    // Clonar para limpiar elementos invisibles o no textuales
    const clone = container.cloneNode(true);
    clone.querySelectorAll('script, style, noscript, svg, [aria-hidden="true"]').forEach((el) => {
      el.remove();
    });

    const fullText = clone.innerText || clone.textContent || '';
    if (fullText.trim()) {
      speak(fullText);
    }
  }, [isSupported, isSpeechEnabled, isSpeaking, isPaused, pause, resume, speak]);

  return (
    <AccessibilityContext.Provider
      value={{
        isSupported,
        isSpeechEnabled,
        setSpeechEnabled,
        voiceRate,
        setVoiceRate,
        isSpeaking,
        isPaused,
        currentTextSnippet,
        selectedVoice,
        availableVoices,
        speak,
        pause,
        resume,
        stop,
        speakScreen,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility debe ser utilizado dentro de un AccessibilityProvider');
  }
  return ctx;
};

export default AccessibilityContext;
