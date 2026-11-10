/**
 * @file DeliverAssetModal.jsx
 * @description Modal de asignación y registro de entrega de activo / EPP a un colaborador.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '../../../../components/common/Modal';

export const DeliverAssetModal = ({
  isOpen,
  onClose,
  employees = [],
  deliverForm,
  setDeliverForm,
  onSubmit,
  actionLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Entrega de Activo / EPP"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Colaborador Receptor
          </label>
          <select
            required
            className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
            value={deliverForm.employeeId}
            onChange={(e) => setDeliverForm({ ...deliverForm, employeeId: e.target.value })}
          >
            <option value="">-- Selecciona un Colaborador --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.identityCard || 'S/N'}) -{' '}
                {emp.department || 'General'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nombre y Descripción del Activo / Dotación
          </label>
          <input
            type="text"
            required
            placeholder="ej. Laptop Lenovo ThinkPad T14, Casco Dieléctrico Talla M, etc."
            className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
            value={deliverForm.name}
            onChange={(e) => setDeliverForm({ ...deliverForm, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
            <select
              className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
              value={deliverForm.category}
              onChange={(e) => setDeliverForm({ ...deliverForm, category: e.target.value })}
            >
              <option value="EQUIPMENT">Cómputo y Tecnología</option>
              <option value="UNIFORM_PPE">EPP e Indumentaria</option>
              <option value="TOOL">Herramienta de Trabajo</option>
              <option value="ACCESS_CARD">Tarjeta de Acceso</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nº Serie / Código Inventario
            </label>
            <input
              type="text"
              placeholder="ej. SN-883921"
              className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-600"
              value={deliverForm.serialNumber}
              onChange={(e) => setDeliverForm({ ...deliverForm, serialNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Condición de Entrega
            </label>
            <select
              className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
              value={deliverForm.condition}
              onChange={(e) => setDeliverForm({ ...deliverForm, condition: e.target.value })}
            >
              <option value="NEW">Nuevo / Sin Uso</option>
              <option value="GOOD">Buen Estado / Operativo</option>
              <option value="FAIR">Regular con Desgaste</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fecha de Entrega
            </label>
            <input
              type="date"
              className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-600 tabular-nums"
              value={deliverForm.deliveryDate}
              onChange={(e) => setDeliverForm({ ...deliverForm, deliveryDate: e.target.value })}
            />
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
            {actionLoading ? 'Guardando...' : 'Confirmar Entrega'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DeliverAssetModal;
