/**
 * @file EmployeeSearchBox.jsx
 * @description Componente de búsqueda y selección de empleado para modo supervisor/asistencia.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const EmployeeSearchBox = ({
  isAdminOrSuperAdmin,
  foundEmployee,
  employeeId,
  setEmployeeId,
  onSearch,
  onClear,
  allowSearch,
}) => {
  if (!foundEmployee) {
    return (
      <div className="w-full mb-6 relative max-w-md mx-auto">
        <label className="block text-xs font-medium text-gray-600 mb-1 text-center">
          {isAdminOrSuperAdmin ? 'Buscar Empleado por Número de Cédula' : 'Número de Cédula'}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
            }}
            placeholder="Ingrese número de cédula..."
            className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 text-center font-mono"
          />
          <button
            type="button"
            onClick={onSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
          >
            Buscar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-6 relative max-w-md mx-auto">
      <div className="bg-gray-50 rounded-[4px] p-3 border border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[4px] bg-gray-200 text-gray-800 font-mono font-semibold text-xs flex items-center justify-center">
            {foundEmployee.firstName ? foundEmployee.firstName[0] : 'E'}
          </div>
          <div>
            <h3 className="font-semibold text-xs text-gray-900">
              {foundEmployee.firstName} {foundEmployee.lastName}
            </h3>
            <p className="text-[11px] text-gray-500">
              {foundEmployee.position} • {foundEmployee.department}
            </p>
          </div>
        </div>
        {allowSearch && (
          <button
            type="button"
            onClick={onClear}
            className="text-gray-600 hover:text-gray-900 px-2.5 py-1 bg-white border border-gray-200 rounded-[4px] text-xs transition-colors cursor-pointer"
          >
            Cambiar
          </button>
        )}
      </div>
    </div>
  );
};

export default EmployeeSearchBox;
