/**
 * @file CandidateResumeModal.jsx
 * @description Modal visor de currículum vitae en PDF con opción de apertura externa.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiExternalLink } from 'react-icons/fi';
import Modal from '../../../components/common/Modal';

export const CandidateResumeModal = ({ isOpen, onClose, candidateName, resumeUrl, getResumeUrl }) => {
  const finalUrl = getResumeUrl(resumeUrl);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Currículum Vitae — ${candidateName}`}
      size="xl"
      footer={
        <button
          type="button"
          onClick={() => window.open(finalUrl, '_blank')}
          className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-[4px] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <FiExternalLink size={12} /> Abrir Externo
        </button>
      }
    >
      <div className="h-[70vh] bg-gray-100 p-2">
        <iframe
          src={finalUrl}
          title={`Visor CV - ${candidateName}`}
          className="w-full h-full border border-gray-300 rounded-[4px] bg-white"
        />
      </div>
    </Modal>
  );
};

export default CandidateResumeModal;
