/**
 * @file EmployeeHelpers.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiLock } from 'react-icons/fi';
import MaskedText from '@core/ui/MaskedText';
export { EmptyState } from '@core/ui/EmptyState';
export { InputField } from '@core/ui/InputField';
export { SelectField } from '@core/ui/SelectField';

// Detecta si un valor parece ser texto cifrado (hex largo con ':') que nunca se desencriptó
const looksEncrypted = (val) => {
  if (!val || typeof val !== 'string') return false;
  const parts = val.split(':');
  return parts.length === 4 && parts.every((p) => /^[0-9a-f]{10,}/i.test(p));
};

const sanitize = (value, isPrivate) => {
  if (value === null || value === undefined || value === '') {
    return isPrivate ? null : 'N/A';
  }
  if (looksEncrypted(String(value))) return null;
  return value;
};

export const InfoItem = ({ label, value, isPrivate, isMasked }) => {
  const display = sanitize(value, isPrivate);
  return (
    <div className="bg-gray-50/60 p-3 rounded border border-gray-200">
      <label className="text-[11px] text-gray-500 uppercase font-semibold tracking-wider block mb-1">
        {label}{' '}
        {isPrivate && (
          <span className="text-amber-800 ml-1 text-[10px] bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
            PRIVADO
          </span>
        )}
      </label>
      {display !== null ? (
        isMasked ? (
          <div
            className="text-xs font-semibold text-gray-900 font-mono"
            style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
          >
            <MaskedText value={display} label={label.toLowerCase()} />
          </div>
        ) : (
          <p
            className="text-xs font-semibold text-gray-900 font-mono"
            style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
          >
            {display}
          </p>
        )
      ) : (
        <p className="text-xs font-medium text-gray-400 italic flex items-center gap-1">
          <FiLock size={12} className="text-gray-400" />
          {isPrivate ? 'No registrado' : 'N/A'}
        </p>
      )}
    </div>
  );
};

export const getLevelColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'expert':
      return 'bg-green-50 text-green-800 border border-green-200';
    case 'advanced':
      return 'bg-blue-50 text-blue-800 border border-blue-200';
    case 'intermediate':
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};
