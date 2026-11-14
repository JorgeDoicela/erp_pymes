/**
 * @file PayrollHistoryTable.jsx
 * @description Tabla del historial general de períodos de nómina procesados.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import ExportButtons from '@core/ui/ExportButtons';
import { Button } from '@core/ui';

export const PAYROLL_STATUS_MAP = {
  APPROVED: { label: 'Aprobado', cls: 'text-green-800 bg-transparent border-green-300' },
  PAID: { label: 'Pagado', cls: 'text-blue-800 bg-transparent border-blue-300' },
  DRAFT: { label: 'Borrador', cls: 'text-amber-800 bg-transparent border-amber-300' },
};

export const PayrollHistoryTable = ({ payrolls, loading, error, onRetry, onViewDetail }) => (
  <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Historial de Períodos</h2>
        <p className="text-xs text-gray-400">
          Seleccione un período para auditar roles individuales o generar comprobantes
        </p>
      </div>
      <ExportButtons
        data={payrolls}
        columns={[
          { header: 'Período', key: 'period' },
          { header: 'Estado', key: 'status' },
          { header: 'Total Empleados', key: 'totalEmployees' },
          { header: 'Total Nómina ($)', key: 'totalNet' },
          { header: 'Fecha Generación', key: 'createdAt' },
        ]}
        fileName="historial-nominas-norma"
        title="HISTORIAL GENERAL DE NÓMINAS"
      />
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs text-gray-700">
        <thead className="bg-gray-50/60 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider select-none">
          <tr>
            <th className="py-2.5 px-4">Período</th>
            <th className="py-2.5 px-4 text-center">Estado</th>
            <th className="py-2.5 px-4 text-center">Colaboradores</th>
            <th className="py-2.5 px-4 text-right">Total Neto</th>
            <th className="py-2.5 px-4 text-center">Contabilidad</th>
            <th className="py-2.5 px-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan="6" className="p-8 text-center text-gray-400 text-xs font-mono">
                Cargando historial de nóminas...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan="6" className="p-8 text-center space-y-2">
                <p className="text-xs text-red-700 font-medium">{error}</p>
                <Button variant="secondary" onClick={onRetry}>
                  Reintentar
                </Button>
              </td>
            </tr>
          ) : payrolls.length === 0 ? (
            <tr>
              <td colSpan="6" className="p-12 text-center text-gray-400 text-xs">
                No se han procesado nóminas en esta empresa. Presione &quot;+ Nueva Nómina&quot;
                para iniciar.
              </td>
            </tr>
          ) : (
            payrolls.map((p) => {
              const st = PAYROLL_STATUS_MAP[p.status] || PAYROLL_STATUS_MAP.DRAFT;
              return (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-mono tabular-nums font-medium text-gray-900">
                    {p.period}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono tabular-nums">
                    {p.totalEmployees || 0}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                    ${Number(p.totalNet || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {p.journalEntryId ? (
                      <span className="text-blue-700 font-mono tabular-nums text-[11px] font-medium">
                        Asiento #{p.journalEntryId.substring(0, 8)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">Pendiente</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <Button variant="table" onClick={() => onViewDetail(p.id)}>
                      Ver Detalle
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);
