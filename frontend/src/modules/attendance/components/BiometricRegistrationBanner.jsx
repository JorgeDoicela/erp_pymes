/**
 * @file BiometricRegistrationBanner.jsx
 * @description Banner para enrolamiento rápido de credencial biométrica WebAuthn / Passkey en el dispositivo local.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { MdFingerprint } from 'react-icons/md';

export const BiometricRegistrationBanner = ({ registering, onRegister }) => {
  return (
    <div className="w-full max-w-md mb-5 p-4 bg-gray-50 border border-gray-200 rounded-[4px] text-xs space-y-2.5 text-gray-800">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-[4px] bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5 text-blue-700">
          <MdFingerprint className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-xs">Acceso Biométrico Rápido y Seguro</p>
          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
            Agiliza el registro de tu jornada utilizando la huella dactilar, FaceID o PIN seguro
            de tu dispositivo. Vincula tu credencial en un solo paso.
          </p>
        </div>
      </div>
      <button
        onClick={onRegister}
        disabled={registering}
        type="button"
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-[4px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        {registering ? (
          <span className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Esperando sensor biométrico del dispositivo...
          </span>
        ) : (
          <>
            <MdFingerprint className="w-4 h-4" />
            <span>Vincular Mi Huella / Passkey</span>
          </>
        )}
      </button>
    </div>
  );
};

export default BiometricRegistrationBanner;
