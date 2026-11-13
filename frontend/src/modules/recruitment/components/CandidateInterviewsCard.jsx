/**
 * @file CandidateInterviewsCard.jsx
 * @description Listado de entrevistas presenciales, virtuales y telefónicas con control de estado.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import PropTypes from 'prop-types';
import { FiCalendar, FiCheck, FiExternalLink, FiX } from 'react-icons/fi';

const TYPE_LABELS = {
  VIRTUAL: 'Videollamada',
  PRESENTIAL: 'Presencial',
  PHONE: 'Telefónica',
};

const STATUS_LABELS = {
  SCHEDULED: 'Programada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export const CandidateInterviewsCard = ({
  interviews = [],
  onOpenScheduleModal,
  onUpdateInterviewStatus,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 text-xs space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <FiCalendar size={13} /> Entrevistas y Sesiones ({interviews.length})
        </h2>
        <button
          type="button"
          onClick={onOpenScheduleModal}
          className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium transition-colors cursor-pointer"
        >
          + Nueva Entrevista
        </button>
      </div>

      {interviews.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {interviews.map((item) => {
            const isVirtualUrl = item.type === 'VIRTUAL' && item.location?.startsWith('http');
            const isScheduled = !item.status || item.status === 'SCHEDULED';

            return (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                    <span>{TYPE_LABELS[item.type] || item.type}</span>
                    <span className="font-mono text-[11px] text-gray-500 font-normal tabular-nums">
                      {new Date(item.date).toLocaleDateString('es-EC', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      ·{' '}
                      {new Date(item.date).toLocaleTimeString('es-EC', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap">
                    <span>
                      {item.type === 'VIRTUAL'
                        ? 'Enlace:'
                        : item.type === 'PRESENTIAL'
                          ? 'Lugar:'
                          : 'Teléfono:'}
                    </span>
                    {isVirtualUrl ? (
                      <a
                        href={item.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-mono inline-flex items-center gap-1 break-all"
                      >
                        <span>{item.location}</span>
                        <FiExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-gray-800 font-mono break-all">
                        {item.location || 'Por definir'}
                      </span>
                    )}
                  </div>

                  {item.interviewer && (
                    <div className="text-[11px] text-gray-500">
                      Entrevistador:{' '}
                      <span className="text-gray-700 font-medium">
                        {item.interviewer.firstName} {item.interviewer.lastName}
                      </span>
                    </div>
                  )}

                  {item.notes && (
                    <div className="text-[11px] text-gray-600 italic">"{item.notes}"</div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-[10px] text-gray-700 px-2 py-0.5 rounded border border-gray-200 bg-gray-50">
                    {STATUS_LABELS[item.status] || item.status || 'Programada'}
                  </span>

                  {isScheduled && onUpdateInterviewStatus && (
                    <>
                      <button
                        type="button"
                        title="Marcar como completada"
                        onClick={() => onUpdateInterviewStatus(item.id, 'COMPLETED')}
                        className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded border border-gray-200 transition-colors cursor-pointer"
                      >
                        <FiCheck size={12} />
                      </button>
                      <button
                        type="button"
                        title="Cancelar entrevista"
                        onClick={() => onUpdateInterviewStatus(item.id, 'CANCELLED')}
                        className="p-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded border border-gray-200 transition-colors cursor-pointer"
                      >
                        <FiX size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-gray-400 bg-gray-50/50 rounded border border-dashed border-gray-200">
          No se han registrado entrevistas con este candidato.
        </div>
      )}
    </div>
  );
};

CandidateInterviewsCard.propTypes = {
  interviews: PropTypes.array,
  onOpenScheduleModal: PropTypes.func.isRequired,
  onUpdateInterviewStatus: PropTypes.func,
};

export default CandidateInterviewsCard;
