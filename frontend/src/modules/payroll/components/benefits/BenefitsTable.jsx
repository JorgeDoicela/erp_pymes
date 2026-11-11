/**
 * @file BenefitsTable.jsx
 * @description Tabla desktop y vista de tarjetas mobile para gestión de beneficios de nómina
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { Button } from '@core/ui';

const STATUS_MAP = {
  ACTIVE: { label: 'PENDIENTE', cls: 'text-emerald-800 border-emerald-300' },
  PROCESSED: { label: 'PROCESADO', cls: 'text-blue-800 border-blue-300' },
  CANCELLED: { label: 'CANCELADO', cls: 'text-gray-500 border-gray-200' },
};

const TYPE_MAP = {
  BONUS: { label: 'Bono Imponible' },
  COMMISSION: { label: 'Comisión Ventas' },
  INCENTIVE: { label: 'Incentivo' },
  HEALTH: { label: 'Salud / Seguro (Exento)' },
  MEAL: { label: 'Alimentación (Exento)' },
  TRANSPORT: { label: 'Movilización (Exento)' },
  ALLOWANCE: { label: 'Viático Comisión' },
};

export const BenefitsTable = ({ benefits = [], loading = false, onEdit, onCancel }) => {
  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400 text-xs">
        Cargando listado de beneficios y bonificaciones...
      </div>
    );
  }

  if (benefits.length === 0) {
    return (
      <div className="p-12 text-center text-gray-400 text-xs">
        No se encontraron beneficios o bonificaciones asignadas para este filtro.
      </div>
    );
  }

  return (
    <>
      {/* Vista Móvil: Tarjetas compactas */}
      <div className="block md:hidden divide-y divide-gray-100">
        {benefits.map((b) => {
          const st = STATUS_MAP[b.status] || STATUS_MAP.ACTIVE;
          const tp = TYPE_MAP[b.type] || { label: b.type };

          return (
            <div key={b.id} className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900 text-xs">
                    {b.employee?.firstName} {b.employee?.lastName}
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono">
                    {b.employee?.department || 'General'} · {b.employee?.position || 'Colaborador'}
                  </p>
                </div>
                <span className="font-mono font-semibold text-xs text-gray-900 tabular-nums">
                  ${Number(b.amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50/50 p-2 rounded border border-gray-100">
                <span>{b.name}</span>
                <span className="text-[11px] text-gray-500 font-medium">{tp.label}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border bg-transparent ${st.cls}`}
                >
                  {st.label}
                </span>
                <div className="flex gap-1.5">
                  {b.status === 'ACTIVE' && (
                    <>
                      <Button variant="table" onClick={() => onEdit(b)}>
                        Editar
                      </Button>
                      <button
                        type="button"
                        onClick={() => onCancel(b)}
                        className="border border-red-200 text-red-600 hover:bg-red-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vista Desktop: Tabla limpia */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs text-gray-700">
          <thead className="bg-gray-50/60 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider select-none">
            <tr>
              <th className="py-2.5 px-4">Colaborador</th>
              <th className="py-2.5 px-4">Concepto</th>
              <th className="py-2.5 px-4">Categoría Legal</th>
              <th className="py-2.5 px-4 text-center">Frecuencia</th>
              <th className="py-2.5 px-4 text-right">Monto</th>
              <th className="py-2.5 px-4 text-center">Estado</th>
              <th className="py-2.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {benefits.map((b) => {
              const st = STATUS_MAP[b.status] || STATUS_MAP.ACTIVE;
              const tp = TYPE_MAP[b.type] || { label: b.type };

              return (
                <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-2.5 px-4">
                    <p className="font-medium text-gray-900">
                      {b.employee?.firstName} {b.employee?.lastName}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {b.employee?.department || 'General'} ·{' '}
                      {b.employee?.position || 'Colaborador'}
                    </p>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-gray-800">{b.name}</td>
                  <td className="py-2.5 px-4 text-gray-600">{tp.label}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-[11px] text-gray-500">
                    {b.frequency === 'RECURRING' ? 'Recurrente' : 'Único'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                    ${Number(b.amount || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border bg-transparent ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      {b.status === 'ACTIVE' ? (
                        <>
                          <Button variant="table" onClick={() => onEdit(b)}>
                            Editar
                          </Button>
                          <button
                            type="button"
                            onClick={() => onCancel(b)}
                            className="border border-red-200 text-red-600 hover:bg-red-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-[11px] italic">Sin acciones</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default BenefitsTable;
