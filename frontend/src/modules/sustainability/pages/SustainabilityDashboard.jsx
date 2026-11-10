/**
 * @file SustainabilityDashboard.jsx
 * @description Tablero de Sostenibilidad ODS 8, Métricas de Trabajo Decente y Asistente RAG Ecuatoriano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useSustainabilityMetrics } from '../hooks/useSustainabilityMetrics.js';
import SustainabilityKPIGrid from '../components/SustainabilityKPIGrid.jsx';
import SustainabilityAIAdvisor from '../components/SustainabilityAIAdvisor.jsx';

export default function SustainabilityDashboard() {
  const { metrics, loading, error, refetch } = useSustainabilityMetrics();

  const ods = metrics?.ods || {};
  const overallScore = ods.overallScore ?? 100;
  const complianceLevel = ods.complianceLevel || 'ALTO';

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-[4px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-[3px]">
              Agenda ONU 2030
            </span>
            <span className="text-xs text-gray-400 font-mono">ODS 8</span>
          </div>
          <h1 className="text-lg font-bold text-gray-950 mt-1">
            Gobernanza de Sostenibilidad y Trabajo Decente (ODS 8)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitoreo programático de formalidad contractual, seguridad social (IESS) y derechos laborales en Ecuador.
          </p>
        </div>

        {/* Global Compliance Badge & Action */}
        <div className="flex items-center gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-[4px] px-3.5 py-2 text-right">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wide">
              Cumplimiento Global
            </div>
            <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-gray-950 tabular-nums">
                {overallScore.toFixed(1)}%
              </span>
              <span
                className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-[2px] border ${
                  complianceLevel === 'ALTO'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {complianceLevel}
              </span>
            </div>
          </div>

          <button
            onClick={refetch}
            disabled={loading}
            className="p-2.5 text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-[4px] transition-colors shadow-xs"
            title="Recalcular métricas ODS 8"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[4px] text-xs flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Indicadores Clave del ODS 8 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Indicadores Troncales de Sostenibilidad Laboral
          </h2>
          <span className="text-[11px] font-mono text-gray-400">
            Base: Legislación Vigente Ecuador 2026
          </span>
        </div>
        <SustainabilityKPIGrid indicators={ods.indicators} />
      </div>

      {/* Asistente RAG y Asesor Jurídico Ecuatoriano */}
      <SustainabilityAIAdvisor
        overallScore={overallScore}
        complianceLevel={complianceLevel}
      />
    </div>
  );
}
