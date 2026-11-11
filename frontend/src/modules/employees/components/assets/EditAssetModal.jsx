/**
 * @file EditAssetModal.jsx
 * @description Modal de edición de datos generales del activo dotado.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '@core/ui/Modal';

export const EditAssetModal = ({
  isOpen,
  onClose,
  selectedAsset,
  editForm,
  setEditForm,
  onSubmit,
  actionLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen && !!selectedAsset}
      onClose={onClose}
      title="Editar Información del Activo"
      size="md"
    >
      {selectedAsset && (
        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nombre del Activo
            </label>
            <input
              type="text"
              required
              className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nº Serie / Código
            </label>
            <input
              type="text"
              className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-600"
              value={editForm.serialNumber}
              onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select
                className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                <option value="EQUIPMENT">Cómputo y Tecnología</option>
                <option value="UNIFORM_PPE">EPP e Indumentaria</option>
                <option value="TOOL">Herramienta de Trabajo</option>
                <option value="ACCESS_CARD">Tarjeta de Acceso</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Condición</label>
              <select
                className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                value={editForm.condition}
                onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
              >
                <option value="NEW">Nuevo</option>
                <option value="GOOD">Bueno</option>
                <option value="FAIR">Regular</option>
              </select>
            </div>
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
              {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditAssetModal;
