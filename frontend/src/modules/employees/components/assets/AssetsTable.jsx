/**
 * @file AssetsTable.jsx
 * @description Tabla de inventario de dotación de activos, herramientas y EPPs asignados.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiArrowDownLeft, FiPrinter, FiEdit2, FiTrash2 } from 'react-icons/fi';

const CATEGORY_MAP = {
  EQUIPMENT: 'Cómputo y Tecnología',
  UNIFORM_PPE: 'EPP e Indumentaria',
  TOOL: 'Herramienta de Trabajo',
  ACCESS_CARD: 'Tarjeta de Acceso',
};

export const AssetsTable = ({
  filteredAssets = [],
  loading,
  onOpenReturnModal,
  onOpenActaModal,
  onOpenEditModal,
  onDeleteAsset,
}) => {
  const getCategoryLabel = (category) => CATEGORY_MAP[category] || category || 'Bien General';

  return (
    <div className="border border-gray-200 rounded-[4px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Activo / Dotación</th>
              <th className="py-2.5 px-4">Colaborador Custodio</th>
              <th className="py-2.5 px-4">Nº Serie / Código</th>
              <th className="py-2.5 px-4">Fecha Entrega</th>
              <th className="py-2.5 px-4">Estado</th>
              <th className="py-2.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400 font-mono text-xs">
                  Cargando registro de dotación y activos...
                </td>
              </tr>
            ) : filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400 text-xs">
                  No se encontraron activos o EPPs registrados con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors"
                >
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-gray-900">{asset.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-gray-100 text-gray-600 border border-gray-200">
                        {getCategoryLabel(asset.category)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Condición:{' '}
                        {asset.condition === 'NEW'
                          ? 'Nuevo'
                          : asset.condition === 'GOOD'
                            ? 'Buen Estado'
                            : 'Regular'}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-4">
                    <span className="font-medium text-gray-900">
                      {asset.employee
                        ? `${asset.employee.firstName} ${asset.employee.lastName}`
                        : 'No asignado'}
                    </span>
                    <p className="text-[11px] text-gray-400">
                      {asset.employee?.department || 'General'} · C.I.:{' '}
                      {asset.employee?.identityCard || 'S/N'}
                    </p>
                  </td>

                  <td className="py-2.5 px-4 font-mono tabular-nums text-gray-800">
                    {asset.serialNumber || 'S/N'}
                  </td>

                  <td className="py-2.5 px-4 font-mono tabular-nums text-gray-600">
                    {asset.deliveryDate
                      ? new Date(asset.deliveryDate).toLocaleDateString('es-EC')
                      : '—'}
                  </td>

                  <td className="py-2.5 px-4">
                    {asset.status === 'DELIVERED' ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200">
                        EN CUSTODIA
                      </span>
                    ) : asset.status === 'RETURNED' ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[4px] border border-emerald-200">
                        DEVUELTO (
                        {asset.returnDate
                          ? new Date(asset.returnDate).toLocaleDateString('es-EC')
                          : 'Bodega'}
                        )
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[4px] border border-rose-200">
                        EXTRAVIADO / DAÑADO
                      </span>
                    )}
                    {asset.returnNotes && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">
                        Nota: {asset.returnNotes}
                      </p>
                    )}
                  </td>

                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {asset.status === 'DELIVERED' && (
                        <button
                          type="button"
                          onClick={() => onOpenReturnModal(asset)}
                          className="border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 text-xs px-2 py-1 rounded-[4px] transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Registrar devolución de activo a bodega"
                        >
                          <FiArrowDownLeft className="w-3 h-3 text-blue-600" />
                          <span>Devolución</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenActaModal(asset)}
                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-xs p-1.5 rounded-[4px] transition-colors cursor-pointer"
                        title="Ver / Imprimir Acta de Entrega - Recepción"
                      >
                        <FiPrinter className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEditModal(asset)}
                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-xs p-1.5 rounded-[4px] transition-colors cursor-pointer"
                        title="Editar detalles del activo"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteAsset(asset.id)}
                        className="border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-200 text-xs p-1.5 rounded-[4px] transition-colors cursor-pointer"
                        title="Eliminar registro"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetsTable;
