/**
 * @file AnnouncementsFeed.jsx
 * @description Feed de comunicados oficiales con soporte para acuse de recibo y prioridad
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const CATEGORY_MAP = {
  POLICY: { label: 'POLÍTICA / REGLAMENTO', cls: 'bg-gray-50 text-gray-700 border-gray-200' },
  HOLIDAY: { label: 'FERIADO / ASUETO', cls: 'bg-amber-50/60 text-amber-900 border-amber-200' },
  BIRTHDAY: { label: 'CUMPLEAÑOS', cls: 'bg-blue-50/60 text-blue-900 border-blue-200' },
  GENERAL: { label: 'AVISO GENERAL', cls: 'bg-gray-50 text-gray-700 border-gray-200' },
};

export const AnnouncementsFeed = ({
  announcements,
  loading,
  isAdmin,
  actionLoading,
  onOpenStats,
  onConfirmDelete,
  onAcknowledge,
  onMarkAsRead,
}) => {
  if (loading) {
    return (
      <div className="bg-white p-12 text-center text-gray-400 text-xs rounded border border-gray-200">
        Cargando comunicados oficiales...
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded border border-gray-200">
        <p className="text-sm font-medium text-gray-700">Sin comunicados disponibles</p>
        <p className="text-xs text-gray-400 mt-1">
          No se encontraron avisos o políticas con los filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((ann) => {
        const catConfig = CATEGORY_MAP[ann.category] || CATEGORY_MAP.GENERAL;

        return (
          <div
            key={ann.id}
            className={`bg-white p-4 rounded border transition-colors ${
              ann.priority === 'URGENT' ? 'border-red-200' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start gap-3 pb-2 border-b border-gray-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.priority === 'URGENT' && (
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 font-mono font-semibold text-[10px] uppercase rounded">
                      URGENTE
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${catConfig.cls}`}
                  >
                    {catConfig.label}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono tabular-nums">
                    {new Date(ann.createdAt).toLocaleDateString('es-EC', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 pt-0.5">{ann.title}</h3>
                <p className="text-[11px] text-gray-400">
                  Publicado por: {ann.createdBy?.firstName}{' '}
                  {ann.createdBy?.lastName || 'Administración'}
                </p>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onOpenStats(ann.id)}
                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    Lecturas
                  </button>
                  <button
                    onClick={() => onConfirmDelete(ann)}
                    className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                    title="Eliminar comunicado"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            <div className="text-gray-700 text-xs leading-relaxed whitespace-pre-line py-3">
              {ann.content}
            </div>

            {ann.attachmentUrl && (
              <div className="pt-1 pb-2">
                <a
                  href={ann.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-mono"
                >
                  Ver Archivo Adjunto ↗
                </a>
              </div>
            )}

            {/* Acuse de recibo digital o confirmación de lectura */}
            {ann.requiresAcknowledgment ? (
              <div className="pt-3 border-t border-gray-100">
                {ann.isAcknowledged ? (
                  <div className="bg-emerald-50/60 border border-emerald-200 p-2.5 rounded flex items-center justify-between text-xs text-emerald-900">
                    <span className="font-medium">Acuse de recibo digital firmado</span>
                    <span className="text-[11px] text-emerald-700 font-mono tabular-nums">
                      {new Date(ann.readAt).toLocaleDateString('es-EC')}
                    </span>
                  </div>
                ) : (
                  <div className="bg-amber-50/60 border border-amber-200 p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs text-amber-900 font-medium">
                      Este comunicado requiere confirmación obligatoria de lectura.
                    </p>
                    <button
                      disabled={actionLoading}
                      onClick={() => onAcknowledge(ann.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
                    >
                      Firmar Acuse de Recibo
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                {ann.isRead ? (
                  <span className="text-[11px] text-gray-400 font-mono">
                    Lectura confirmada · {new Date(ann.readAt).toLocaleDateString('es-EC')}
                  </span>
                ) : (
                  <button
                    onClick={() => onMarkAsRead(ann.id)}
                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-[11px] px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    Marcar como leído
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementsFeed;
