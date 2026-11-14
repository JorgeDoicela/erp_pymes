/**
 * @file PayrollRubrosTable.jsx
 * @description Formulario de alta y tabla de edición de rubros de nómina.
 */

import React from 'react';
import { FiPlus, FiCpu } from 'react-icons/fi';
import { SYSTEM_DYNAMIC_RUBROS } from '../constants/payrollLegalRubros.constants';

const inputClass =
  'w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors';
const labelClass = 'block text-[11px] font-medium text-gray-600 mb-1';

const PayrollRubrosTable = ({
  items,
  loading,
  newItem,
  setNewItem,
  newItemMode,
  setNewItemMode,
  onAddItem,
  editingIndex,
  setEditingIndex,
  editItem,
  setEditItem,
  editItemMode,
  setEditItemMode,
  onStartEdit,
  onSaveEdit,
  onRemoveItem,
}) => {
  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Catálogo de Rubros y Conceptos
        </h3>
        <span
          className="text-[11px] font-mono text-gray-500"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {items.length} {items.length === 1 ? 'rubro' : 'rubros'}
        </span>
      </div>

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
                  className={`px-1.5 py-0.5 rounded font-mono font-medium ${newItemMode === 'PERCENTAGE' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-400'}`}
                >
                  % Tasa
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setNewItemMode('FIXED')}
                  className={`px-1.5 py-0.5 rounded font-mono font-medium ${newItemMode === 'FIXED' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-400'}`}
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

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200">
              <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Rubro / Concepto
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Modo de Cálculo / Valor
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Aplicación
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400 text-xs">
                  Cargando catálogo de rubros...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-400">
                  No hay rubros configurados. Haz clic en "Cargar Plantilla IESS / Ley" para
                  iniciar.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const dynamicInfo = SYSTEM_DYNAMIC_RUBROS[item.name];
                const isEditing = editingIndex === index;

                return (
                  <tr key={item.id || index} className="hover:bg-gray-50/60 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            className={inputClass}
                            value={editItem.name}
                            onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-4">
                          <select
                            className={inputClass}
                            value={editItem.type}
                            onChange={(e) => setEditItem({ ...editItem, type: e.target.value })}
                          >
                            <option value="EARNING">Ingreso (+)</option>
                            <option value="DEDUCTION">Deducción (−)</option>
                          </select>
                        </td>
                        <td className="py-2 px-4">
                          {dynamicInfo ? (
                            <div className="text-[11px] text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
                              {dynamicInfo.tag} (Automático)
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <select
                                className="w-20 bg-white border border-gray-200 rounded px-1.5 py-1 text-[11px]"
                                value={editItemMode}
                                onChange={(e) => setEditItemMode(e.target.value)}
                              >
                                <option value="PERCENTAGE">% Tasa</option>
                                <option value="FIXED">$ Fijo</option>
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                className={`${inputClass} font-mono`}
                                value={editItem.value}
                                onChange={(e) =>
                                  setEditItem({ ...editItem, value: e.target.value })
                                }
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editItem.isMandatory}
                              onChange={(e) =>
                                setEditItem({ ...editItem, isMandatory: e.target.checked })
                              }
                              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-[11px] text-gray-600">Obligatorio</span>
                          </label>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={onSaveEdit}
                              className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="px-2.5 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          {dynamicInfo && (
                            <div className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                              {dynamicInfo.desc}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`text-xs font-semibold ${item.type === 'EARNING' ? 'text-emerald-700' : 'text-red-700'}`}
                          >
                            {item.type === 'EARNING' ? 'Ingreso (+)' : 'Deducción (−)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {dynamicInfo ? (
                            <span className="text-[11px] font-sans font-medium text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                              <FiCpu size={11} className="text-gray-500" />
                              {dynamicInfo.tag}
                            </span>
                          ) : item.percentage !== null && item.percentage !== undefined ? (
                            <span className="text-xs font-bold text-gray-900 tabular-nums">
                              {parseFloat(item.percentage).toFixed(2)}%
                            </span>
                          ) : item.fixedValue !== null && item.fixedValue !== undefined ? (
                            <span className="text-xs font-bold text-gray-900 tabular-nums">
                              ${parseFloat(item.fixedValue).toFixed(2)} USD
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-gray-600 text-[11px]">
                          {item.isMandatory ? (
                            <span className="text-blue-800 font-medium bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                              Obligatorio General
                            </span>
                          ) : (
                            <span className="text-gray-500">Opcional / Por Caso</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onStartEdit(index)}
                              className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                            {!dynamicInfo && (
                              <button
                                type="button"
                                onClick={() => onRemoveItem(index)}
                                className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollRubrosTable;
