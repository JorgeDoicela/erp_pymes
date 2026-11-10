/**
 * @file AnnouncementsSidebar.jsx
 * @description Barra lateral con lista rápida de cumpleaños del mes
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const AnnouncementsSidebar = ({ birthdays }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
        <div className="border-b border-gray-100 pb-2">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Cumpleaños del Mes
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Colaboradores que celebran este mes.</p>
        </div>

        <div className="space-y-2">
          {birthdays.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin cumpleaños registrados</p>
          ) : (
            birthdays.map((bday) => (
              <div
                key={bday.id}
                className="p-2.5 bg-gray-50/60 rounded flex items-center justify-between border border-gray-100 text-xs"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {bday.firstName} {bday.lastName}
                  </p>
                  <p className="text-[11px] text-gray-400">{bday.department || 'General'}</p>
                </div>
                <span className="font-mono text-xs text-gray-700 font-semibold bg-white border border-gray-200 px-2 py-0.5 rounded tabular-nums">
                  Día {bday.day}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsSidebar;
