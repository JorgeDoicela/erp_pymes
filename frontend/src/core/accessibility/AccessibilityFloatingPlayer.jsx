/**
 * @file AccessibilityFloatingPlayer.jsx
 * @description Reproductor Flotante de Asistencia por Voz (TalkBack Asistido).
 * Incluye controles de navegación secuencial por componentes (Anterior/Siguiente) y lectura de pantalla.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FiVolume2,
  FiPlay,
  FiPause,
  FiSquare,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';
import { useAccessibility } from './AccessibilityContext';

export default function AccessibilityFloatingPlayer() {
  const {
    isSpeechEnabled,
    isSpeaking,
    isPaused,
    currentTextSnippet,
    voiceRate,
    setVoiceRate,
    speakScreen,
    navigateNext,
    navigatePrev,
    stop,
  } = useAccessibility();

  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    stop();
  }, [location.pathname, stop]);

  if (!isSpeechEnabled) return null;

  return (
    <div
      role="region"
      aria-label="Controles de asistencia por voz"
      data-accessibility-player="true"
      className="fixed bottom-5 left-4 sm:left-6 md:left-[280px] z-40 bg-white border border-gray-300 rounded-[4px] shadow-md transition-all duration-200 select-none pointer-events-auto"
    >
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        {/* Navegación al elemento anterior */}
        <button
          type="button"
          onClick={navigatePrev}
          aria-label="Elemento anterior"
          className="p-1.5 rounded-[3px] text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-colors flex items-center justify-center cursor-pointer"
          title="Elemento anterior"
        >
          <FiChevronLeft size={14} />
        </button>

        {/* Reproducir / Pausar lectura de pantalla */}
        <button
          type="button"
          onClick={speakScreen}
          aria-label={
            isSpeaking && !isPaused
              ? 'Pausar lectura de pantalla'
              : isPaused
                ? 'Reanudar lectura de pantalla'
                : 'Leer pantalla actual en voz alta'
          }
          className="p-1.5 rounded-[3px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center cursor-pointer"
          title={isSpeaking && !isPaused ? 'Pausar lectura' : 'Leer contenido de la pantalla'}
        >
          {isSpeaking && !isPaused ? (
            <FiPause size={14} className="text-blue-700" />
          ) : isPaused ? (
            <FiPlay size={14} className="text-blue-700 ml-0.5" />
          ) : (
            <FiVolume2 size={14} className="text-blue-700" />
          )}
        </button>

        {/* Navegación al elemento siguiente */}
        <button
          type="button"
          onClick={navigateNext}
          aria-label="Elemento siguiente"
          className="p-1.5 rounded-[3px] text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-colors flex items-center justify-center cursor-pointer"
          title="Elemento siguiente"
        >
          <FiChevronRight size={14} />
        </button>

        {/* Título de estado */}
        <div className="text-left min-w-[85px] max-w-[130px] ml-1">
          <div className="text-[11px] font-semibold text-gray-900 leading-none truncate">
            {isSpeaking ? (isPaused ? 'Pausado' : 'Leyendo...') : 'Voz Asistida'}
          </div>
          <div className="text-[9px] font-mono text-gray-500 mt-0.5 truncate tabular-nums">
            {isSpeaking
              ? currentTextSnippet || 'Reproduciendo'
              : `Velocidad ${voiceRate.toFixed(1)}x`}
          </div>
        </div>

        {/* Detener */}
        {isSpeaking && (
          <button
            type="button"
            onClick={stop}
            aria-label="Detener lectura"
            className="p-1.5 rounded-[3px] text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
            title="Detener lectura"
          >
            <FiSquare size={12} />
          </button>
        )}

        {/* Expandir controles */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? 'Ocultar ajustes de voz' : 'Mostrar ajustes de voz'}
          className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
          title="Velocidad y controles"
        >
          {isExpanded ? <FiChevronDown size={14} /> : <FiChevronUp size={14} />}
        </button>
      </div>

      {/* Panel Desplegable de Velocidad */}
      {isExpanded && (
        <div className="px-3 pb-2.5 pt-1 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
          <span className="text-[10px] text-gray-500 font-medium">Velocidad:</span>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            {[0.8, 1.0, 1.2, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setVoiceRate(rate)}
                className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                  Math.abs(voiceRate - rate) < 0.05
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {rate.toFixed(1)}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
