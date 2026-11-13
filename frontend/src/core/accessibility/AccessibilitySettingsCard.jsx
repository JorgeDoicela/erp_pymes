/**
 * @file AccessibilitySettingsCard.jsx
 * @description Tarjeta de Configuración de Accesibilidad y Lectura por Voz para el Perfil de Usuario.
 * Permite activar o desactivar la funcionalidad de forma voluntaria e individual.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiVolume2, FiVolumeX, FiCheck, FiSliders } from 'react-icons/fi';
import { useAccessibility } from './AccessibilityContext';

export default function AccessibilitySettingsCard() {
  const {
    isSupported,
    isSpeechEnabled,
    setSpeechEnabled,
    voiceRate,
    setVoiceRate,
    selectedVoice,
    speak,
    isSpeaking,
    stop,
  } = useAccessibility();

  const handleTestVoice = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(
        'Asistencia por voz activada en Norma ERP. El sistema está listo para narrar la pantalla.'
      );
    }
  };

  return (
    <div className="bg-white rounded border border-gray-200 p-5 space-y-4">
      {/* Encabezado con Interruptor */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
              <FiVolume2 size={16} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">
              Asistencia por Voz y Lectura Accesible (TalkBack)
            </h3>
          </div>
          <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
            Habilita la narración audible de la interfaz y un reproductor flotante para leer el
            contenido de la pantalla. Viene desactivado por defecto y solo se activa para su cuenta.
          </p>
        </div>

        {/* Switch Toggle Accesible */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSpeechEnabled}
              onChange={(e) => setSpeechEnabled(e.target.checked)}
              disabled={!isSupported}
              className="sr-only peer"
              aria-label="Activar asistencia por voz y lectura accesible"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <span className="text-xs font-mono font-medium text-gray-700 w-16 text-right">
            {isSpeechEnabled ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {!isSupported && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          Su navegador actual no tiene habilitada la API de síntesis de voz del sistema operativo.
        </div>
      )}

      {/* Ajustes adicionales cuando está habilitado */}
      {isSpeechEnabled && isSupported && (
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Velocidad de narración:</span>
              <div className="flex items-center gap-1 font-mono">
                {[
                  { label: '0.8x (Lenta)', val: 0.8 },
                  { label: '1.0x (Normal)', val: 1.0 },
                  { label: '1.2x (Rápida)', val: 1.2 },
                  { label: '1.5x (Ágil)', val: 1.5 },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setVoiceRate(val)}
                    className={`px-2 py-1 rounded text-[11px] border transition-colors cursor-pointer ${
                      Math.abs(voiceRate - val) < 0.05
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestVoice}
              className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {isSpeaking ? (
                <>
                  <FiVolumeX size={13} className="text-red-600" />
                  <span>Detener Prueba</span>
                </>
              ) : (
                <>
                  <FiVolume2 size={13} className="text-blue-600" />
                  <span>Probar Voz</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono bg-gray-50 p-2.5 rounded border border-gray-200">
            <FiCheck className="text-emerald-600 shrink-0" size={13} />
            <span>
              Motor detectado:{' '}
              <strong className="text-gray-800">
                {selectedVoice?.name || 'Voz nativa del sistema'}
              </strong>{' '}
              ({selectedVoice?.lang || 'es-ES'})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
