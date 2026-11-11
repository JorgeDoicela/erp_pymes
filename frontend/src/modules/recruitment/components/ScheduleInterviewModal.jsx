/**
 * @file ScheduleInterviewModal.jsx
 * @description Modal de programación y agendamiento de entrevistas con candidatos.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '@core/ui/Modal';

export const ScheduleInterviewModal = ({
  isOpen,
  onClose,
  candidateName,
  interviewData,
  setInterviewData,
  onSubmit,
  submitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agendar Entrevista"
      subtitle={`Programar sesión con ${candidateName}`}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input
              required
              type="date"
              value={interviewData.date}
              onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
            <input
              required
              type="time"
              value={interviewData.time}
              onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 font-mono tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Modalidad</label>
          <select
            value={interviewData.type}
            onChange={(e) => setInterviewData({ ...interviewData, type: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
          >
            <option value="VIRTUAL">Videollamada (Google Meet / Zoom)</option>
            <option value="PRESENTIAL">Presencial en Oficinas</option>
            <option value="PHONE">Llamada Telefónica</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Ubicación o Enlace de Reunión
          </label>
          <input
            required
            type="text"
            placeholder="Ej: https://meet.google.com/xyz o Sala de Juntas 2"
            value={interviewData.location}
            onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Notas Preparatorias (Opcional)
          </label>
          <textarea
            placeholder="Puntos clave a evaluar en la sesión..."
            value={interviewData.notes}
            onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-[4px] p-2 text-xs text-gray-800 focus:outline-none focus:border-blue-600 h-16 resize-none"
          />
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-[4px] text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-[4px] text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Guardando...' : 'Confirmar Entrevista'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleInterviewModal;
