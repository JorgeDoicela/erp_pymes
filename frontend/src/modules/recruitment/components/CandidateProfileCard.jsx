/**
 * @file CandidateProfileCard.jsx
 * @description Ficha de contacto del postulante, carta de presentación y acceso al CV.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState } from 'react';
import { FiCopy, FiCheck, FiFileText, FiEye, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export const CandidateProfileCard = ({ app, getResumeUrl, onOpenResumeModal }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[4px] p-4 text-xs space-y-3">
      <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        Información de Contacto y Perfil
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Email */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-[4px] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-400">
              Correo Electrónico
            </div>
            <div className="text-gray-900 font-medium mt-0.5">{app.email}</div>
          </div>
          <button
            type="button"
            onClick={() => copyText(app.email, 'email')}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-[4px] transition-colors cursor-pointer"
            title="Copiar email"
          >
            {copiedEmail ? <FiCheck className="text-emerald-600" size={13} /> : <FiCopy size={13} />}
          </button>
        </div>

        {/* Teléfono */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-[4px] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-400">
              Teléfono / WhatsApp
            </div>
            <div className="text-gray-900 font-mono font-medium mt-0.5 tabular-nums">
              {app.phone || 'No registrado'}
            </div>
          </div>
          {app.phone && (
            <button
              type="button"
              onClick={() => copyText(app.phone, 'phone')}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-[4px] transition-colors cursor-pointer"
              title="Copiar teléfono"
            >
              {copiedPhone ? <FiCheck className="text-emerald-600" size={13} /> : <FiCopy size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Carta de Presentación */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-[4px] space-y-1">
        <div className="text-[10px] uppercase font-semibold text-gray-400 flex items-center gap-1">
          <FiFileText size={12} /> Carta de Presentación / Mensaje
        </div>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-xs">
          {app.coverLetter || 'El postulante no adjuntó carta de presentación formal.'}
        </p>
      </div>

      {/* Barra de CV */}
      {app.resumeUrl && (
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[4px] bg-red-50 text-red-700 border border-red-200 font-mono font-bold text-[10px] flex items-center justify-center">
              PDF
            </div>
            <span className="text-xs font-medium text-gray-800">Currículum Vitae Adjunto</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenResumeModal}
              className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-[4px] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FiEye size={12} />
              <span>Visualizar</span>
            </button>
            <button
              type="button"
              onClick={() => window.open(getResumeUrl(app.resumeUrl), '_blank')}
              className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-[4px] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FiExternalLink size={12} />
              <span>Abrir en Pestaña</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateProfileCard;
