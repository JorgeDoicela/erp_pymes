/**
 * @file ShiftFormModal.jsx
 * @description Modal de creación y edición de turnos de trabajo con previsualización de jornada calculada.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '../../../../components/common/Modal';

export const ShiftFormModal = ({
  isOpen,
  onClose,
  shiftModal,
  setShiftModal,
  onSaveShift,
}) => {
  const calculateShiftHours = (start, end, breakMin = 60) => {
    try {
      if (!start || !end) return '';
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let totalMins = eh * 60 + em - (sh * 60 + sm);
      if (totalMins < 0) totalMins += 24 * 60;
      const effectiveMins = Math.max(0, totalMins - (breakMin || 0));
      const hrs = (effectiveMins / 60).toFixed(1);
      return `${hrs}h efectivas (${breakMin}m almuerzo)`;
    } catch {
      return '';
    }
  };

  const inputClass =
    'w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={shiftModal.isEditing ? 'Editar Turno' : 'Nuevo Turno de Trabajo'}
      size="md"
    >
      <form onSubmit={onSaveShift}>
        <div className="space-y-4 text-xs">
          <div>
            <label className={labelClass}>Nombre del Turno</label>
            <input
              type="text"
              placeholder="Ej. Matutino Regular, Nocturno Operativo..."
              className={inputClass}
              value={shiftModal.name}
              onChange={(e) => setShiftModal({ ...shiftModal, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Hora de Inicio</label>
              <input
                type="time"
                className={`${inputClass} font-mono tabular-nums`}
                value={shiftModal.startTime}
                onChange={(e) => setShiftModal({ ...shiftModal, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Hora de Fin</label>
              <input
                type="time"
                className={`${inputClass} font-mono tabular-nums`}
                value={shiftModal.endTime}
                onChange={(e) => setShiftModal({ ...shiftModal, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tolerancia de Atraso (min)</label>
              <input
                type="number"
                min="0"
                max="120"
                className={`${inputClass} font-mono tabular-nums`}
                value={shiftModal.toleranceMinutes}
                onChange={(e) =>
                  setShiftModal({ ...shiftModal, toleranceMinutes: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Tiempo de Almuerzo (min)</label>
              <input
                type="number"
                min="0"
                max="240"
                className={`${inputClass} font-mono tabular-nums`}
                value={shiftModal.breakMinutes}
                onChange={(e) => setShiftModal({ ...shiftModal, breakMinutes: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-[4px] p-3 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Jornada Calculada:</span>
              <span className="font-mono font-medium text-gray-900 tabular-nums">
                {calculateShiftHours(
                  shiftModal.startTime,
                  shiftModal.endTime,
                  shiftModal.breakMinutes
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-[4px] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[4px] transition-colors cursor-pointer"
          >
            {shiftModal.isEditing ? 'Guardar Cambios' : 'Crear Turno'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ShiftFormModal;
