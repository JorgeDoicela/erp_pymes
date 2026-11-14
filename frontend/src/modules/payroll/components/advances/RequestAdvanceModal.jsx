/**
 * @file RequestAdvanceModal.jsx
 * @description Modal de solicitud de anticipo de sueldo o préstamo interno para colaboradores.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '@core/ui/Modal';

export const RequestAdvanceModal = ({ isOpen, onClose, form, setForm, submitting, onSubmit }) => {
  const requestedAmount = parseFloat(form.amount || 0);
  const numInstallments = parseInt(form.installments || 1, 10);
  const calculatedMonthly =
    requestedAmount > 0 ? (requestedAmount / numInstallments).toFixed(2) : '0.00';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Solicitar Anticipo / Préstamo"
      subtitle="Ingresa el monto deseado y número de cuotas requeridas"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Monto Solicitado ($ USD)
          </label>
          <input
            type="number"
            step="0.01"
            min="10"
            required
            placeholder="Ej. 300.00"
            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono tabular-nums"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Plazo de Pago (Cuotas Mensuales)
          </label>
          <select
            className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            value={form.installments}
            onChange={(e) => setForm({ ...form, installments: e.target.value })}
          >
            {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'cuota (Deducción en próximo rol)' : `cuotas mensuales (${n} meses)`}
              </option>
            ))}
          </select>
        </div>

        {requestedAmount > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded p-3 flex justify-between items-center text-xs">
            <div>
              <p className="text-gray-500">Descuento Mensual:</p>
              <p className="font-bold font-mono tabular-nums text-gray-900 mt-0.5">
                -${calculatedMonthly} USD / mes
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Total a Deducción:</p>
              <p className="font-semibold font-mono tabular-nums text-gray-800 mt-0.5">
                ${requestedAmount.toFixed(2)} en {numInstallments} cuota(s)
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Motivo / Justificación
          </label>
          <textarea
            rows="2"
            placeholder="Describe brevemente el motivo..."
            className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !requestedAmount}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
