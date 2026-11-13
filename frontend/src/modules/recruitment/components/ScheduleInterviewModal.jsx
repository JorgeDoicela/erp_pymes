/**
 * @file ScheduleInterviewModal.jsx
 * @description Modal de programación y agendamiento de entrevistas presenciales, virtuales y telefónicas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import PropTypes from 'prop-types';
import { FiMapPin, FiPhone, FiVideo } from 'react-icons/fi';
import { Button, Modal } from '@core/ui';

const MODALITIES = [
  {
    value: 'VIRTUAL',
    label: 'Virtual',
    icon: FiVideo,
    locationLabel: 'Enlace de Videollamada (Meet / Zoom / Teams) *',
    placeholder: 'https://meet.google.com/abc-defg-hij',
    inputType: 'url',
  },
  {
    value: 'PRESENTIAL',
    label: 'Presencial',
    icon: FiMapPin,
    locationLabel: 'Dirección / Sala de Reuniones *',
    placeholder: 'Ej: Av. Amazonas N34-12, Piso 4, Sala de Juntas B',
    inputType: 'text',
  },
  {
    value: 'PHONE',
    label: 'Telefónica',
    icon: FiPhone,
    locationLabel: 'Número de Contacto o Extensión *',
    placeholder: 'Ej: +593 99 123 4567 (se llamará al candidato)',
    inputType: 'text',
  },
];

export const ScheduleInterviewModal = ({
  isOpen,
  onClose,
  candidateName,
  interviewData,
  setInterviewData,
  interviewers = [],
  onSubmit,
  submitting,
}) => {
  const activeModality = MODALITIES.find((m) => m.value === interviewData.type) || MODALITIES[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agendar Entrevista"
      subtitle={`Programar sesión con ${candidateName}`}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <span className="block text-xs font-medium text-gray-700 mb-1.5">
            Modalidad de Entrevista
          </span>
          <div className="grid grid-cols-3 gap-2">
            {MODALITIES.map((mod) => {
              const Icon = mod.icon;
              const selected = interviewData.type === mod.value;
              return (
                <button
                  key={mod.value}
                  type="button"
                  onClick={() =>
                    setInterviewData({ ...interviewData, type: mod.value, location: '' })
                  }
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded border text-xs font-medium transition-colors cursor-pointer ${
                    selected
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={13} />
                  <span>{mod.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="interview-date"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Fecha *
            </label>
            <input
              id="interview-date"
              required
              type="date"
              value={interviewData.date}
              onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900 font-mono tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="interview-time"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Hora *
            </label>
            <input
              id="interview-time"
              required
              type="time"
              value={interviewData.time}
              onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900 font-mono tabular-nums"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="interview-location"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            {activeModality.locationLabel}
          </label>
          <input
            id="interview-location"
            required
            type={activeModality.inputType}
            placeholder={activeModality.placeholder}
            value={interviewData.location}
            onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900"
          />
        </div>

        {interviewers.length > 0 && (
          <div>
            <label
              htmlFor="interview-interviewer"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Entrevistador Responsable
            </label>
            <select
              id="interview-interviewer"
              value={interviewData.interviewerId || ''}
              onChange={(e) =>
                setInterviewData({ ...interviewData, interviewerId: e.target.value })
              }
              className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900"
            >
              <option value="">Yo mismo (usuario actual)</option>
              {interviewers.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                  {emp.position ? ` — ${emp.position}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="interview-notes" className="block text-xs font-medium text-gray-700 mb-1">
            Indicaciones para el Candidato / Notas (Opcional)
          </label>
          <textarea
            id="interview-notes"
            placeholder="Ej: Traer portafolio o preparar caso práctico..."
            value={interviewData.notes}
            onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded p-2 text-xs text-gray-900 focus:outline-none focus:border-gray-900 h-16 resize-none"
          />
        </div>

        <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={interviewData.sendEmail !== false}
            onChange={(e) => setInterviewData({ ...interviewData, sendEmail: e.target.checked })}
            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          <span className="text-xs text-gray-600 leading-snug">
            Notificar por correo electrónico al candidato con fecha, hora, modalidad y enlace o
            dirección de la entrevista.
          </span>
        </label>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={submitting}>
            {submitting ? 'Agendando...' : 'Confirmar Entrevista'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

ScheduleInterviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  candidateName: PropTypes.string.isRequired,
  interviewData: PropTypes.object.isRequired,
  setInterviewData: PropTypes.func.isRequired,
  interviewers: PropTypes.array,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

export default ScheduleInterviewModal;
