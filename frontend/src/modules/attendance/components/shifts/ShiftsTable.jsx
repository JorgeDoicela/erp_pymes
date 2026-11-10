/**
 * @file ShiftsTable.jsx
 * @description Catálogo y tabla de turnos de trabajo configurados con jornada efectiva y tolerancias.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const ShiftsTable = ({ shifts = [], loading, onEdit, onDelete }) => {
  const calculateShiftHours = (start, end, breakMin = 60) => {
    try {
      if (!start || !end) return '';
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let totalMins = eh * 60 + em - (sh * 60 + sm);
      if (totalMins < 0) totalMins += 24 * 60;
      const effectiveMins = Math.max(0, totalMins - (breakMin || 0));
      const hrs = (effectiveMins / 60).toFixed(1);
      return `${hrs}h efectivas (${breakMin}m almuerzo)`;
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Catálogo de Turnos
        </h3>
        <span
          className="text-[11px] font-mono text-gray-400 tabular-nums"
        >
          {shifts.length} {shifts.length === 1 ? 'turno configurado' : 'turnos configurados'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Nombre del Turno
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Horario
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Jornada Efectiva
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Tolerancia
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
                  Cargando turnos...
                </td>
              </tr>
            ) : shifts.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-400">
                  <p className="font-medium text-gray-700 text-xs">Sin turnos configurados</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Haga clic en "+ Nuevo Turno" para crear el primer horario.
                  </p>
                </td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{shift.name}</td>
                  <td className="py-3 px-4 font-mono text-gray-800 tabular-nums">
                    {shift.startTime} — {shift.endTime}
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-[11px] tabular-nums">
                    {calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes)}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-700 tabular-nums">
                    {shift.toleranceMinutes ?? 15} min
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(shift)}
                      className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-xs px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(shift)}
                      className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
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

export default ShiftsTable;
