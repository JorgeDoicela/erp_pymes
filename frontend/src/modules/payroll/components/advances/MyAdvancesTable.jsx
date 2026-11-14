/**
 * @file MyAdvancesTable.jsx
 * @description Tabla responsiva del historial personal de anticipos y préstamos del colaborador.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

const STATUS_BADGE_MAP = {
  APPROVED: {
    label: 'APROBADO',
    cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  PENDING: {
    label: 'PENDIENTE',
    cls: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  PAID: {
    label: 'PAGADO',
    cls: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  REJECTED: {
    label: 'RECHAZADO',
    cls: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  CANCELLED: {
    label: 'CANCELADO',
    cls: 'bg-gray-50 text-gray-500 border-gray-200',
  },
};

export const renderAdvanceStatusBadge = (status) => {
  const cfg = STATUS_BADGE_MAP[status] || {
    label: status,
    cls: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

export const MyAdvancesTable = ({ advances, loading, error, onRetry, onCancel }) => {
  if (error) {
    return (
      <div className="p-8 text-center space-y-2">
        <p className="text-xs text-red-700 font-medium">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          Reintentar carga
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="block md:hidden divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-xs font-mono">
            Cargando solicitudes...
          </div>
        ) : advances.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            No has realizado ninguna solicitud de anticipo o préstamo aún.
          </div>
        ) : (
          advances.map((adv) => (
            <div key={adv.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 font-mono tabular-nums">
                  {new Date(adv.requestDate).toLocaleDateString('es-EC', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                {renderAdvanceStatusBadge(adv.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded border border-gray-200 font-mono tabular-nums">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                    Monto
                  </span>
                  <span className="font-bold text-gray-900">${adv.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                    Descuento Mensual
                  </span>
                  <span className="font-bold text-red-700">
                    -${adv.monthlyDeduction.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-500 font-mono tabular-nums text-[11px]">
                  Progreso: {adv.paidInstallments} / {adv.installments} cuotas
                </span>
                {adv.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => onCancel(adv.id)}
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left text-gray-600">
          <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200 tracking-wider">
            <tr>
              <th className="px-4 py-2.5">Fecha</th>
              <th className="px-4 py-2.5 text-right">Monto</th>
              <th className="px-4 py-2.5 text-center">Cuotas</th>
              <th className="px-4 py-2.5 text-right">Descuento Mensual</th>
              <th className="px-4 py-2.5 text-center">Progreso</th>
              <th className="px-4 py-2.5 text-center">Estado</th>
              <th className="px-4 py-2.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-400 font-mono">
                  Cargando solicitudes...
                </td>
              </tr>
            ) : advances.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-400 text-sm">
                  No has realizado ninguna solicitud de anticipo o préstamo aún.
                </td>
              </tr>
            ) : (
              advances.map((adv) => (
                <tr key={adv.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono tabular-nums text-gray-700">
                    {new Date(adv.requestDate).toLocaleDateString('es-EC', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-gray-900">
                    ${adv.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center font-mono tabular-nums text-xs">
                    {adv.installments} {adv.installments === 1 ? 'cuota' : 'cuotas'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-red-700">
                    -${adv.monthlyDeduction.toFixed(2)} / mes
                  </td>
                  <td className="px-4 py-3 text-center font-mono tabular-nums text-[11px] text-gray-600">
                    {adv.paidInstallments} de {adv.installments} pagadas
                  </td>
                  <td className="px-4 py-3 text-center">{renderAdvanceStatusBadge(adv.status)}</td>
                  <td className="px-4 py-3 text-center">
                    {adv.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => onCancel(adv.id)}
                        className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
