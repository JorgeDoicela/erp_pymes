/**
 * @file LegalCitationDrawer.jsx
 * @description Panel lateral para inspección de citas normativas de Ecuador, NIIF, SRI, IESS y ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiX } from 'react-icons/fi';

export default function LegalCitationDrawer({ citation, isOpen, onClose }) {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 flex justify-end">
      <div className="w-full max-w-md bg-white h-full border-l border-gray-200 shadow-xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Inspector Normativo · Meta {citation.odsTarget || 'ODS 8'}
            </span>
            <h3 className="text-xs font-semibold text-gray-900 mt-0.5">
              Fundamento Jurídico y Técnico Oficial
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar inspector"
            className="p-1 text-gray-400 hover:text-gray-700 rounded-[4px] hover:bg-gray-100 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 font-mono">
              {citation.articleCode}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">{citation.documentTitle}</p>
          </div>

          <div className="bg-[#f9fafb] border border-gray-200 rounded-[4px] p-4 text-xs text-gray-800 leading-relaxed font-mono whitespace-pre-wrap">
            {citation.fullContent || citation.summarySnippet}
          </div>

          <div className="border-t border-gray-200 pt-3 text-[11px] text-gray-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-400">Jurisdicción:</span>
              <span className="font-medium text-gray-800">República del Ecuador</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Vigencia:</span>
              <span className="font-mono text-gray-800">2026 · Concordada en Norma</span>
            </div>
            {typeof citation.relevanceScore === 'number' && (
              <div className="flex justify-between">
                <span className="text-gray-400">Score de Relevancia RAG:</span>
                <span className="font-mono text-gray-800 tabular-nums">
                  {citation.relevanceScore.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-[#f9fafb] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-[4px] hover:bg-gray-50 transition-colors"
          >
            Cerrar Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
