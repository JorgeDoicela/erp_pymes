/**
 * @file DigitalMarkerClockHeader.jsx
 * @description Encabezado de reloj tabular, estado de credencial biométrica y modal de confirmación del marcador digital.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { MdFingerprint } from 'react-icons/md';
import Modal from '@core/ui/Modal';

export const DigitalMarkerClockHeader = ({
  currentTime,
  biometricEnabled,
  hasBiometricRegistered,
  message,
  showConfirm,
  actionLabel,
  onCancelConfirm,
  onAcceptConfirm,
}) => {
  return (
    <>
      <div className="mb-6 text-center">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Marcador Digital de Jornada
        </div>
        <div className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-gray-900 tabular-nums">
          {currentTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
        <div className="text-gray-500 mt-1 text-xs">
          {currentTime.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        {biometricEnabled && (
          <div
            className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium border ${
              hasBiometricRegistered === false
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <MdFingerprint
              className={`w-3.5 h-3.5 ${hasBiometricRegistered === false ? 'text-blue-600' : 'text-emerald-600'}`}
            />
            <span>
              {hasBiometricRegistered === false
                ? 'Autenticación Biométrica (Sin vincular en este equipo)'
                : 'Verificación biométrica activa'}
            </span>
          </div>
        )}
      </div>

      {message?.text && (
        <div className="w-full max-w-md mb-4">
          <div
            className={`px-3.5 py-2 rounded-[4px] text-center text-xs font-medium border ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : message.type === 'info'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-green-50 text-green-700 border-green-200'
            }`}
          >
            {message.text}
          </div>
          {message.showMapLink && message.lastCoords && (
            <div className="mt-1.5 flex justify-center gap-3">
              <a
                href={`https://www.google.com/maps?q=${message.lastCoords.latitude},${message.lastCoords.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                Ver ubicación en mapa (GPS)
              </a>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={Boolean(showConfirm)}
        onClose={onCancelConfirm}
        title={`Confirmar ${(actionLabel || '').charAt(0).toUpperCase() + (actionLabel || '').slice(1)}`}
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancelConfirm}
              className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onAcceptConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        }
      >
        <p className="text-xs text-gray-600">
          ¿Confirmas registrar tu {actionLabel} a las{' '}
          <strong className="text-gray-900 font-mono tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </strong>
          ?
        </p>
      </Modal>
    </>
  );
};

export default DigitalMarkerClockHeader;
