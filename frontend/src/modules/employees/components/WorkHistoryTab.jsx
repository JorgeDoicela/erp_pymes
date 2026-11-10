/**
 * @file WorkHistoryTab.jsx
 * @description Pestaña de historial de auditoría y modificaciones de perfil de colaborador.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const WorkHistoryTab = ({ history = [] }) => {
  return (
    <div className="space-y-3">
      {history && history.length > 0 ? (
        history.map((log) => (
          <div
            key={log.id}
            className="bg-white p-3.5 rounded-[4px] border border-gray-200 text-xs space-y-1.5"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
              <span className="font-semibold text-gray-900">{log.action}</span>
              <span className="text-[11px] font-mono text-gray-400 tabular-nums">
                {new Date(log.timestamp).toLocaleString('es-EC')}
              </span>
            </div>
            <div className="text-gray-600 space-y-0.5">
              {Object.keys(log.details || {}).map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium capitalize">{field}:</span>
                  <span className="line-through text-red-500 font-mono">
                    {log.details[field]?.from}
                  </span>
                  <span className="text-gray-300">→</span>
                  <span className="text-emerald-700 font-semibold font-mono">
                    {log.details[field]?.to}
                  </span>
                </div>
              ))}
              {(!log.details || Object.keys(log.details).length === 0) && (
                <span className="text-gray-400 italic">Sin detalles registrados</span>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="py-8 text-center text-gray-400 text-xs">
          No hay historial de cambios registrado.
        </div>
      )}
    </div>
  );
};

export default WorkHistoryTab;
