/**
 * @file LegalCitationDrawer.jsx
 * @description Panel lateral para inspección de citas normativas de Ecuador y ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiX, FiBookOpen } from 'react-icons/fi';

export default function LegalCitationDrawer({ citation, isOpen, onClose }) {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full border-l border-gray-200 shadow-xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiBookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
              Fundamento Jurídico Oficial
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-[3px]">
              {citation.odsTarget || 'ODS 8'}
            </span>
            <h4 className="text-sm font-bold text-gray-950 mt-2 font-mono">
              {citation.articleCode}
            </h4>
            <p className="text-xs text-gray-500 font-medium">{citation.documentTitle}</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-[4px] p-4 text-xs text-gray-800 leading-relaxed font-mono">
            {citation.fullContent || citation.summarySnippet}
          </div>

          <div className="border-t border-gray-100 pt-3 text-[11px] text-gray-500 space-y-1">
            <p>
              <strong>Jurisdicción:</strong> República del Ecuador
            </p>
            <p>
              <strong>Vigencia:</strong> Actualizada y concordada en Norma ERP
            </p>
            <p>
              <strong>Aplicabilidad:</strong> Reglas de nómina, asistencia y actas de finiquito
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-[4px] hover:bg-gray-100 shadow-xs"
          >
            Cerrar Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
