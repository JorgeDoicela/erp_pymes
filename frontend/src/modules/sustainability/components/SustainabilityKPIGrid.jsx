/**
 * @file SustainabilityKPIGrid.jsx
 * @description Tabla operativa y grilla de auditoría para las 5 métricas troncales del ODS 8 (Estándar Holded/Linear)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export default function SustainabilityKPIGrid({ indicators = {} }) {
  const rows = [
    { weight: '25%', ...(indicators.formalContractRate || {}) },
    { weight: '25%', ...(indicators.socialSecurityCoverage || {}) },
    { weight: '20%', ...(indicators.salaryEquitabilityIndex || {}) },
    { weight: '15%', ...(indicators.overtimeCompensationRatio || {}) },
    { weight: '15%', ...(indicators.verifiedLegalSettlements || {}) },
  ].filter((r) => r.code);

  return (
    <div className="bg-white border border-gray-200 rounded-[4px] overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            <th className="py-2.5 px-4">Código ONU</th>
            <th className="py-2.5 px-4">Indicador de Cumplimiento</th>
            <th className="py-2.5 px-4">Evidencia Auditada en el Sistema</th>
            <th className="py-2.5 px-4 text-right">Peso</th>
            <th className="py-2.5 px-4 text-right">Meta</th>
            <th className="py-2.5 px-4 text-right">Valor Actual</th>
            <th className="py-2.5 px-4 text-right">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
          {rows.map((item) => {
            const isCompliant = item.status === 'COMPLIANT';
            return (
              <tr key={item.code} className="hover:bg-gray-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-semibold text-gray-900 whitespace-nowrap tabular-nums">
                  ODS {item.code}
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">{item.label}</td>
                <td className="py-3 px-4 text-gray-500">{item.summary}</td>
                <td className="py-3 px-4 text-right font-mono text-gray-500 tabular-nums">
                  {item.weight}
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-500 tabular-nums">
                  {item.target}
                  {item.unit === 'ratio' ? '' : item.unit}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                  {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
                  {item.unit === 'ratio' ? '' : item.unit}
                </td>
                <td className="py-3 px-4 text-right font-mono text-[11px] font-semibold whitespace-nowrap">
                  <span className={isCompliant ? 'text-[#166534]' : 'text-[#92400e]'}>
                    {isCompliant ? 'CONFORME' : 'OBSERVADO'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
