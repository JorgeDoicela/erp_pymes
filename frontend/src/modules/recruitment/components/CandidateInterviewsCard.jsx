/**
 * @file CandidateInterviewsCard.jsx
 * @description Listado de entrevistas y sesiones programadas con el postulante.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiCalendar } from 'react-icons/fi';

export const CandidateInterviewsCard = ({ interviews = [], onOpenScheduleModal }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-[4px] p-4 text-xs space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <FiCalendar size={13} /> Entrevistas y Sesiones ({interviews.length})
        </h2>
        <button
          type="button"
          onClick={onOpenScheduleModal}
          className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-[4px] text-xs font-medium transition-colors cursor-pointer"
        >
          + Nueva Entrevista
        </button>
      </div>

      {interviews.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {interviews.map((int) => (
            <div key={int.id} className="py-2.5 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                  <span>
                    {int.type === 'VIRTUAL'
                      ? 'Videollamada'
                      : int.type === 'PRESENTIAL'
                        ? 'Presencial'
                        : 'Telefónica'}
                  </span>
                  <span className="font-mono text-[11px] text-gray-500 font-normal tabular-nums">
                    {new Date(int.date).toLocaleDateString('es-EC', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    ·{' '}
                    {new Date(int.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Ubicación / Enlace:{' '}
                  <span className="text-gray-700 font-mono">
                    {int.location || 'Por definir'}
                  </span>
                </div>
                {int.notes && (
                  <div className="text-[11px] text-gray-600 mt-1 italic">"{int.notes}"</div>
                )}
              </div>
              <span className="font-mono text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-[4px] border border-gray-200 shrink-0">
                {int.status || 'PROGRAMADA'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-gray-400 bg-gray-50/50 rounded-[4px] border border-dashed border-gray-200">
          No se han registrado entrevistas con este candidato.
        </div>
      )}
    </div>
  );
};

export default CandidateInterviewsCard;
