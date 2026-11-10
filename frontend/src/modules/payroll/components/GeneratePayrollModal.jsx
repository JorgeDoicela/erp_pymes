/**
 * @file GeneratePayrollModal.jsx
 * @description Modal para parametrizar y emitir el cálculo automático de nómina legal
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { Modal } from '../../../core/ui/Modal.jsx';
import { Button } from '../../../core/ui/Button.jsx';
import { Select } from '../../../core/ui/Select.jsx';
import { Input } from '../../../core/ui/Input.jsx';

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export const GeneratePayrollModal = ({
  isOpen,
  onClose,
  onSubmit,
  params,
  setParams,
  generating,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Generar Nueva Nómina"
    subtitle="Cálculo legal bajo Código del Trabajo e IESS"
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={generating}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onSubmit} loading={generating} disabled={generating}>
          {generating ? 'Calculando...' : 'Generar Nómina'}
        </Button>
      </>
    }
  >
    <div className="space-y-4">
      <Select
        label="Mes a Procesar"
        value={params.month}
        onChange={(e) => setParams({ ...params, month: parseInt(e.target.value, 10) })}
        options={MONTHS}
      />

      <Input
        label="Año Fiscal"
        type="number"
        min="2020"
        max="2040"
        mono
        value={params.year}
        onChange={(e) => setParams({ ...params, year: parseInt(e.target.value, 10) })}
      />

      <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-100">
        Se liquidarán automáticamente horas suplementarias (50%), extraordinarias (100%), recargos
        nocturnos, aportes al IESS (9.45% personal / 11.15% patronal) y provisiones de ley.
      </p>
    </div>
  </Modal>
);

export default GeneratePayrollModal;
