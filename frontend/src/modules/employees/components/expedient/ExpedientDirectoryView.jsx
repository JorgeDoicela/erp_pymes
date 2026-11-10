/**
 * @file ExpedientDirectoryView.jsx
 * @description Directorio general de expedientes digitales con filtros de completitud y buscador.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiRefreshCw, FiUploadCloud } from 'react-icons/fi';

export const ExpedientDirectoryView = ({
  stats,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  departmentFilter,
  setDepartmentFilter,
  departments = [],
  filteredEmployees = [],
  directoryLoading,
  onRefresh,
  onOpenUploadModal,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header Limpio del Directorio */}
      <div className="bg-white p-5 rounded-[4px] border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">
              Gestión de Capital Humano
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              Expedientes Digitales
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Expedientes Digitales de Personal
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Supervisa el cumplimiento de contratos, cédulas y documentos legales de todos los
            colaboradores.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={directoryLoading}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded-[4px] transition-colors cursor-pointer bg-white flex items-center gap-1.5"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${directoryLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FiUploadCloud className="w-3.5 h-3.5" />
            <span>Adjuntar Documento</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Filtro con Contadores Tabulares + Buscador */}
      <div className="bg-white border border-gray-200 rounded-[4px] p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6 border-b border-gray-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Todos{' '}
              <span className="font-mono tabular-nums text-gray-400">
                ({stats.totalEmployees})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING_REVIEW')}
              className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'PENDING_REVIEW'
                  ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Por Validar{' '}
              <span
                className={`font-mono tabular-nums ${stats.pendingReviewsGlobal > 0 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}
              >
                ({stats.pendingReviewsGlobal})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INCOMPLETE')}
              className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'INCOMPLETE'
                  ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Incompletos{' '}
              <span className="font-mono tabular-nums text-gray-400">
                ({stats.incompleteCount})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETE')}
              className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'COMPLETE'
                  ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Completos{' '}
              <span className="font-mono tabular-nums text-gray-400">
                ({stats.completeCount})
              </span>
            </button>
          </div>

          {/* Filtros de Búsqueda y Departamento */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-2 text-gray-400" size={13} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, cédula o cargo..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-[4px] text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-700 text-xs font-medium cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-white border border-gray-200 text-xs text-gray-800 rounded-[4px] px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">Todos los Departamentos</option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de Expedientes Directa */}
        <div className="border border-gray-200 rounded-[4px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Colaborador</th>
                  <th className="py-2.5 px-4">C.I. / DNI</th>
                  <th className="py-2.5 px-4">Departamento y Cargo</th>
                  <th className="py-2.5 px-4 w-44">Completitud</th>
                  <th className="py-2.5 px-4">Aprobados</th>
                  <th className="py-2.5 px-4">Por Validar</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {directoryLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-400 font-mono text-xs">
                      Cargando expedientes de colaboradores...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-400 text-xs">
                      No se encontraron colaboradores con los criterios especificados.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-semibold text-gray-900">
                        {emp.fullName}
                        <p className="text-[11px] font-normal text-gray-400">{emp.email}</p>
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-gray-700">
                        {emp.identityCard}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-gray-900 font-medium">{emp.position}</span>
                        <p className="text-[11px] text-gray-400">{emp.department}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums mb-1">
                          <span>{emp.completionPercentage}%</span>
                          <span className="text-gray-400">
                            {emp.verifiedRequired}/{emp.totalRequired}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-[2px] overflow-hidden border border-gray-200">
                          <div
                            className="bg-gray-800 h-full rounded-[2px]"
                            style={{ width: `${emp.completionPercentage}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-emerald-700 font-semibold">
                        {emp.verifiedCount}
                      </td>
                      <td className="py-2.5 px-4">
                        {emp.pendingReviewCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                            {emp.pendingReviewCount} pendiente
                            {emp.pendingReviewCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/expedientes/${emp.id}`)}
                          className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          Ver Expediente →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpedientDirectoryView;
