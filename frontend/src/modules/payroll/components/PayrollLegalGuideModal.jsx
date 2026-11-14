/**
 * @file PayrollLegalGuideModal.jsx
 * @description Panel lateral de base de cálculo mensual y modales de guía legal y confirmación.
 */

import React from 'react';
import { FiHelpCircle } from 'react-icons/fi';
import Modal from '@core/ui/Modal';

const inputClass =
  'w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors';
const labelClass = 'block text-[11px] font-medium text-gray-600 mb-1';

export const PayrollBaseParamsCard = ({ workingDays, onWorkingDaysChange }) => (
  <div className="bg-white border border-gray-200 rounded overflow-hidden h-fit space-y-4 p-4 text-xs">
    <div className="border-b border-gray-100 pb-2">
      <h3 className="font-semibold text-gray-900 uppercase tracking-wider text-xs flex items-center justify-between">
        <span>Base de Cálculo Mensual</span>
        <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          30 Días / 240 Horas
        </span>
      </h3>
    </div>

    <div>
      <label className={labelClass}>Días Laborables Estándar por Mes</label>
      <input
        type="number"
        min="1"
        max="31"
        className={`${inputClass} font-mono font-bold text-gray-900`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
        value={workingDays}
        onChange={(e) => onWorkingDaysChange(e.target.value)}
      />
      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
        <strong>Estándar Ecuatoriano: 30 días</strong> (Código del Trabajo Art. 82 e IESS). Se
        utiliza base 30 para liquidar sueldos regulares completos en todos los meses (febrero, meses
        de 31 días, etc.).
      </p>
    </div>

    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2 text-[11px] text-gray-600 leading-relaxed">
      <div className="font-semibold text-gray-800 flex items-center gap-1">
        <FiHelpCircle className="text-blue-600" size={13} />
        Cálculo de Días y Fechas en Ecuador:
      </div>
      <ul className="space-y-1.5 list-disc pl-4 text-gray-600">
        <li>
          <strong>Mes Completo (30 días):</strong> Si el colaborador trabaja el mes entero sin
          faltas, cobra el 100% de su sueldo base pactado.
        </li>
        <li>
          <strong>Ingresos / Salidas proporcionales:</strong> Si entra a mitad de mes (ej. el día
          15), se liquidan los días trabajados en base 30 (
          <span className="font-mono text-gray-800">Sueldo / 30 × Días</span>).
        </li>
        <li>
          <strong>Faltas injustificadas:</strong> Cada ausencia descuenta 1 día de labor (
          <span className="font-mono text-gray-800">Sueldo / 30</span>) más la fracción de descanso
          semanal.
        </li>
        <li>
          <strong>Valor Hora Ordinaria:</strong>{' '}
          <span className="font-mono text-gray-800">Sueldo / 240 horas</span> (30 días × 8 horas).
        </li>
      </ul>
    </div>

    <div className="border-t border-gray-100 pt-3">
      <p className="text-[11px] text-gray-500 font-medium">Versionado Activo:</p>
      <p className="text-[11px] text-gray-400 mt-0.5">
        Al guardar se genera una nueva versión activa para las próximas liquidaciones sin alterar
        nóminas ya cerradas o aprobadas.
      </p>
    </div>
  </div>
);

const PayrollLegalGuideModal = ({
  showGuideModal,
  setShowGuideModal,
  confirmModal,
  setConfirmModal,
}) => {
  return (
    <>
      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title="Normativa y Fórmulas Laborales (Ecuador)"
        subtitle="Código del Trabajo, IESS y Ministerio del Trabajo"
        size="lg"
        footer={
          <button
            onClick={() => setShowGuideModal(false)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shadow-xs"
          >
            Entendido
          </button>
        }
      >
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1.5">
            <h4 className="font-bold text-gray-900 text-xs">
              1. Base de Cálculo de 30 Días (Mes Comercial)
            </h4>
            <p className="text-[11px] text-gray-600">
              En Ecuador, los sueldos mensuales regulares cubren 30 días independientemente del mes
              calendario (28, 29, 30 o 31 días). El valor hora se calcula dividiendo el sueldo para{' '}
              <strong>240 horas</strong> (<span className="font-mono">30 días × 8 horas/día</span>).
            </p>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1.5">
            <h4 className="font-bold text-gray-900 text-xs">2. Recargos y Horas Extraordinarias</h4>
            <ul className="list-disc pl-4 text-[11px] text-gray-600 space-y-1">
              <li>
                <strong>Recargo Nocturno (25%):</strong> Turnos ordinarios entre las 19h00 y las
                06h00.
              </li>
              <li>
                <strong>Horas Suplementarias (50%):</strong> Trabajo posterior a la jornada hasta
                las 24h00 (<span className="font-mono">Hora × 1.50</span>).
              </li>
              <li>
                <strong>Horas Extraordinarias (100%):</strong> Fines de semana, feriados o de 24h00
                a 06h00 (<span className="font-mono">Hora × 2.00</span>).
              </li>
            </ul>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1.5">
            <h4 className="font-bold text-gray-900 text-xs">3. Aportes IESS y Beneficios de Ley</h4>
            <ul className="list-disc pl-4 text-[11px] text-gray-600 space-y-1">
              <li>
                <strong>Aporte Personal IESS (9.45%):</strong> Descuento sobre sueldo + horas extras
                + comisiones.
              </li>
              <li>
                <strong>Aporte Patronal IESS (12.15%):</strong> Costo a cargo de la empresa (no se
                descuenta al trabajador).
              </li>
              <li>
                <strong>Décimo Tercero (8.33%):</strong> Bono navideño equivalente a la doceava
                parte de lo ganado.
              </li>
              <li>
                <strong>Décimo Cuarto ($38.33):</strong> Bono escolar equivalente a 1/12 del SBU
                ($470 / 12).
              </li>
              <li>
                <strong>Fondos de Reserva (8.33%):</strong> A partir del año (mes 13) de labores
                continuas.
              </li>
            </ul>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
        title={confirmModal.title}
        size="sm"
        footer={
          <>
            <button
              onClick={() =>
                setConfirmModal({ open: false, title: '', message: '', onConfirm: null })
              }
              className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmModal.onConfirm}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shadow-xs"
            >
              Continuar
            </button>
          </>
        }
      >
        <div className="text-gray-600 leading-relaxed text-xs">{confirmModal.message}</div>
      </Modal>
    </>
  );
};

export default PayrollLegalGuideModal;
