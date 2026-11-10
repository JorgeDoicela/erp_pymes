/**
 * @file CandidateNotesPanel.jsx
 * @description Panel lateral de observaciones y notas de seguimiento interno para el equipo de selección.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiSend } from 'react-icons/fi';

export const CandidateNotesPanel = ({
  notes = [],
  noteText,
  setNoteText,
  onAddNote,
  submitting,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-[4px] flex flex-col h-[540px] text-xs">
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">
          Notas de Seguimiento Interno
        </h3>
        <p className="text-gray-400 text-[11px] mt-0.5">
          Visibles únicamente para el equipo de selección
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-gray-50/30">
        {notes.length > 0 ? (
          notes.map((n) => (
            <div key={n.id} className="p-2.5 bg-white border border-gray-200 rounded-[4px] space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-gray-800">{n.createdBy || 'Sistema'}</span>
                <span className="font-mono text-gray-400 tabular-nums">
                  {new Date(n.createdAt).toLocaleDateString('es-EC')}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed text-xs">{n.content}</p>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <p className="text-xs">Sin observaciones registradas.</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Escribe abajo para dejar notas sobre el candidato.
            </p>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={onAddNote} className="space-y-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Escribir observación interna sobre la entrevista o perfil..."
            className="w-full bg-white border border-gray-200 rounded-[4px] p-2 text-xs text-gray-800 focus:outline-none focus:border-blue-600 h-16 resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!noteText.trim() || submitting}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-[4px] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FiSend size={11} />
              <span>{submitting ? 'Guardando...' : 'Añadir Nota'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateNotesPanel;
