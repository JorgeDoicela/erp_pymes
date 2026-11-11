/**
 * @file SustainabilityKPICard.jsx
 * @description Tarjeta individual sobria (Estándar Holded/Linear) para indicadores del ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export default function SustainabilityKPICard({
  code,
  label,
  value,
  unit,
  target,
  status,
  summary,
}) {
  const isCompliant = status === 'COMPLIANT';

  return (
    <div className="bg-white border border-gray-200 rounded-[4px] p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono font-medium text-gray-500 uppercase tracking-wider">
            Meta {code}
          </span>
          <span
            className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
              isCompliant ? 'text-[#166534]' : 'text-[#92400e]'
            }`}
          >
            {isCompliant ? 'CONFORME' : 'OBSERVADO'}
          </span>
        </div>
        <h4 className="text-xs font-semibold text-gray-900 mb-1 leading-tight">{label}</h4>
        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{summary}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold font-mono text-gray-900 tabular-nums">
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
          <span className="text-xs font-mono text-gray-500">{unit}</span>
        </div>
        <div className="text-[11px] font-mono text-gray-400 tabular-nums">
          Meta: {target}
          {unit}
        </div>
      </div>
    </div>
  );
}
