/**
 * @file MarkerActionButtons.jsx
 * @description Botones de acción del marcador de asistencia (Entrada, Almuerzo, Salida) con validación de candados.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiLock } from 'react-icons/fi';

export const MarkerActionButtons = ({
  status,
  recordData,
  loading,
  consentStatus,
  biometricEnabled,
  hasBiometricRegistered,
  onInitiateMark,
}) => {
  const isLocked = !consentStatus || (biometricEnabled && hasBiometricRegistered === false);

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
      {/* Botón de Entrada */}
      {(status === 'NOT_STARTED' || status === 'COMPLETED' || status === null) && (
        <button
          type="button"
          onClick={() => onInitiateMark('ENTRY')}
          disabled={loading || status === 'COMPLETED' || isLocked}
          className={`col-span-2 py-3 rounded-[4px] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            status === 'COMPLETED' || isLocked
              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLocked && <FiLock className="w-3.5 h-3.5" />}
          REGISTRAR ENTRADA
        </button>
      )}

      {/* Botones durante Jornada Activa */}
      {status === 'WORKING' && (
        <>
          {!recordData?.breakStart && (
            <button
              type="button"
              onClick={() => onInitiateMark('BREAK_START')}
              disabled={loading || isLocked}
              className={`py-3 rounded-[4px] font-semibold text-xs border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                isLocked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isLocked && <FiLock className="w-3.5 h-3.5" />}
              INICIAR ALMUERZO
            </button>
          )}
          <button
            type="button"
            onClick={() => onInitiateMark('EXIT')}
            disabled={loading || isLocked}
            className={`py-3 rounded-[4px] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              isLocked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } ${!recordData?.breakStart ? '' : 'col-span-2'}`}
          >
            {isLocked && <FiLock className="w-3.5 h-3.5" />}
            REGISTRAR SALIDA
          </button>
        </>
      )}

      {/* Botón durante Almuerzo */}
      {status === 'ON_BREAK' && (
        <button
          type="button"
          onClick={() => onInitiateMark('BREAK_END')}
          disabled={loading || (biometricEnabled && hasBiometricRegistered === false)}
          className={`col-span-2 py-3 rounded-[4px] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            biometricEnabled && hasBiometricRegistered === false
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          FINALIZAR ALMUERZO
        </button>
      )}
    </div>
  );
};

export default MarkerActionButtons;
