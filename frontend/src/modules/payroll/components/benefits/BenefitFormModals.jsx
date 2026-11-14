/**
 * @file BenefitFormModals.jsx
 * @description Modales de creación individual, edición y confirmación de cancelación de beneficios.
 */

import React from 'react';
import Modal from '@core/ui/Modal';

const inputClass =
  'w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

const CATEGORY_OPTIONS = [
  { value: 'BONUS', label: 'Bono Imponible (Aporta IESS 9.45%)' },
  { value: 'COMMISSION', label: 'Comisiones por Ventas (Aporta IESS)' },
  { value: 'INCENTIVE', label: 'Incentivo de Productividad / Bienestar' },
  { value: 'HEALTH', label: 'Seguro Médico / Asistencia Privada (Exento IESS)' },
  { value: 'MEAL', label: 'Alimentación / Almuerzos (Exento IESS)' },
  { value: 'TRANSPORT', label: 'Movilización / Transporte (No imponible)' },
  { value: 'ALLOWANCE', label: 'Viáticos por Comisión de Servicios' },
];

const BenefitFields = ({ data, setData }) => (
  <>
    <div>
      <label className={labelClass}>Concepto / Descripción</label>
      <input
        type="text"
        required
        className={inputClass}
        placeholder="Ej. Bono de Cumplimiento de Metas, Viático Movilización..."
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelClass}>Monto ($ USD)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          required
          className={inputClass + ' font-mono'}
          placeholder="0.00"
          value={data.amount}
          onChange={(e) => setData({ ...data, amount: e.target.value })}
        />
      </div>
      <div>
        <label className={labelClass}>Frecuencia</label>
        <select
          className={inputClass}
          value={data.frequency}
          onChange={(e) => setData({ ...data, frequency: e.target.value })}
        >
          <option value="ONE_TIME">Pago Único (Próximo Rol)</option>
          <option value="RECURRING">Recurrente (Mensual Fijo)</option>
        </select>
      </div>
    </div>
    <div>
      <label className={labelClass}>Categoría Legal / Tributaria</label>
      <select
        className={inputClass}
        value={data.type}
        onChange={(e) => setData({ ...data, type: e.target.value })}
      >
        {CATEGORY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  </>
);

export const BenefitFormModals = ({
  employees,
  createModalOpen,
  setCreateModalOpen,
  singleFormData,
  setSingleFormData,
  onSingleCreateSubmit,
  editModalOpen,
  setEditModalOpen,
  editFormData,
  setEditFormData,
  onEditSubmit,
  confirmModalOpen,
  setConfirmModalOpen,
  onConfirmDeactivate,
  selectedBenefit,
  setSelectedBenefit,
  actionLoading,
}) => (
  <>
    <Modal
      isOpen={createModalOpen}
      onClose={() => setCreateModalOpen(false)}
      title="Nuevo Beneficio Individual"
      subtitle="Asigne un bono o viático a un colaborador específico."
      size="lg"
    >
      <form onSubmit={onSingleCreateSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Colaborador</label>
          <select
            required
            className={inputClass}
            value={singleFormData.employeeId}
            onChange={(e) => setSingleFormData({ ...singleFormData, employeeId: e.target.value })}
          >
            <option value="">Seleccione un colaborador...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} — {emp.department || 'General'} (
                {emp.position || 'Colaborador'})
              </option>
            ))}
          </select>
        </div>
        <BenefitFields data={singleFormData} setData={setSingleFormData} />
        <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCreateModalOpen(false)}
            className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? 'Guardando...' : 'Asignar Beneficio'}
          </button>
        </div>
      </form>
    </Modal>

    <Modal
      isOpen={editModalOpen && !!selectedBenefit}
      onClose={() => setEditModalOpen(false)}
      title="Editar Beneficio"
      subtitle={
        selectedBenefit
          ? `Colaborador: ${selectedBenefit.employee?.firstName} ${selectedBenefit.employee?.lastName}`
          : ''
      }
      size="lg"
    >
      {selectedBenefit && (
        <form onSubmit={onEditSubmit} className="space-y-4">
          <BenefitFields data={editFormData} setData={setEditFormData} />
          <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </Modal>

    <Modal
      isOpen={confirmModalOpen && !!selectedBenefit}
      onClose={() => {
        setConfirmModalOpen(false);
        setSelectedBenefit(null);
      }}
      title="¿Cancelar este beneficio?"
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              setConfirmModalOpen(false);
              setSelectedBenefit(null);
            }}
            className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded cursor-pointer"
          >
            Mantener
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={onConfirmDeactivate}
            className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
          </button>
        </>
      }
    >
      {selectedBenefit && (
        <p className="text-xs text-gray-500">
          Esta acción marcará el beneficio{' '}
          <span className="font-medium text-gray-800">"{selectedBenefit.name}"</span> ($
          {selectedBenefit.amount.toFixed(2)}) de{' '}
          <span className="font-medium text-gray-800">
            {selectedBenefit.employee?.firstName} {selectedBenefit.employee?.lastName}
          </span>{' '}
          como cancelado y no se incluirá en el próximo rol de pagos.
        </p>
      )}
    </Modal>
  </>
);

export default BenefitFormModals;
