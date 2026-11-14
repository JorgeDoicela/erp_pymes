/**
 * @file BenefitsTable.jsx
 * @description Pestañas, filtros y tabla principal de beneficios e incentivos.
 */

import React from 'react';

export const BENEFIT_STATUS_MAP = {
  ACTIVE: { label: 'PENDIENTE', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  PROCESSED: { label: 'PROCESADO', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  CANCELLED: { label: 'CANCELADO', cls: 'bg-gray-50 text-gray-700 border-gray-200' },
};

export const BENEFIT_TYPE_MAP = {
  BONUS: { label: 'Bono Imponible', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  COMMISSION: { label: 'Comisión', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  INCENTIVE: { label: 'Incentivo', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
  HEALTH: { label: 'Salud (Exento)', badge: 'bg-purple-50 text-purple-800 border-purple-200' },
  MEAL: { label: 'Alimentación (Exento)', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  TRANSPORT: { label: 'Movilización (Exento)', badge: 'bg-sky-50 text-sky-800 border-sky-200' },
  ALLOWANCE: { label: 'Viáticos de Comisión', badge: 'bg-gray-50 text-gray-700 border-gray-200' },
};

const TABS = [
  { key: 'ALL', label: 'Todos', countKey: 'total', countCls: 'text-gray-400' },
  { key: 'ACTIVE', label: 'Pendientes de Pago', countKey: 'active', countCls: 'text-emerald-600' },
  { key: 'PROCESSED', label: 'Procesados', countKey: 'processed', countCls: 'text-blue-600' },
  { key: 'CANCELLED', label: 'Cancelados', countKey: 'cancelled', countCls: 'text-gray-400' },
];

const inputClass =
  'w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors';

const BenefitsTable = ({
  benefits,
  stats,
  loading,
  activeTab,
  searchTerm,
  filterType,
  pagination,
  onTabChange,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  onFilterTypeChange,
  onPageChange,
  onOpenEdit,
  onOpenConfirmDeactivate,
}) => (
  <>
    <div className="flex items-center justify-between border-b border-gray-200 gap-4 overflow-x-auto">
      <div className="flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === t.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}{' '}
            <span className={`ml-1.5 font-mono text-[11px] ${t.countCls}`}>
              ({stats[t.countKey] || 0})
            </span>
          </button>
        ))}
      </div>
    </div>

    <div className="bg-white p-3 rounded border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
      <form
        onSubmit={onSearchSubmit}
        className="flex items-center gap-2 w-full sm:w-auto flex-grow max-w-md"
      >
        <input
          type="text"
          placeholder="Buscar por colaborador, cédula o concepto..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded shrink-0 cursor-pointer"
        >
          Buscar
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={onSearchClear}
            className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer shrink-0"
          >
            Limpiar
          </button>
        )}
      </form>

      <select
        value={filterType}
        onChange={(e) => onFilterTypeChange(e.target.value)}
        className={inputClass + ' sm:w-44'}
      >
        <option value="">Todas las categorías</option>
        <option value="BONUS">Bonos Imponibles (IESS)</option>
        <option value="COMMISSION">Comisiones de Venta (IESS)</option>
        <option value="INCENTIVE">Incentivos / Bienestar</option>
        <option value="HEALTH">Salud / Seguro Privado (Exento)</option>
        <option value="MEAL">Alimentación (Exento)</option>
        <option value="TRANSPORT">Movilización / Transporte</option>
        <option value="ALLOWANCE">Viáticos de Comisión</option>
      </select>
    </div>

    <div className="bg-white rounded border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Colaborador</th>
              <th className="py-2.5 px-4">Concepto / Detalle</th>
              <th className="py-2.5 px-4">Categoría</th>
              <th className="py-2.5 px-4">Frecuencia</th>
              <th className="py-2.5 px-4 text-right">Monto</th>
              <th className="py-2.5 px-4">Fecha Registro</th>
              <th className="py-2.5 px-4 text-center">Estado</th>
              <th className="py-2.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-400 text-xs">
                  Cargando registros de beneficios...
                </td>
              </tr>
            ) : benefits.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-12 text-center">
                  <p className="text-sm font-medium text-gray-700">Sin beneficios registrados</p>
                  <p className="text-xs text-gray-400 mt-1">
                    No se encontraron asignaciones con los filtros seleccionados.
                  </p>
                </td>
              </tr>
            ) : (
              benefits.map((b) => {
                const statusConfig = BENEFIT_STATUS_MAP[b.status] || BENEFIT_STATUS_MAP.ACTIVE;
                return (
                  <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-gray-900">
                        {b.employee?.firstName} {b.employee?.lastName}
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        {b.employee?.identityCard || 'C.I. S/N'} ·{' '}
                        {b.employee?.department || 'General'}
                      </p>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-gray-900">{b.name}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${BENEFIT_TYPE_MAP[b.type]?.badge || 'bg-gray-50 text-gray-700 border-gray-200'}`}
                      >
                        {BENEFIT_TYPE_MAP[b.type]?.label || b.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-500">
                      {b.frequency === 'ONE_TIME' ? 'Pago Único' : 'Recurrente'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900 tabular-nums">
                      ${Number(b.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-gray-500 tabular-nums">
                      {new Date(b.createdAt).toLocaleDateString('es-EC')}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${statusConfig.cls}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {b.status === 'ACTIVE' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEdit(b)}
                            className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onOpenConfirmDeactivate(b)}
                            className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px] font-mono">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && pagination.totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>
            Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total}{' '}
            registros)
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-2.5 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              Anterior
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-2.5 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  </>
);

export default BenefitsTable;
