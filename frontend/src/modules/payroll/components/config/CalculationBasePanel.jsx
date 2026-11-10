/**
 * @file CalculationBasePanel.jsx
 * @description Panel de parámetros base para cálculo de nómina mensual en Ecuador
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiHelpCircle } from 'react-icons/fi';

export const CalculationBasePanel = ({ workingDays, onWorkingDaysChange }) => {
  const inputClass =
    'w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors font-mono font-bold';
  const labelClass = 'block text-[11px] font-medium text-gray-600 mb-1';

  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden h-fit space-y-4 p-4 text-xs">
      <div className="border-b border-gray-100 pb-2">
        <h3 className="font-semibold text-gray-900 uppercase tracking-wider text-xs flex items-center justify-between">
          <span>Base de Cálculo Mensual</span>
          <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            30 Días / 240 Horas
          </span>
        </h3>
      </div>

      <div>
        <label className={labelClass}>Días Laborables Estándar por Mes</label>
        <input
          type="number"
          min="1"
          max="31"
          className={inputClass}
          style={{ fontVariantNumeric: 'tabular-nums' }}
          value={workingDays}
          onChange={(e) => onWorkingDaysChange(e.target.value)}
        />
        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
          <strong>Estándar Ecuatoriano: 30 días</strong> (Código del Trabajo Art. 82 e IESS). Se
          utiliza base 30 para liquidar sueldos regulares completos en todos los meses (febrero,
          meses de 31 días, etc.).
        </p>
      </div>

      <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2 text-[11px] text-gray-600 leading-relaxed">
        <div className="font-semibold text-gray-800 flex items-center gap-1">
          <FiHelpCircle className="text-blue-600" size={13} />
          Cálculo de Días y Fechas en Ecuador:
        </div>
        <ul className="space-y-1.5 list-disc pl-4 text-gray-600">
          <li>
            <strong>Mes Completo (30 días):</strong> Si el colaborador trabaja el mes entero sin
            faltas, cobra el 100% de su sueldo base pactado.
          </li>
          <li>
            <strong>Ingresos / Salidas proporcionales:</strong> Si entra a mitad de mes (ej. el
            día 15), se liquidan los días trabajados en base 30 (
            <span className="font-mono text-gray-800">Sueldo / 30 × Días</span>).
          </li>
          <li>
            <strong>Faltas injustificadas:</strong> Cada ausencia descuenta 1 día de labor (
            <span className="font-mono text-gray-800">Sueldo / 30</span>) más la fracción de
            descanso semanal.
          </li>
          <li>
            <strong>Valor Hora Ordinaria:</strong>{' '}
            <span className="font-mono text-gray-800">Sueldo / 240 horas</span> (30 días × 8
            horas).
          </li>
        </ul>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-[11px] text-gray-500 font-medium">Versionado Activo:</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Al guardar se genera una nueva versión activa para las próximas liquidaciones sin
          alterar nóminas ya cerradas o aprobadas.
        </p>
      </div>
    </div>
  );
};

export default CalculationBasePanel;
