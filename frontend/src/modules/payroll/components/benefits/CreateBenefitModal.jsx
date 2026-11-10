/**
 * @file CreateBenefitModal.jsx
 * @description Modal para crear y asignar un beneficio individual a un colaborador
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { Modal } from '../../../../core/ui/Modal.jsx';
import { Button } from '../../../../core/ui/Button.jsx';
import { Input } from '../../../../core/ui/Input.jsx';
import { Select } from '../../../../core/ui/Select.jsx';

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
  { value: 'ONE_TIME', label: 'Pago Único (Próximo Rol)' },
  { value: 'RECURRING', label: 'Recurrente (Mensual Fijo)' },
];

export const CreateBenefitModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  employees = [],
  loading = false,
}) => {
  const employeeOptions = [
    { value: '', label: 'Seleccione un colaborador...' },
    ...employees.map((emp) => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName} — ${emp.department || 'General'} (${emp.position || 'Colaborador'})`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Beneficio Individual"
      subtitle="Asigne un bono o viático a un colaborador específico."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSubmit} loading={loading} disabled={loading}>
            Asignar Beneficio
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Colaborador"
          value={formData.employeeId}
          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
          options={employeeOptions}
        />

        <Input
          label="Concepto / Descripción"
          placeholder="Ej. Bono de Cumplimiento de Metas, Viático Movilización..."
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
            placeholder="0.00"
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

export default CreateBenefitModal;
