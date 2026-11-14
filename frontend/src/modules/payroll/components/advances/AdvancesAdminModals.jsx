/**
 * @file AdvancesAdminModals.jsx
 * @description Modales administrativos para concesión, aprobación, rechazo y detalle de anticipos.
 */

import React from 'react';
import Modal from '@core/ui/Modal';
import { ADVANCE_STATUS_MAP } from './AdvancesManagementTable';

const inputClass =
  'w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

const AdvancesAdminModals = ({
  employees,
  createModalOpen,
  setCreateModalOpen,
  adminFormData,
  setAdminFormData,
  calculatedDeduction,
  onCreateSubmit,
  approveModalOpen,
  setApproveModalOpen,
  onConfirmApprove,
  rejectModalOpen,
  setRejectModalOpen,
  rejectionReason,
  setRejectionReason,
  onConfirmReject,
  detailModalOpen,
  setDetailModalOpen,
  selectedAdvance,
  setSelectedAdvance,
  actionLoading,
}) => {
  const closeSelection = (setModal) => {
    setModal(false);
    setSelectedAdvance(null);
  };

  return (
    <>
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Conceder Anticipo / Préstamo"
        subtitle="Registre una entrega directa de fondos con descuento mensual programado."
        size="lg"
      >
        <form onSubmit={onCreateSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Colaborador</label>
            <select
              required
              className={inputClass}
              value={adminFormData.employeeId}
              onChange={(e) => setAdminFormData({ ...adminFormData, employeeId: e.target.value })}
            >
              <option value="">Seleccione un colaborador...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} — {emp.department || 'General'} (
                  {emp.position || 'Colaborador'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Monto Total ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                className={inputClass + ' font-mono'}
                placeholder="0.00"
                value={adminFormData.amount}
                onChange={(e) => setAdminFormData({ ...adminFormData, amount: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Número de Cuotas Mensuales</label>
              <input
                type="number"
                min="1"
                max="24"
                required
                className={inputClass + ' font-mono'}
                value={adminFormData.installments}
                onChange={(e) =>
                  setAdminFormData({ ...adminFormData, installments: e.target.value })
                }
              />
            </div>
          </div>

          {calculatedDeduction > 0 && (
            <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded text-xs text-blue-900 flex justify-between items-center">
              <span>Descuento Mensual Estimado:</span>
              <span className="font-mono font-bold">
                ${calculatedDeduction.toFixed(2)} USD / mes
              </span>
            </div>
          )}

          <div>
            <label className={labelClass}>Motivo / Justificación</label>
            <textarea
              rows="2"
              className={inputClass + ' resize-none'}
              placeholder="Ej. Anticipo por calamidad doméstica, adquisición de equipo, etc."
              value={adminFormData.reason}
              onChange={(e) => setAdminFormData({ ...adminFormData, reason: e.target.value })}
            />
          </div>

          <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {actionLoading ? 'Procesando...' : 'Conceder Anticipo'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={approveModalOpen && !!selectedAdvance}
        onClose={() => closeSelection(setApproveModalOpen)}
        title="¿Aprobar solicitud de anticipo?"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => closeSelection(setApproveModalOpen)}
              className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={onConfirmApprove}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? 'Aprobando...' : 'Confirmar Aprobación'}
            </button>
          </>
        }
      >
        {selectedAdvance && (
          <div>
            <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
              <p>
                <span className="font-medium text-gray-900">Colaborador:</span>{' '}
                {selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName}
              </p>
              <p>
                <span className="font-medium text-gray-900">Monto Solicitado:</span> $
                {selectedAdvance.amount.toFixed(2)} USD
              </p>
              <p>
                <span className="font-medium text-gray-900">Cuotas:</span>{' '}
                {selectedAdvance.installments} ({selectedAdvance.monthlyDeduction.toFixed(2)}{' '}
                USD/mes)
              </p>
              {selectedAdvance.reason && (
                <p>
                  <span className="font-medium text-gray-900">Motivo:</span>{' '}
                  {selectedAdvance.reason}
                </p>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Al aprobar, se programará la deducción automática en las siguientes liquidaciones de
              nómina.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={rejectModalOpen && !!selectedAdvance}
        onClose={() => closeSelection(setRejectModalOpen)}
        title="Rechazar Solicitud de Anticipo"
        size="md"
      >
        {selectedAdvance && (
          <form onSubmit={onConfirmReject} className="space-y-4">
            <p className="text-xs text-gray-500">
              Colaborador:{' '}
              <span className="font-semibold text-gray-900">
                {selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName}
              </span>{' '}
              (${selectedAdvance.amount.toFixed(2)} USD)
            </p>
            <div>
              <label className={labelClass}>Motivo del Rechazo</label>
              <textarea
                required
                rows="3"
                className={inputClass + ' resize-none'}
                placeholder="Indique la justificación formal del rechazo para notificación al colaborador..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => closeSelection(setRejectModalOpen)}
                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Procesando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={detailModalOpen && !!selectedAdvance}
        onClose={() => closeSelection(setDetailModalOpen)}
        title="Detalle de Anticipo / Préstamo"
        size="md"
        footer={
          <button
            type="button"
            onClick={() => closeSelection(setDetailModalOpen)}
            className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        }
      >
        {selectedAdvance && (
          <div className="space-y-3 text-xs">
            <div className="bg-gray-50 p-3.5 rounded border border-gray-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Colaborador:</span>
                <span className="font-semibold text-gray-900">
                  {selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cédula / Dept:</span>
                <span className="font-mono text-gray-800">
                  {selectedAdvance.employee?.identityCard || 'S/N'} ·{' '}
                  {selectedAdvance.employee?.department || 'General'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monto Total:</span>
                <span className="font-mono font-semibold text-gray-900">
                  ${selectedAdvance.amount.toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amortizado a la Fecha:</span>
                <span className="font-mono font-semibold text-emerald-700">
                  ${selectedAdvance.paidAmount.toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Saldo Pendiente:</span>
                <span className="font-mono font-semibold text-gray-900">
                  ${Math.max(0, selectedAdvance.amount - selectedAdvance.paidAmount).toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Progreso Cuotas:</span>
                <span className="font-mono text-gray-800">
                  {selectedAdvance.paidInstallments} de {selectedAdvance.installments} cuotas ($
                  {selectedAdvance.monthlyDeduction.toFixed(2)}/mes)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${ADVANCE_STATUS_MAP[selectedAdvance.status]?.cls}`}
                >
                  {ADVANCE_STATUS_MAP[selectedAdvance.status]?.label || selectedAdvance.status}
                </span>
              </div>
              {selectedAdvance.reason && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 block mb-0.5">Motivo / Justificación:</span>
                  <span className="text-gray-800 italic">{selectedAdvance.reason}</span>
                </div>
              )}
              {selectedAdvance.rejectionReason && (
                <div className="pt-2 border-t border-gray-200 text-red-700">
                  <span className="font-medium block mb-0.5">Motivo de Rechazo:</span>
                  <span>{selectedAdvance.rejectionReason}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AdvancesAdminModals;
