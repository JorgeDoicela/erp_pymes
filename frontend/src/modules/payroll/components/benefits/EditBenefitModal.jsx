/**
 * @file EditBenefitModal.jsx
 * @description Modal para editar un beneficio existente
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { Modal, Button, Input, Select } from '@core/ui';

const BENEFIT_TYPES = [
  { value: 'BONUS', label: 'Bono Imponible (Aporta IESS 9.45%)' },
  { value: 'COMMISSION', label: 'Comisiones por Ventas (Aporta IESS)' },
  { value: 'INCENTIVE', label: 'Incentivo de Productividad / Bienestar' },
  { value: 'HEALTH', label: 'Seguro Médico / Asistencia Privada (Exento IESS)' },
  { value: 'MEAL', label: 'Alimentación / Almuerzos (Exento IESS)' },
  { value: 'TRANSPORT', label: 'Movilización / Transporte (No imponible)' },
  { value: 'ALLOWANCE', label: 'Viáticos por Comisión de Servicios' },
];

const FREQUENCIES = [
  { value: 'ONE_TIME', label: 'Pago Único' },
  { value: 'RECURRING', label: 'Recurrente' },
];

export const EditBenefitModal = ({
  isOpen,
  onClose,
  benefit,
  formData,
  setFormData,
  onSubmit,
  loading = false,
}) => {
  if (!benefit) return null;

  const employeeName = benefit.employee
    ? `${benefit.employee.firstName || ''} ${benefit.employee.lastName || ''}`.trim()
    : 'Colaborador';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Beneficio"
      subtitle={`Colaborador: ${employeeName}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSubmit} loading={loading} disabled={loading}>
            Guardar Cambios
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Concepto / Descripción"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Monto ($ USD)"
            type="number"
            step="0.01"
            min="0.01"
            mono
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
          <Select
            label="Frecuencia"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            options={FREQUENCIES}
          />
        </div>

        <Select
          label="Categoría Legal / Tributaria"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          options={BENEFIT_TYPES}
        />
      </div>
    </Modal>
  );
};

export default EditBenefitModal;
