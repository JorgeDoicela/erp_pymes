/**
 * @file UploadExpedientDocModal.jsx
 * @description Modal de subida de documentos al expediente digital (archivo o URL).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '../../../../components/common/Modal';

export const UploadExpedientDocModal = ({
  isOpen,
  onClose,
  isDetailMode,
  directoryData = [],
  targetEmployeeId,
  setTargetEmployeeId,
  uploadCategory,
  setUploadCategory,
  onFileUpload,
  uploadUrl,
  setUploadUrl,
  expiryDate,
  setExpiryDate,
  onSubmit,
  actionLoading,
}) => {
  const employeeList = Array.isArray(directoryData)
    ? directoryData
    : directoryData?.employees || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cargar Documento al Expediente"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        {!isDetailMode && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Colaborador Destino
            </label>
            <select
              className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-blue-600"
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
              required
            >
              <option value="">Selecciona un colaborador...</option>
              {employeeList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName || `${emp.firstName} ${emp.lastName}`} ({emp.identityCard || 'S/N'})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Categoría del Documento
          </label>
          <select
            className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-blue-600"
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
          >
            <option value="IDENTIFICATION">Cédula de Identidad / DNI</option>
            <option value="LABOR_CONTRACT">Contrato Laboral Firmado</option>
            <option value="BANK_CERTIFICATE">Certificado Bancario de Nómina</option>
            <option value="TITLE_DIPLOMA">Título Académico / Certificado de Estudios</option>
            <option value="POLICE_RECORD">Certificado de Antecedentes Penales</option>
            <option value="CURRICULUM">Hoja de Vida / Currículum Vitae</option>
            <option value="SAFETY_CERTIFICATE">Certificado Médico / Salud Ocupacional</option>
            <option value="IESS_AFFILIATION">Aviso de Entrada / Afiliación IESS</option>
            <option value="DISCIPLINARY_RECORD">Memorando o Novedad Disciplinaria</option>
            <option value="OTHER">Otro Documento</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Adjuntar Archivo Local (PDF o Imagen)
          </label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={onFileUpload}
            className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            O Enlace / URL Digital Directa
          </label>
          <input
            type="url"
            placeholder="https://... (opcional si ya seleccionaste un archivo)"
            className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-blue-600 font-mono"
            value={uploadUrl}
            onChange={(e) => setUploadUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fecha de Caducidad / Vencimiento (Opcional)
          </label>
          <input
            type="date"
            className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-blue-600 font-mono tabular-nums"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? 'Guardando...' : 'Guardar en Expediente'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadExpedientDocModal;
