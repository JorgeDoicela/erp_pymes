/**
 * @file ShiftAssignmentsTable.jsx
 * @description Tabla de asignaciones activas de horarios a colaboradores con filtro de búsqueda.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const ShiftAssignmentsTable = ({
  schedules = [],
  filteredSchedules = [],
  scheduleSearch,
  setScheduleSearch,
  loading,
  onDeleteSchedule,
}) => {
  const parseDays = (days) => {
    try {
      if (Array.isArray(days)) return days.join(', ');
      if (typeof days === 'string') {
        const parsed = JSON.parse(days);
        return Array.isArray(parsed) ? parsed.join(', ') : days;
      }
      return 'Lunes a Viernes';
    } catch {
      return typeof days === 'string' ? days : 'Lunes a Viernes';
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtro */}
      <div className="bg-white border border-gray-200 rounded-[4px] px-4 py-3 flex items-center justify-between gap-3">
        <div className="w-full max-w-sm">
          <input
            type="text"
            placeholder="Buscar colaborador, turno o departamento..."
            className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
            value={scheduleSearch}
            onChange={(e) => setScheduleSearch(e.target.value)}
          />
        </div>
        <span className="text-[11px] text-gray-500 shrink-0 font-mono tabular-nums">
          Mostrando {filteredSchedules.length} de {schedules.length} asignaciones
        </span>
      </div>

      {/* Tabla de Asignaciones */}
      <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Turno
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Días Asignados
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Vigencia
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 text-xs">
                    Cargando asignaciones...
                  </td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-400">
                    <p className="font-medium text-gray-700 text-xs">Sin horarios asignados</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Vaya a la pestaña "Asignación Masiva" para asignar turnos a su equipo.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">
                        {sch.employee?.firstName} {sch.employee?.lastName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {sch.employee?.position || sch.employee?.department || 'General'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{sch.shift?.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono tabular-nums">
                        {sch.shift?.startTime} — {sch.shift?.endTime}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{parseDays(sch.daysOfWeek)}</td>
                    <td className="py-3 px-4 font-mono text-gray-700 text-[11px] tabular-nums">
                      {new Date(sch.startDate).toLocaleDateString('es-EC')} —{' '}
                      {sch.endDate
                        ? new Date(sch.endDate).toLocaleDateString('es-EC')
                        : 'Indefinida'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteSchedule(sch)}
                        className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer"
                      >
                        Desasignar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShiftAssignmentsTable;
