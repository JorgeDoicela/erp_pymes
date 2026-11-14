/**
 * @file AddRubroForm.jsx
 * @description Formulario para añadir nuevos rubros o bonificaciones al catálogo
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiPlus } from 'react-icons/fi';

export const AddRubroForm = ({ newItem, setNewItem, newItemMode, setNewItemMode, onAddItem }) => {
  const inputClass =
    'w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors';
  const labelClass = 'block text-[11px] font-medium text-gray-600 mb-1';

  return (
    <form onSubmit={onAddItem} className="p-4 border-b border-gray-200 bg-gray-50/30 text-xs">
      <p className="font-semibold text-gray-800 text-xs mb-3 flex items-center gap-1.5">
        <FiPlus className="text-blue-600" /> Añadir Nuevo Rubro o Bonificación
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-4">
          <label className={labelClass}>Nombre del Rubro *</label>
          <input
            type="text"
            placeholder="Ej. Bono de Movilización"
            className={inputClass}
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
        </div>

        <div className="sm:col-span-3">
          <label className={labelClass}>Naturaleza *</label>
          <select
            className={inputClass}
            value={newItem.type}
            onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
          >
            <option value="EARNING">Ingreso (+)</option>
            <option value="DEDUCTION">Deducción (−)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-gray-600">Valor / Tasa *</label>
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <button
                type="button"
                onClick={() => setNewItemMode('PERCENTAGE')}
                className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                  newItemMode === 'PERCENTAGE'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-gray-400'
                }`}
              >
                % Tasa
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => setNewItemMode('FIXED')}
                className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                  newItemMode === 'FIXED' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-400'
                }`}
              >
                $ Fijo
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max={newItemMode === 'PERCENTAGE' ? 100 : undefined}
              placeholder={newItemMode === 'PERCENTAGE' ? 'Ej: 5.00%' : 'Ej: 50.00$'}
              className={`${inputClass} font-mono`}
              value={newItem.value}
              onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
            />
            <span className="absolute right-2.5 top-1.5 text-gray-400 font-mono text-xs pointer-events-none">
              {newItemMode === 'PERCENTAGE' ? '%' : 'USD'}
            </span>
          </div>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
          >
            + Añadir
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={newItem.isMandatory}
          onChange={(e) => setNewItem({ ...newItem, isMandatory: e.target.checked })}
          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-[11px] text-gray-600">
          Aplicar obligatoriamente a todos los colaboradores en cada rol regular
        </span>
      </label>
    </form>
  );
};

export default AddRubroForm;
