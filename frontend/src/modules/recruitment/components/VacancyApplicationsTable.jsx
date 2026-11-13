/**
 * @file VacancyApplicationsTable.jsx
 * @description Tabla de candidatos postulados a una vacante con cambio de etapa en línea
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import PropTypes from 'prop-types';
import { FiTrash2 } from 'react-icons/fi';
import { Button } from '@core/ui';

const VacancyApplicationsTable = ({
  applications,
  onSelectApplication,
  onStatusChange,
  onRequestDelete,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Candidato</th>
              <th className="py-2.5 px-4">Contacto</th>
              <th className="py-2.5 px-4">Fecha Postulación</th>
              <th className="py-2.5 px-4">Etapa del Pipeline</th>
              <th className="py-2.5 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.map((app) => {
              const initials =
                `${app.firstName?.[0] || ''}${app.lastName?.[0] || ''}`.toUpperCase();
              return (
                <tr key={app.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-gray-100 text-gray-700 font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectApplication(app.id)}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left block cursor-pointer"
                        >
                          {app.firstName} {app.lastName}
                        </button>
                        <span className="text-[11px] text-gray-400">
                          {app.coverLetter ? 'Carta adjunta' : 'Sin carta'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="text-gray-800">{app.email}</div>
                    <div className="text-[11px] text-gray-500 font-mono tabular-nums">
                      {app.phone || 'Sin teléfono'}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-gray-600 tabular-nums">
                    {new Date(app.createdAt).toLocaleDateString('es-EC')}
                  </td>
                  <td className="py-2.5 px-4">
                    <select
                      aria-label={`Etapa de ${app.firstName} ${app.lastName}`}
                      value={app.status}
                      onChange={(e) => onStatusChange(app, e.target.value)}
                      className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-gray-900 cursor-pointer"
                    >
                      <option value="PENDING">Postulado</option>
                      <option value="REVIEWING">En Revisión</option>
                      <option value="INTERVIEW">Entrevista</option>
                      <option value="TESTING">Pruebas</option>
                      <option value="OFFER">Oferta</option>
                      <option value="HIRED">Contratado</option>
                      <option value="REJECTED">Descartado</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSelectApplication(app.id)}
                      >
                        Ver Expediente
                      </Button>
                      <button
                        type="button"
                        onClick={() => onRequestDelete(app)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Eliminar candidato"
                        aria-label="Eliminar candidato"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

VacancyApplicationsTable.propTypes = {
  applications: PropTypes.array.isRequired,
  onSelectApplication: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onRequestDelete: PropTypes.func.isRequired,
};

export default VacancyApplicationsTable;
