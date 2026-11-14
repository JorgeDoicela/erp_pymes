/**
 * @file PayrollDetailsTable.jsx
 * @description Tabla y vista móvil de detalle de nómina individual por colaborador
 */

import React from 'react';
import { generatePayslipPDF } from '../utils/generatePayslipPDF';

const SIG_STATUS_MAP = {
  SIGNED: { label: 'Firmado', cls: 'text-emerald-800 bg-transparent border-emerald-300' },
  PENDING: { label: 'Pendiente', cls: 'text-amber-800 bg-transparent border-amber-300' },
  DISPUTED: { label: 'Observado', cls: 'text-red-800 bg-transparent border-red-300' },
};

const sumItems = (raw) => {
  const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw || [];
  return arr.reduce((a, b) => a + (Number(b.amount) || 0), 0);
};

const ActionButtons = ({ det, payroll, readOnly, onEditDetail }) => (
  <>
    {payroll.status === 'DRAFT' && !readOnly && (
      <button
        type="button"
        onClick={() => onEditDetail(det)}
        className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded cursor-pointer"
      >
        Editar
      </button>
    )}
    <button
      type="button"
      onClick={() =>
        generatePayslipPDF(det, det.employee, payroll.period, { isPhysicalPrint: false })
      }
      className="border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs px-2 py-1 rounded cursor-pointer"
      title="Descargar Rol Digital (con sellos electrónicos y QR)"
    >
      PDF Digital
    </button>
    <button
      type="button"
      onClick={() =>
        generatePayslipPDF(det, det.employee, payroll.period, { isPhysicalPrint: true })
      }
      className="border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 text-xs px-2 py-1 rounded cursor-pointer"
      title="Descargar Formato en Blanco para Firma Manuscrita / Física"
    >
      PDF Físico
    </button>
  </>
);

export const PayrollDetailsTable = ({ payroll, details = [], readOnly = false, onEditDetail }) => (
  <>
    <div className="block md:hidden divide-y divide-gray-100">
      {details.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-xs">
          No se encontraron colaboradores con el término de búsqueda ingresado.
        </div>
      ) : (
        details.map((det) => {
          const totalBonuses = sumItems(det.bonuses);
          const totalDeductions = sumItems(det.deductions);
          const sig = SIG_STATUS_MAP[det.signatureStatus] || SIG_STATUS_MAP.PENDING;

          return (
            <div key={det.id} className="p-3.5 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900 text-xs">
                    {det.employee?.firstName} {det.employee?.lastName}
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono">
                    {det.employee?.identityCard}
                  </p>
                </div>
                <span className="font-mono font-semibold text-xs text-gray-900 tabular-nums">
                  ${Number(det.netSalary || 0).toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 bg-gray-50/50 p-2 rounded border border-gray-100 font-mono">
                <span>Base: ${Number(det.baseSalary || 0).toFixed(2)}</span>
                <span>Días: {det.workedDays}</span>
                <span>Extra: +${Number(det.overtimeAmount || 0).toFixed(2)}</span>
                <span className="text-green-700">Bonos: +${totalBonuses.toFixed(2)}</span>
                <span className="text-red-700 col-span-2">
                  Deduc: −${totalDeductions.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${sig.cls}`}>
                  {sig.label}
                </span>
                <div className="flex gap-2">
                  <ActionButtons
                    det={det}
                    payroll={payroll}
                    readOnly={readOnly}
                    onEditDetail={onEditDetail}
                  />
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>

    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            <th className="py-2.5 px-4">Colaborador</th>
            <th className="py-2.5 px-4 text-right">Sueldo Base</th>
            <th className="py-2.5 px-4 text-center">Días</th>
            <th className="py-2.5 px-4 text-right">Hrs Extra</th>
            <th className="py-2.5 px-4 text-right">Ingresos Adic.</th>
            <th className="py-2.5 px-4 text-right">Deducciones</th>
            <th className="py-2.5 px-4 text-right">Neto a Recibir</th>
            <th className="py-2.5 px-4 text-center">Firma</th>
            <th className="py-2.5 px-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {details.length === 0 ? (
            <tr>
              <td colSpan="9" className="p-8 text-center text-gray-400 text-xs">
                No se encontraron colaboradores con el término de búsqueda ingresado.
              </td>
            </tr>
          ) : (
            details.map((det) => {
              const totalBonuses = sumItems(det.bonuses);
              const totalDeductions = sumItems(det.deductions);
              const sig = SIG_STATUS_MAP[det.signatureStatus] || SIG_STATUS_MAP.PENDING;

              return (
                <tr key={det.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-2.5 px-4">
                    <p className="font-medium text-gray-900">
                      {det.employee?.firstName} {det.employee?.lastName}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {det.employee?.identityCard}
                    </p>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-gray-700 tabular-nums">
                    ${Number(det.baseSalary || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-gray-700 tabular-nums">
                    {det.workedDays}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-gray-700 tabular-nums">
                    +${Number(det.overtimeAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-green-700 tabular-nums">
                    +${totalBonuses.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-red-700 tabular-nums">
                    −${totalDeductions.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                    ${Number(det.netSalary || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${sig.cls}`}
                    >
                      {sig.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      <ActionButtons
                        det={det}
                        payroll={payroll}
                        readOnly={readOnly}
                        onEditDetail={onEditDetail}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </>
);

export default PayrollDetailsTable;
