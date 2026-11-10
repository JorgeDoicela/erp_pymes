/**
 * @file CandidateEvaluationsCard.jsx
 * @description Evaluaciones y scorecard del equipo de selección sobre el candidato.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiStar } from 'react-icons/fi';

export const CandidateEvaluationsCard = ({ evaluations = [], onOpenEvaModal }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-[4px] p-4 text-xs space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <FiStar size={13} /> Evaluaciones de Selección ({evaluations.length})
        </h2>
        <button
          type="button"
          onClick={onOpenEvaModal}
          className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-[4px] text-xs font-medium transition-colors cursor-pointer"
        >
          + Evaluar Candidato
        </button>
      </div>

      {evaluations.length > 0 ? (
        <div className="space-y-3">
          {evaluations.map((eva) => {
            const parsedRatings =
              typeof eva.ratings === 'string' ? JSON.parse(eva.ratings) : eva.ratings || {};

            return (
              <div
                key={eva.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-[4px] space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium text-gray-900">
                    Evaluador:{' '}
                    <span className="font-semibold">
                      {eva.evaluator?.firstName || 'Equipo'} {eva.evaluator?.lastName || 'RRHH'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs font-bold text-gray-900 tabular-nums">
                      {eva.overallScore}/100 pts
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${
                        eva.recommendation === 'HIRE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : eva.recommendation === 'MAYBE'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {eva.recommendation === 'HIRE'
                        ? 'RECOMENDADO'
                        : eva.recommendation === 'MAYBE'
                          ? 'EN DUDA'
                          : 'NO CONTRATAR'}
                    </span>
                  </div>
                </div>

                {Object.keys(parsedRatings).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-gray-200/60 text-[11px]">
                    {Object.entries(parsedRatings).map(([crit, val]) => (
                      <div
                        key={crit}
                        className="flex justify-between bg-white px-2 py-1 rounded-[4px] border border-gray-200"
                      >
                        <span className="text-gray-600 truncate">{crit}</span>
                        <span className="font-mono font-bold text-gray-900 tabular-nums">
                          {val}/5
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {eva.comments && (
                  <p className="text-gray-700 italic text-[11px] pt-1 leading-relaxed">
                    "{eva.comments}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-gray-400 bg-gray-50/50 rounded-[4px] border border-dashed border-gray-200">
          Aún no se han completado evaluaciones técnicas o psicométricas para este postulante.
        </div>
      )}
    </div>
  );
};

export default CandidateEvaluationsCard;
