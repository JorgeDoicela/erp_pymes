/**
 * @file RubroCatalogTable.jsx
 * @description Tabla de catálogo de rubros con edición en línea y tipología legal
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiCpu } from 'react-icons/fi';
import { SYSTEM_DYNAMIC_RUBROS } from './payrollConstants';

export const RubroCatalogTable = ({
  items,
  loading,
  editingIndex,
  editItem,
  setEditItem,
  editItemMode,
  setEditItemMode,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemoveItem,
}) => {
  const inputClass =
    'w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors';

  return (
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
                No hay rubros configurados. Haz clic en "Cargar Plantilla IESS / Ley" para iniciar.
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
                            onClick={onCancelEdit}
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
                          className={`text-xs font-semibold ${
                            item.type === 'EARNING' ? 'text-emerald-700' : 'text-red-700'
                          }`}
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
  );
};

export default RubroCatalogTable;
