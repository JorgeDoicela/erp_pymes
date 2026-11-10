/**
 * @file DocumentsTab.jsx
 * @description Pestaña de gestión de documentos adjuntos al expediente con formulario de carga.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const DocumentsTab = ({
  documents = [],
  documentForm,
  handleDocumentChange,
  handleUploadDocument,
  isUploading,
  setDocToDelete,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50/70 p-4 rounded-[4px] border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Subir Nuevo Documento Adjunto
        </p>
        <form
          onSubmit={handleUploadDocument}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end text-xs"
        >
          <div>
            <label className="block text-gray-600 mb-1">Tipo de Documento</label>
            <select
              name="type"
              value={documentForm.type}
              onChange={handleDocumentChange}
              className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
            >
              <option value="DNI">Cédula / Pasaporte</option>
              <option value="Licencia">Licencia de Conducir</option>
              <option value="Certificado">Certificado de Salud / Estudio</option>
              <option value="Contrato_Firmado">Contrato Firmado</option>
              <option value="CV">Hoja de Vida (CV)</option>
              <option value="Otro">Otro Documento</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-600 mb-1">
              Archivo (PDF / Imagen, Máx 4MB)
            </label>
            <input
              type="file"
              name="file"
              onChange={handleDocumentChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-xs text-gray-500 bg-white border border-gray-200 rounded-[4px] px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">
              Fecha de Vencimiento (Opcional)
            </label>
            <input
              type="date"
              name="expiryDate"
              value={documentForm.expiryDate}
              onChange={handleDocumentChange}
              className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 font-mono tabular-nums"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end pt-1">
            <button
              type="submit"
              disabled={isUploading}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[4px] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUploading ? 'Subiendo...' : 'Subir Documento'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-3.5 rounded-[4px] border border-gray-200 text-xs flex flex-col justify-between space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{doc.type}</p>
                  <p className="text-[11px] text-gray-400 font-mono tabular-nums">
                    {new Date(doc.createdAt).toLocaleDateString('es-EC')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDocToDelete(doc.id)}
                  className="text-gray-400 hover:text-red-600 text-xs font-semibold px-1 cursor-pointer"
                  title="Eliminar documento"
                >
                  &times;
                </button>
              </div>
              {doc.expiryDate && (
                <p className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[4px] inline-block tabular-nums">
                  Vence: {new Date(doc.expiryDate).toLocaleDateString('es-EC')}
                </p>
              )}
              <a
                href={`${API_URL}/documents/download/${doc.documentUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium rounded-[4px] text-center transition-colors block mt-2"
              >
                Ver / Descargar Archivo ↗
              </a>
            </div>
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-gray-400 text-xs">
            No hay documentos adjuntos registrados en el expediente.
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsTab;
