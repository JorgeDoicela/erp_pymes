/**
 * @file AnnouncementsBirthdaysTab.jsx
 * @description Vista de tabla completa de colaboradores cumpleañeros del mes actual
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const AnnouncementsBirthdaysTab = ({ birthdays }) => {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
          Cumpleañeros del Mes Actual ({birthdays.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Colaborador</th>
              <th className="py-2.5 px-4">Departamento</th>
              <th className="py-2.5 px-4">Cargo / Posición</th>
              <th className="py-2.5 px-4 text-center">Día de Celebración</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {birthdays.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-12 text-center text-gray-400 text-xs">
                  No hay cumpleaños registrados este mes.
                </td>
              </tr>
            ) : (
              birthdays.map((bday) => (
                <tr key={bday.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-gray-900">
                    {bday.firstName} {bday.lastName}
                  </td>
                  <td className="py-2.5 px-4 text-gray-600">{bday.department || 'General'}</td>
                  <td className="py-2.5 px-4 text-gray-500">{bday.position || 'Colaborador'}</td>
                  <td className="py-2.5 px-4 text-center font-mono font-semibold text-gray-900 tabular-nums">
                    Día {bday.day}
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

export default AnnouncementsBirthdaysTab;
