/**
 * @file AccessibilityContext.jsx
 * @description Contexto Global de Accesibilidad y TalkBack Asistido para Norma ERP.
 * Incluye navegación semántica interactiva, confirmación al segundo toque y atajo global Alt+V.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { selectOptimalSpanishVoice } from './voiceEngine.js';
import { summarizeContainer } from './semanticElementDescriptor.js';
import {
  TalkBackController,
  ensureAccessibilityHighlightStyles,
  clearCurrentHighlight,
} from './talkBackInteractionManager.js';

const STORAGE_KEYS = {
  ENABLED: 'norma_accessibility_speech_enabled',
  RATE: 'norma_accessibility_speech_rate',
};

const AccessibilityContext = createContext(null);

function readInitialEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEYS.ENABLED) === 'true';
  } catch {
    return false;
  }
}

function readInitialRate() {
  if (typeof window === 'undefined') return 1.0;
  try {
    const saved = parseFloat(localStorage.getItem(STORAGE_KEYS.RATE));
    return Number.isFinite(saved) && saved >= 0.7 && saved <= 1.8 ? saved : 1.0;
  } catch {
    return 1.0;
  }
}

export const AccessibilityProvider = ({ children }) => {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [isSpeechEnabled, setIsSpeechEnabled] = useState(readInitialEnabled);
  const [voiceRate, setVoiceRateState] = useState(readInitialRate);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTextSnippet, setCurrentTextSnippet] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const activeUtteranceRef = useRef(null);
  const controllerRef = useRef(null);

  const loadVoices = useCallback(() => {
    if (!isSupported) return;
    const voices = window.speechSynthesis.getVoices() || [];
    setAvailableVoices(voices);
    setSelectedVoice(selectOptimalSpanishVoice(voices));
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

  const speak = useCallback(
    (textToSpeak, options = {}) => {
      if (!isSupported || (!isSpeechEnabled && !options.force)) return;
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
        if (selectedVoice) utterance.voice = selectedVoice;
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
        utterance.onerror = utterance.onend;
        utterance.onpause = () => setIsPaused(true);
        utterance.onresume = () => setIsPaused(false);

        activeUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch {
        stop();
      }
    },
    [isSupported, isSpeechEnabled, selectedVoice, voiceRate, stop]
  );

  const setSpeechEnabled = useCallback(
    (enabled, announceChange = false) => {
      const val = Boolean(enabled);
      setIsSpeechEnabled(val);
      try {
        localStorage.setItem(STORAGE_KEYS.ENABLED, String(val));
      } catch {
        // Ignorar
      }
      if (!val) {
        stop();
        clearCurrentHighlight();
        if (controllerRef.current) controllerRef.current.reset();
        if (announceChange) speak('Asistencia por voz desactivada.', { force: true });
      } else if (announceChange) {
        speak('Asistencia por voz activada.', { force: true });
      }
    },
    [stop, speak]
  );

  const setVoiceRate = useCallback((rate) => {
    const validRate = Math.max(0.7, Math.min(1.8, Number(rate) || 1.0));
    setVoiceRateState(validRate);
    try {
      localStorage.setItem(STORAGE_KEYS.RATE, String(validRate));
    } catch {
      // Ignorar
    }
  }, []);

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

  useEffect(() => {
    controllerRef.current = new TalkBackController({
      onSpeak: (phrase) => speak(phrase),
      onActivate: (desc) => speak(`Activando ${desc.phrase.split(':')[0] || 'control'}...`),
      onStop: () => stop(),
      onToggleSpeech: () => setSpeechEnabled(!isSpeechEnabled, true),
    });
  }, [speak, stop, setSpeechEnabled, isSpeechEnabled]);

  useEffect(() => {
    if (!isSupported) return;
    const onKeyDown = (e) => controllerRef.current?.handleKeyDown(e, isSpeechEnabled);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSupported, isSpeechEnabled]);

  useEffect(() => {
    if (!isSupported || !isSpeechEnabled) {
      clearCurrentHighlight();
      return;
    }
    ensureAccessibilityHighlightStyles();
    const onClick = (e) => controllerRef.current?.handleClick(e);
    const onFocusIn = (e) => controllerRef.current?.handleFocusIn(e);
    const onChange = (e) => controllerRef.current?.handleChange(e);

    window.addEventListener('click', onClick, true);
    document.addEventListener('focusin', onFocusIn, { passive: true });
    document.addEventListener('change', onChange, { passive: true });

    return () => {
      window.removeEventListener('click', onClick, true);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('change', onChange);
      clearCurrentHighlight();
    };
  }, [isSupported, isSpeechEnabled]);

  const navigateNext = useCallback(() => controllerRef.current?.navigateStep('next'), []);
  const navigatePrev = useCallback(() => controllerRef.current?.navigateStep('prev'), []);
  const activateCurrent = useCallback(() => controllerRef.current?.activateCurrent(), []);

  const speakScreen = useCallback(() => {
    if (!isSupported || !isSpeechEnabled) return;
    if (isSpeaking && !isPaused) return pause();
    if (isPaused) return resume();
    speak(summarizeContainer(document.querySelector('main') || document.body));
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
        navigateNext,
        navigatePrev,
        activateCurrent,
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
