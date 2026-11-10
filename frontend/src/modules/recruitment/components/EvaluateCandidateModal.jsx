/**
 * @file EvaluateCandidateModal.jsx
 * @description Modal para calificar y registrar la evaluación de selección de un candidato.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '../../../components/common/Modal';

export const EvaluateCandidateModal = ({
  isOpen,
  onClose,
  candidateName,
  evaData,
  setEvaData,
  updateRating,
  onSubmit,
  submitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evaluación de Selección"
      subtitle={`Puntuación de ${candidateName}`}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Criterios de Evaluación (1 al 5)
          </div>
          {Object.keys(evaData.ratings).map((crit) => (
            <div
              key={crit}
              className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded-[4px]"
            >
              <span className="text-gray-700 font-medium text-xs">{crit}</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => updateRating(crit, star)}
                    className={`w-6 h-6 rounded-[4px] text-xs font-mono font-bold transition-colors cursor-pointer ${
                      evaData.ratings[crit] >= star
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-[4px] flex justify-between items-center">
          <span className="font-medium text-gray-700 text-xs">Promedio General</span>
          <span className="font-mono text-base font-bold text-blue-700 tabular-nums">
            {evaData.overallScore} / 5.0
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Observaciones Finales
          </label>
          <textarea
            required
            placeholder="Detalles sobre fortalezas, debilidades y ajuste al puesto..."
            value={evaData.comments}
            onChange={(e) => setEvaData({ ...evaData, comments: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-[4px] p-2 text-xs text-gray-800 focus:outline-none focus:border-blue-600 h-20 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Recomendación del Evaluador
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'HIRE', label: 'Recomendar' },
              { key: 'MAYBE', label: 'En Duda' },
              { key: 'NO_HIRE', label: 'Descartar' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setEvaData({ ...evaData, recommendation: opt.key })}
                className={`py-2 px-2 rounded-[4px] text-xs font-medium border text-center transition-colors cursor-pointer ${
                  evaData.recommendation === opt.key
                    ? 'border-gray-900 bg-gray-900 text-white font-semibold'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
            {submitting ? 'Guardando...' : 'Guardar Evaluación'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EvaluateCandidateModal;
