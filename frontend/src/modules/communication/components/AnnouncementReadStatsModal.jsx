/**
 * @file AnnouncementReadStatsModal.jsx
 * @description Modal de auditoría y métricas de acuses de recibo y lecturas
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '@core/ui/Modal';

export const AnnouncementReadStatsModal = ({ isOpen, onClose, selectedStats }) => {
  return (
    <Modal
      isOpen={isOpen && !!selectedStats}
      onClose={onClose}
      title="Control de Lectura y Acuses"
      subtitle={selectedStats?.announcement?.title}
      size="lg"
      footer={
        <button
          onClick={onClose}
          className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      }
    >
      {selectedStats && (
        <div className="space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Métricas */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
                Lecturas Confirmadas
              </span>
              <span className="text-base font-semibold text-gray-900 tabular-nums">
                {selectedStats.metrics?.totalReads} / {selectedStats.metrics?.totalActiveEmployees}
              </span>
              <span className="text-[11px] text-gray-500 block">
                ({selectedStats.metrics?.readPercentage}%)
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
                Acuses Firmados
              </span>
              <span className="text-base font-semibold text-emerald-700 tabular-nums">
                {selectedStats.metrics?.totalAcknowledged} /{' '}
                {selectedStats.metrics?.totalActiveEmployees}
              </span>
              <span className="text-[11px] text-gray-500 block">
                ({selectedStats.metrics?.acknowledgedPercentage}%)
              </span>
            </div>
          </div>

          {/* Colaboradores con lectura registrada */}
          <div>
            <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Colaboradores que leyeron ({selectedStats.reads?.length || 0})
            </h4>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded max-h-36 overflow-y-auto">
              {selectedStats.reads && selectedStats.reads.length > 0 ? (
                selectedStats.reads.map((r) => (
                  <div key={r.id} className="p-2 flex items-center justify-between text-xs">
                    <span>
                      {r.employee?.firstName} {r.employee?.lastName}
                    </span>
                    <span className="font-mono text-[11px] text-gray-400 tabular-nums">
                      {new Date(r.readAt).toLocaleDateString('es-EC')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="p-3 text-center text-gray-400 text-xs">Sin lecturas registradas</p>
              )}
            </div>
          </div>

          {/* Colaboradores pendientes */}
          <div>
            <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Colaboradores pendientes ({selectedStats.pendingEmployees?.length || 0})
            </h4>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded max-h-36 overflow-y-auto">
              {selectedStats.pendingEmployees && selectedStats.pendingEmployees.length > 0 ? (
                selectedStats.pendingEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-2 flex items-center justify-between text-gray-600 text-xs"
                  >
                    <span>
                      {emp.firstName} {emp.lastName}
                    </span>
                    <span className="text-[11px] text-gray-400">{emp.department || 'General'}</span>
                  </div>
                ))
              ) : (
                <p className="p-3 text-center text-emerald-600 font-medium text-xs">
                  ¡Todos los colaboradores han leído el comunicado!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AnnouncementReadStatsModal;
