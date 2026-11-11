/**
 * @file LegalGuideModal.jsx
 * @description Modal con la normativa laboral ecuatoriana y fórmulas oficiales
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '@core/ui/Modal';

export const LegalGuideModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Normativa y Fórmulas Laborales (Ecuador)"
      subtitle="Código del Trabajo, IESS y Ministerio del Trabajo"
      size="lg"
      footer={
        <button
          onClick={onClose}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shadow-xs"
        >
          Entendido
        </button>
      }
    >
      <div className="space-y-4 text-gray-700 leading-relaxed text-xs">
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
              <strong>Horas Suplementarias (50%):</strong> Trabajo posterior a la jornada hasta las
              24h00 (<span className="font-mono">Hora × 1.50</span>).
            </li>
            <li>
              <strong>Horas Extraordinarias (100%):</strong> Fines de semana, feriados o de 24h00 a
              06h00 (<span className="font-mono">Hora × 2.00</span>).
            </li>
          </ul>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1.5">
          <h4 className="font-bold text-gray-900 text-xs">3. Aportes IESS y Beneficios de Ley</h4>
          <ul className="list-disc pl-4 text-[11px] text-gray-600 space-y-1">
            <li>
              <strong>Aporte Personal IESS (9.45%):</strong> Descuento sobre sueldo + horas extras +
              comisiones.
            </li>
            <li>
              <strong>Aporte Patronal IESS (12.15%):</strong> Costo a cargo de la empresa (no se
              descuenta al trabajador).
            </li>
            <li>
              <strong>Décimo Tercero (8.33%):</strong> Bono navideño equivalente a la doceava parte
              de lo ganado.
            </li>
            <li>
              <strong>Décimo Cuarto ($38.33):</strong> Bono escolar equivalente a 1/12 del SBU ($470
              / 12).
            </li>
            <li>
              <strong>Fondos de Reserva (8.33%):</strong> A partir del año (mes 13) de labores
              continuas.
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default LegalGuideModal;
