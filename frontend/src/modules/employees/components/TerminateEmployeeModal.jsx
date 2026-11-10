/**
 * @file TerminateEmployeeModal.jsx
 * @description Modal de desvinculación y baja de colaborador con motivos legales y fecha de salida.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '../../../components/common/Modal';

export const TerminateEmployeeModal = ({
  isOpen,
  onClose,
  employeeName,
  terminateForm,
  setTerminateForm,
  onSubmit,
  isTerminating,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dar de Baja a Colaborador"
      subtitle={employeeName}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Fecha Efectiva de Salida
          </label>
          <input
            type="date"
            required
            value={terminateForm.exitDate}
            onChange={(e) => setTerminateForm({ ...terminateForm, exitDate: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 font-mono tabular-nums"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Tipo de Desvinculación
          </label>
          <select
            value={terminateForm.exitType}
            onChange={(e) => setTerminateForm({ ...terminateForm, exitType: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
          >
            <option value="Voluntary">Voluntaria (Renuncia)</option>
            <option value="Involuntary">Involuntaria (Despido)</option>
            <option value="ContractEnd">Fin de Contrato a Plazo Fijo</option>
            <option value="Retirement">Jubilación</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Motivo / Justificación
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Renuncia voluntaria por nuevos proyectos"
            value={terminateForm.exitReason}
            onChange={(e) => setTerminateForm({ ...terminateForm, exitReason: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Observaciones Adicionales
          </label>
          <textarea
            rows={2}
            placeholder="Detalles sobre entrega de activos, liquidación, etc."
            value={terminateForm.notes}
            onChange={(e) => setTerminateForm({ ...terminateForm, notes: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 rounded-[4px] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isTerminating}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-[4px] font-medium transition-colors cursor-pointer"
          >
            {isTerminating ? 'Procesando...' : 'Confirmar Baja'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TerminateEmployeeModal;
