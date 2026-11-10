/**
 * @file ExpedientDetailView.jsx
 * @description Vista detallada del expediente individual con checklist por categorías legales.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUploadCloud, FiArrowLeft, FiExternalLink, FiTrash2 } from 'react-icons/fi';

export const ExpedientDetailView = ({
  expedientData,
  employeeId,
  isMyExpedient,
  directoryData = [],
  isAdmin,
  onOpenUploadModal,
  onOpenReviewModal,
  onOpenDeleteModal,
}) => {
  const navigate = useNavigate();

  const employeeList = Array.isArray(directoryData)
    ? directoryData
    : directoryData?.employees || [];

  return (
    <div className="space-y-6">
      {/* Selector Rápido de Expediente de Colaborador */}
      {employeeList.length > 0 && !isMyExpedient && (
        <div className="bg-white p-3.5 rounded-[4px] border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 whitespace-nowrap">
              Expediente de:
            </span>
            <select
              value={expedientData?.employee?.id || employeeId}
              onChange={(e) => navigate(`/admin/expedientes/${e.target.value}`)}
              className="bg-gray-50 border border-gray-300 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-blue-600 cursor-pointer max-w-xs"
            >
              {employeeList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.completionPercentage}% -{' '}
                  {emp.identityCard || 'S/N'})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/employees/${expedientData?.employee?.id || employeeId}`}
              className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-[4px] transition-colors text-xs font-medium cursor-pointer"
            >
              Ver Ficha del Colaborador
            </Link>
          </div>
        </div>
      )}

      {/* Header Limpio Directo a Datos */}
      <div className="bg-white p-5 rounded-[4px] border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">
              {isMyExpedient ? 'Mi Portal · Expediente Digital' : 'Gestión de Capital Humano'}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-gray-100 text-gray-700 border border-gray-200 font-mono">
              Cédula #{expedientData?.employee?.identityCard || 'S/N'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {isMyExpedient
              ? 'Mi Expediente Digital'
              : `Expediente de ${expedientData?.employee?.firstName} ${expedientData?.employee?.lastName}`}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isMyExpedient ? (
              <>
                Consulta el estado de tu documentación laboral, contratos y requisitos legales.
              </>
            ) : (
              <>
                Cargo:{' '}
                <span className="font-semibold text-gray-800">
                  {expedientData?.employee?.position || 'Colaborador'}
                </span>{' '}
                · Departamento:{' '}
                <span className="font-semibold text-gray-800">
                  {expedientData?.employee?.department || 'General'}
                </span>
              </>
            )}
            {' · '}Completitud:{' '}
            <span className="font-semibold font-mono text-gray-800 tabular-nums">
              {expedientData?.completionPercentage || 0}% ({expedientData?.verifiedCount || 0}/
              {expedientData?.totalRequired || 0} requeridos)
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenUploadModal('IDENTIFICATION')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded-[4px] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <FiUploadCloud className="w-3.5 h-3.5" />
            <span>Adjuntar Documento</span>
          </button>

          {!isMyExpedient && (
            <button
              type="button"
              onClick={() => navigate('/admin/expedientes')}
              className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded-[4px] transition-colors cursor-pointer inline-flex items-center gap-1.5 bg-white"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Directorio</span>
            </button>
          )}
        </div>
      </div>

      {/* Cuadrícula de Categorías Documentales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(expedientData?.checklist || []).map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-[4px] border border-gray-200 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-xs text-gray-900 leading-snug">{item.label}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {item.required ? 'Obligatorio por ley laboral' : 'Documento complementario'}
                </p>
              </div>
              {item.status === 'VERIFIED' ? (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  VERIFICADO
                </span>
              ) : item.status === 'PENDING' ? (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 border border-amber-200">
                  PENDIENTE REVISIÓN
                </span>
              ) : item.status === 'REJECTED' ? (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-700 border border-rose-200">
                  RECHAZADO
                </span>
              ) : (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-[4px] bg-gray-100 text-gray-600 border border-gray-200">
                  NO CARGADO
                </span>
              )}
            </div>

            {item.document ? (
              <div className="bg-gray-50 p-3 rounded-[4px] border border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className="font-medium text-gray-800 truncate max-w-[220px]"
                    title={item.document.originalName}
                  >
                    {item.document.originalName || 'Archivo adjunto'}
                  </span>
                  <a
                    href={item.document.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 font-medium text-[11px]"
                  >
                    <span>Ver</span>
                    <FiExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {item.document.expiryDate && (
                  <p className="text-[11px] text-gray-500 font-mono tabular-nums">
                    Caducidad: {new Date(item.document.expiryDate).toLocaleDateString('es-EC')}
                  </p>
                )}

                {item.document.verificationNotes && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-[4px] border border-amber-200">
                    Observación: {item.document.verificationNotes}
                  </p>
                )}

                <div className="flex justify-between items-center text-gray-400 pt-1.5 border-t border-gray-200 text-[11px]">
                  <span className="font-mono tabular-nums">
                    Subido: {new Date(item.document.createdAt).toLocaleDateString('es-EC')}
                  </span>
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onOpenReviewModal(item)}
                        className="text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        Revisar
                      </button>
                    )}
                    {(isAdmin || item.document.status === 'PENDING') && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenDeleteModal({
                            id: item.document.id,
                            name: item.document.originalName || item.label,
                            category: item.label,
                          })
                        }
                        className="text-gray-400 hover:text-rose-600 cursor-pointer"
                        title="Eliminar documento"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-[4px] border border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                <span>Pendiente de adjuntar</span>
                <button
                  type="button"
                  onClick={() => onOpenUploadModal(item.categoryKey)}
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 bg-white text-xs px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer"
                >
                  Subir Archivo
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpedientDetailView;
