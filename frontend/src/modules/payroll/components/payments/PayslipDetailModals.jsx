/**
 * @file PayslipDetailModals.jsx
 * @description Modales de desglose de rol de pagos, firma digital de conformidad y reporte de observación.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '@core/ui/Modal';
import { generatePayslipPDF } from '../../utils/generatePayslipPDF';

const safeParseArray = (raw) => {
  try {
    return JSON.parse(raw || '[]') || [];
  } catch {
    return [];
  }
};

export const PayslipBreakdownModal = ({ selectedPayroll, onClose, user }) => (
  <Modal
    isOpen={!!selectedPayroll}
    onClose={onClose}
    title={
      selectedPayroll
        ? `Desglose de Rol de Pagos — ${new Date(selectedPayroll.payroll?.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}`
        : ''
    }
    subtitle="Detalle formal de ingresos, deducciones de ley y firma."
    size="lg"
    footer={
      <div className="flex flex-wrap items-center justify-between w-full gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 cursor-pointer"
        >
          Cerrar
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              generatePayslipPDF(
                selectedPayroll,
                selectedPayroll.employee || user,
                selectedPayroll.payroll?.period,
                { isPhysicalPrint: true }
              )
            }
            className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium cursor-pointer"
            title="Descargar rol limpio para imprimir en papel y firmar con esfero"
          >
            PDF para Firma Física
          </button>
          <button
            type="button"
            onClick={() =>
              generatePayslipPDF(
                selectedPayroll,
                selectedPayroll.employee || user,
                selectedPayroll.payroll?.period,
                { isPhysicalPrint: false }
              )
            }
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium cursor-pointer"
            title="Descargar rol con sellos electrónicos y código QR"
          >
            Descargar PDF Digital
          </button>
        </div>
      </div>
    }
  >
    {selectedPayroll && (
      <div className="space-y-4 text-xs text-gray-700">
        <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
          <div>
            <span className="text-gray-500">Días Laborados Base 30: </span>
            <span className="font-mono tabular-nums font-medium text-gray-900">
              {selectedPayroll.workedDays} días
            </span>
          </div>
          <div>
            <span className="text-gray-500">Sueldo Base Mensual: </span>
            <span className="font-mono tabular-nums font-medium text-gray-900">
              ${Number(selectedPayroll.baseSalary || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1 mb-2">
            Ingresos y Bonos
          </h4>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-600">Sueldo Ganado</span>
              <span className="font-mono tabular-nums text-gray-900">
                ${Number(selectedPayroll.baseSalary || 0).toFixed(2)}
              </span>
            </div>
            {selectedPayroll.overtimeAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Horas Extras ({selectedPayroll.overtimeHours} hrs)
                </span>
                <span className="font-mono tabular-nums text-gray-900">
                  +${Number(selectedPayroll.overtimeAmount).toFixed(2)}
                </span>
              </div>
            )}
            {safeParseArray(selectedPayroll.bonuses).map((b, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-600">{b.name || b.concept}</span>
                <span className="font-mono tabular-nums text-gray-900">
                  +${Number(b.amount || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1 mb-2">
            Deducciones de Ley
          </h4>
          <div className="space-y-1.5">
            {safeParseArray(selectedPayroll.deductions).map((d, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-600">{d.name || d.concept}</span>
                <span className="font-mono tabular-nums text-gray-900">
                  −${Number(d.amount || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="py-2.5 border-t border-b border-gray-200 flex justify-between items-center text-sm font-semibold text-gray-900">
          <span>Total Neto a Recibir:</span>
          <span className="font-mono tabular-nums text-base font-bold text-gray-900">
            ${Number(selectedPayroll.netSalary || 0).toFixed(2)} USD
          </span>
        </div>

        <div className="pt-2">
          <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Firmas y Validez Legal
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 border border-gray-200 rounded">
              <p className="font-semibold text-gray-900">
                {selectedPayroll.employee?.tenant?.name || 'NORMA S.A.'}
              </p>
              <p className="text-[11px] text-gray-500">Dpto. Talento Humano y Nómina</p>
              <p className="text-[11px] text-gray-600 mt-1">Autorización y Emisión Conforme</p>
            </div>

            <div className="p-3 border border-gray-200 rounded">
              <p className="font-semibold text-gray-900">
                {selectedPayroll.employee?.firstName} {selectedPayroll.employee?.lastName}
              </p>
              <p className="text-[11px] text-gray-500 font-mono tabular-nums">
                C.I.: {selectedPayroll.employee?.identityCard || 'S/N'}
              </p>
              {selectedPayroll.signatureStatus === 'SIGNED' ? (
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  Firmado el{' '}
                  {selectedPayroll.signedAt
                    ? new Date(selectedPayroll.signedAt).toLocaleDateString('es-EC')
                    : 'Digital'}
                </p>
              ) : (
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  Pendiente de firma del colaborador
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </Modal>
);

export const PayslipSignModal = ({ isOpen, onClose, activeDetail, signing, onSign }) => (
  <Modal
    isOpen={isOpen && !!activeDetail}
    onClose={onClose}
    title="Firma de Conformidad de Rol"
    size="md"
    footer={
      <>
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSign}
          disabled={signing}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          {signing ? 'Firmando...' : 'Aceptar y Firmar Digitalmente'}
        </button>
      </>
    }
  >
    {activeDetail && (
      <div className="space-y-4">
        <p className="text-gray-600">
          Al firmar este documento, certificas la correcta recepción del valor neto de{' '}
          <strong className="text-gray-900 font-mono tabular-nums">
            ${Number(activeDetail.netSalary).toFixed(2)} USD
          </strong>{' '}
          correspondiente al período de{' '}
          <strong>
            {new Date(activeDetail.payroll?.period).toLocaleDateString('es-EC', {
              month: 'long',
              year: 'numeric',
            })}
          </strong>
          .
        </p>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Colaborador:</span>
            <span className="font-bold text-gray-900">
              {activeDetail.employee?.firstName} {activeDetail.employee?.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">C.I.:</span>
            <span className="font-mono tabular-nums text-gray-800">
              {activeDetail.employee?.identityCard}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tipo de Firma:</span>
            <span className="font-medium text-emerald-800">Sello Digital Criptográfico QR</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-400">
          Esta firma digital tiene validez conforme a la Ley de Comercio Electrónico y Firmas
          Digitales del Ecuador.
        </p>
      </div>
    )}
  </Modal>
);

export const PayslipDisputeModal = ({
  isOpen,
  onClose,
  activeDetail,
  disputeReason,
  setDisputeReason,
  signing,
  onDispute,
}) => (
  <Modal
    isOpen={isOpen && !!activeDetail}
    onClose={onClose}
    title="Reportar Observación en Rol"
    size="md"
  >
    {activeDetail && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onDispute();
        }}
        className="space-y-4"
      >
        <p className="text-gray-600">
          Si encuentras alguna discrepancia en tus horas extras, días trabajados o descuentos,
          descríbela a continuación para que Recursos Humanos la revise:
        </p>
        <textarea
          required
          rows="3"
          placeholder="Ej. No se reflejan las 4 horas extraordinarias del sábado 15..."
          className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
        />

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={signing}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {signing ? 'Enviando...' : 'Enviar Observación'}
          </button>
        </div>
      </form>
    )}
  </Modal>
);
