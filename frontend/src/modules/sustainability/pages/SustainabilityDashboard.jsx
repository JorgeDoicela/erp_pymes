/**
 * @file SustainabilityDashboard.jsx
 * @description Consola Operativa de Gobernanza ODS 8, Auditoría Multi-Módulo y Asistente RAG (Estándar Holded/Linear)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { useSustainabilityMetrics } from '../hooks/useSustainabilityMetrics.js';
import SustainabilityKPIGrid from '../components/SustainabilityKPIGrid.jsx';
import SustainabilityAIAdvisor from '../components/SustainabilityAIAdvisor.jsx';

export default function SustainabilityDashboard() {
  const { metrics, loading, error, refetch } = useSustainabilityMetrics();
  const [activeTab, setActiveTab] = useState('advisor');

  const ods = metrics?.ods || {};
  const erpContext = metrics?.erpContext || {};
  const overallScore = ods.overallScore ?? 100;
  const complianceLevel = ods.complianceLevel || 'ALTO';
  const indicatorsCount = Object.keys(ods.indicators || {}).length || 5;

  return (
    <div className="space-y-4">
      {/* Encabezado limpio estilo Holded / Linear */}
      <div className="bg-white border border-gray-200 rounded-[4px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-medium text-gray-500 uppercase tracking-wider">
            Gobernanza Legal, Contable y Sostenibilidad · Agenda 2030 (ODS 8)
          </span>
          <h1 className="text-lg font-semibold text-gray-900 mt-0.5">
            Centro de Inteligencia Normativa y Auditoría ODS 8
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Asistente RAG sobre Código del Trabajo, IESS, Tributación SRI, Contabilidad NIIF y
            monitoreo en vivo de indicadores.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right font-mono">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              Índice Global ODS 8 · {complianceLevel}
            </div>
            <div className="text-xl font-semibold text-gray-900 tabular-nums mt-0.5">
              {overallScore.toFixed(2)}%
            </div>
          </div>

          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            aria-label="Recalcular métricas"
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-[4px] flex items-center gap-1.5 transition-colors"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas con contadores tabulares */}
      <div className="border-b border-gray-200 flex items-center gap-6 px-1">
        <button
          type="button"
          onClick={() => setActiveTab('advisor')}
          className={`pb-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === 'advisor'
              ? 'border-[#111827] text-gray-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Asistente Jurídico y Contable RAG
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`pb-2.5 text-xs font-medium transition-colors border-b-2 font-mono tabular-nums ${
            activeTab === 'matrix'
              ? 'border-[#111827] text-gray-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Matriz de Indicadores ODS 8 ({indicatorsCount})
        </button>
      </div>

      {/* Estado de Error */}
      {error && (
        <div className="bg-white border border-gray-300 text-[#991b1b] px-4 py-3 rounded-[4px] text-xs font-mono">
          Error de diagnóstico: {error}
        </div>
      )}

      {/* Contenido Principal con Panel Lateral Compacto */}
      {activeTab === 'advisor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <div className="lg:col-span-3">
            <SustainabilityAIAdvisor />
          </div>

          {/* Columna lateral derecha compacta de 1 columna (Regla 5 estilos-erp-pymes) */}
          <aside className="bg-white border border-gray-200 rounded-[4px] p-4 space-y-4">
            <div className="border-b border-gray-100 pb-2.5">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                Telemetría en Vivo
              </span>
              <h2 className="text-xs font-semibold text-gray-900 mt-0.5">
                Contexto Transaccional del Tenant
              </h2>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <dt className="text-gray-500">Colaboradores Activos</dt>
                <dd className="font-mono font-semibold text-gray-900 tabular-nums">
                  {erpContext.totalActiveEmployees ?? 0}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <dt className="text-gray-500">Contratos Vigentes</dt>
                <dd className="font-mono font-semibold text-gray-900 tabular-nums">
                  {erpContext.employeesWithActiveContract ?? 0}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <dt className="text-gray-500">Sueldo Promedio</dt>
                <dd className="font-mono font-semibold text-gray-900 tabular-nums">
                  ${(erpContext.averageSalaryUsd ?? 0).toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <dt className="text-gray-500">SBU Referencia 2026</dt>
                <dd className="font-mono text-gray-700 tabular-nums">
                  ${(ods.sbuReferenceUsd ?? 460).toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <dt className="text-gray-500">Asientos Contables NIIF</dt>
                <dd className="font-mono font-semibold text-gray-900 tabular-nums">
                  {erpContext.totalJournalEntries ?? 0}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <dt className="text-gray-500">Períodos Contables Abiertos</dt>
                <dd className="font-mono font-semibold text-gray-900 tabular-nums">
                  {erpContext.openAccountingPeriods ?? 0}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <dt className="text-gray-500">Horas Extras (30d)</dt>
                <dd className="font-mono font-semibold text-gray-900 tabular-nums">
                  {(erpContext.overtimeHoursTracked30d ?? 0).toFixed(1)}h
                </dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-gray-500">Consentimiento LOPDP</dt>
                <dd className="font-mono font-semibold text-gray-900 tabular-nums">
                  {(erpContext.trackingConsentRate ?? 100).toFixed(1)}%
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      ) : (
        <SustainabilityKPIGrid indicators={ods.indicators} />
      )}
    </div>
  );
}
