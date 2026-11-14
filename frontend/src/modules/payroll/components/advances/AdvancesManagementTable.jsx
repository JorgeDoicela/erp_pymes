/**
 * @file AdvancesManagementTable.jsx
 * @description Tabla administrativa, filtros por pestañas y barra de búsqueda de anticipos y préstamos.
 */

import React from 'react';

export const ADVANCE_STATUS_MAP = {
  APPROVED: { label: 'APROBADO', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  PENDING: { label: 'PENDIENTE', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  PAID: { label: 'PAGADO', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  REJECTED: { label: 'RECHAZADO', cls: 'bg-red-50 text-red-800 border-red-200' },
  CANCELLED: { label: 'CANCELADO', cls: 'bg-gray-50 text-gray-700 border-gray-200' },
};

const TABS = [
  { key: 'ALL', label: 'Todos', countKey: 'total', countCls: 'text-gray-400' },
  { key: 'PENDING', label: 'Por Revisar', countKey: 'pending', countCls: 'text-amber-700' },
  {
    key: 'APPROVED',
    label: 'Vigentes en Cobro',
    countKey: 'approved',
    countCls: 'text-emerald-600',
  },
  { key: 'PAID', label: 'Totalmente Pagados', countKey: 'paid', countCls: 'text-blue-600' },
  { key: 'REJECTED', label: 'Rechazados', countKey: 'rejected', countCls: 'text-red-600' },
];

const AdvancesManagementTable = ({
  advances,
  stats,
  loading,
  error,
  onRetry,
  activeTab,
  searchTerm,
  pagination,
  canMutate,
  onTabChange,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  onPageChange,
  onOpenApprove,
  onOpenReject,
  onOpenDetail,
}) => {
  const inputClass =
    'w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors';

  return (
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
            placeholder="Buscar por colaborador, cédula o motivo..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors shrink-0 cursor-pointer"
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
      </div>

      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Colaborador</th>
                <th className="py-2.5 px-4 text-right">Monto Total</th>
                <th className="py-2.5 px-4 text-center">Cuotas</th>
                <th className="py-2.5 px-4 text-right">Cuota Mensual</th>
                <th className="py-2.5 px-4 text-right">Amortizado</th>
                <th className="py-2.5 px-4 text-right">Saldo Restante</th>
                <th className="py-2.5 px-4">Fecha Solicitud</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-400 text-xs">
                    Cargando anticipos y préstamos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center space-y-2">
                    <p className="text-xs text-red-700 font-medium">{error}</p>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        Reintentar
                      </button>
                    )}
                  </td>
                </tr>
              ) : advances.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center">
                    <p className="text-sm font-medium text-gray-700">Sin solicitudes de anticipo</p>
                    <p className="text-xs text-gray-400 mt-1">
                      No se encontraron registros con los filtros actuales.
                    </p>
                  </td>
                </tr>
              ) : (
                advances.map((adv) => {
                  const statusConfig =
                    ADVANCE_STATUS_MAP[adv.status] || ADVANCE_STATUS_MAP.CANCELLED;
                  const remainingBalance = Math.max(0, (adv.amount || 0) - (adv.paidAmount || 0));

                  return (
                    <tr key={adv.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-gray-900">
                          {adv.employee?.firstName} {adv.employee?.lastName}
                        </p>
                        <p className="text-gray-400 text-[11px]">
                          {adv.employee?.identityCard || 'C.I. S/N'} ·{' '}
                          {adv.employee?.department || 'General'}
                        </p>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                        ${Number(adv.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-gray-600">
                        {adv.paidInstallments}/{adv.installments}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-red-700 tabular-nums">
                        −${Number(adv.monthlyDeduction || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-gray-600 tabular-nums">
                        ${Number(adv.paidAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900 tabular-nums">
                        ${Number(remainingBalance).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-gray-500 tabular-nums">
                        {new Date(adv.requestDate || adv.createdAt).toLocaleDateString('es-EC')}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${statusConfig.cls}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {adv.status === 'PENDING' && canMutate ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenApprove(adv)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => onOpenReject(adv)}
                              className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenDetail(adv)}
                            className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                          >
                            Detalles
                          </button>
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
};

export default AdvancesManagementTable;
