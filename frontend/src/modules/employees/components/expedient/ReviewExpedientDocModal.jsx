/**
 * @file ReviewExpedientDocModal.jsx
 * @description Modal de validación, aprobación o rechazo de documentos de expediente por RRHH.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiExternalLink } from 'react-icons/fi';
import Modal from '@core/ui/Modal';

export const ReviewExpedientDocModal = ({
  isOpen,
  onClose,
  selectedItem,
  reviewNotes,
  setReviewNotes,
  onVerifyAction,
  actionLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen && !!selectedItem?.document}
      onClose={onClose}
      title="Validar Documento"
      size="md"
    >
      {selectedItem?.document && (
        <div className="space-y-3.5 text-xs">
          <p className="font-semibold text-gray-900">{selectedItem.label}</p>
          <a
            href={selectedItem.document.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-gray-50 border border-gray-200 text-blue-600 text-xs text-center font-medium rounded-[4px] hover:bg-gray-100 flex items-center justify-center gap-1.5"
          >
            Abrir Documento para Inspección <FiExternalLink className="w-3.5 h-3.5" />
          </a>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Observaciones de Validación
            </label>
            <textarea
              rows="2"
              placeholder="Ej. Documento verificado correctamente / Falta firma / Ilegible..."
              className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-blue-600 resize-none"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onVerifyAction('REJECTED')}
              disabled={actionLoading}
              className="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
            >
              Rechazar Documento
            </button>
            <button
              type="button"
              onClick={() => onVerifyAction('VERIFIED')}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
            >
              Aprobar y Verificar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReviewExpedientDocModal;
