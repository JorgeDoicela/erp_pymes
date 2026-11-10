/**
 * @file BulkShiftAssignment.jsx
 * @description Panel maestro de asignación masiva de turnos de trabajo a colaboradores.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const BulkShiftAssignment = ({
  shifts = [],
  filteredEmployees = [],
  selectedEmployees = [],
  empSearch,
  setEmpSearch,
  toggleEmployee,
  toggleAllEmployees,
  assignmentData,
  setAssignmentData,
  toggleDayOfWeek,
  allDays = [],
  assigning,
  onAssignShifts,
}) => {
  const inputClass =
    'w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Panel de Selección de Colaboradores */}
      <div className="lg:col-span-7 bg-white border border-gray-200 rounded-[4px] overflow-hidden flex flex-col">
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              1. Seleccionar Colaboradores
            </h3>
            <span className="text-[11px] font-mono text-gray-500 tabular-nums">
              {selectedEmployees.length} de {filteredEmployees.length} seleccionados
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAllEmployees}
              className="px-2.5 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-[4px] transition-colors cursor-pointer"
            >
              {selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0
                ? 'Deseleccionar Todos'
                : 'Seleccionar Todos'}
            </button>
          </div>
        </div>

        {/* Buscador de Colaboradores */}
        <div className="p-3 border-b border-gray-100 bg-gray-50/30">
          <input
            type="text"
            placeholder="Filtrar por nombre, cargo o departamento..."
            className={inputClass}
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
          />
        </div>

        {/* Lista con Checkboxes */}
        <div className="h-96 overflow-y-auto divide-y divide-gray-100">
          {filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No se encontraron colaboradores.
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const isSelected = selectedEmployees.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => toggleEmployee(emp.id)}
                  className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                    isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 rounded-[2px] border-gray-300 text-blue-600"
                    />
                    <div>
                      <p
                        className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
                      >
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {emp.position || 'Sin cargo'} · {emp.department || 'General'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Panel de Configuración del Horario */}
      <div className="lg:col-span-5 bg-white border border-gray-200 rounded-[4px] overflow-hidden h-fit">
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            2. Parámetros del Horario
          </h3>
        </div>

        <form onSubmit={onAssignShifts} className="p-4 space-y-4">
          <div>
            <label className={labelClass}>Turno a Asignar</label>
            <select
              className={inputClass}
              value={assignmentData.shiftId}
              onChange={(e) =>
                setAssignmentData({ ...assignmentData, shiftId: e.target.value })
              }
              required
            >
              <option value="">Seleccione un turno...</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime}–{s.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* Días de la Semana */}
          <div>
            <label className={labelClass}>Días Aplicables</label>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {allDays.map((day) => {
                const isSelected = assignmentData.daysOfWeek.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.key)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-[4px] border transition-colors cursor-pointer text-center ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fechas de Vigencia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fecha Inicio</label>
              <input
                type="date"
                className={`${inputClass} font-mono tabular-nums`}
                value={assignmentData.startDate}
                onChange={(e) =>
                  setAssignmentData({ ...assignmentData, startDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className={labelClass}>Fecha Fin (Opcional)</label>
              <input
                type="date"
                className={`${inputClass} font-mono tabular-nums`}
                value={assignmentData.endDate}
                onChange={(e) =>
                  setAssignmentData({ ...assignmentData, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Si no especifica fecha de fin, el horario tendrá vigencia indefinida hasta que sea
            reasignado.
          </p>

          <div className="border-t border-gray-100 pt-3">
            <button
              type="submit"
              disabled={assigning || selectedEmployees.length === 0}
              className="w-full px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[4px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning
                ? 'Asignando horarios...'
                : `Asignar a ${selectedEmployees.length} colaborador${selectedEmployees.length !== 1 ? 'es' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkShiftAssignment;
