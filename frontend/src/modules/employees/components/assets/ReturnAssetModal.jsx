/**
 * @file ReturnAssetModal.jsx
 * @description Modal de recepción y devolución de activo a bodega con estado físico y notas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '@core/ui/Modal';

export const ReturnAssetModal = ({
  isOpen,
  onClose,
  selectedAsset,
  returnForm,
  setReturnForm,
  onSubmit,
  actionLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen && !!selectedAsset}
      onClose={onClose}
      title="Registrar Devolución de Activo"
      size="md"
    >
      {selectedAsset && (
        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-[4px] text-xs">
            <p className="font-semibold text-gray-900">{selectedAsset.name}</p>
            <p className="text-gray-500 mt-0.5">
              Custodio: {selectedAsset.employee?.firstName} {selectedAsset.employee?.lastName}{' '}
              (Serie: {selectedAsset.serialNumber || 'S/N'})
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Estado al Recibir
            </label>
            <select
              className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
              value={returnForm.status}
              onChange={(e) => setReturnForm({ ...returnForm, status: e.target.value })}
            >
              <option value="RETURNED">Devuelto a Bodega (Operativo / Buen Estado)</option>
              <option value="LOST_DAMAGED">Reportar Daño Grave o Extravío</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Condición Física de Recepción
            </label>
            <select
              className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
              value={returnForm.condition}
              onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
            >
              <option value="GOOD">Buen Estado</option>
              <option value="FAIR">Desgaste Normal de Uso</option>
              <option value="DAMAGED">Dañado / Requiere Reparación</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Observaciones / Novedades de Recepción
            </label>
            <textarea
              rows="2"
              placeholder="ej. Entregado con cargador original / Rayón en cubierta..."
              className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 resize-none"
              value={returnForm.returnNotes}
              onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })}
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
              {actionLoading ? 'Guardando...' : 'Confirmar Devolución'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ReturnAssetModal;
