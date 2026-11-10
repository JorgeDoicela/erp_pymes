/**
 * @file BulkBenefitModal.jsx
 * @description Modal de asignación masiva de beneficios de ley y bonos por departamento
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
  { value: 'BONUS', label: 'Bono Imponible' },
  { value: 'COMMISSION', label: 'Comisión' },
  { value: 'INCENTIVE', label: 'Incentivo' },
  { value: 'HEALTH', label: 'Seguro Médico' },
  { value: 'MEAL', label: 'Alimentación' },
  { value: 'TRANSPORT', label: 'Movilización' },
  { value: 'ALLOWANCE', label: 'Viático' },
];

const FREQUENCIES = [
  { value: 'ONE_TIME', label: 'Pago Único' },
  { value: 'RECURRING', label: 'Recurrente' },
];

export const BulkBenefitModal = ({
  isOpen,
  onClose,
  onSubmit,
  bulkData,
  setBulkData,
  employees = [],
  departments = [],
  loading = false,
}) => {
  const applyTemplate = (templateKey) => {
    switch (templateKey) {
      case 'DECIMO_3':
        setBulkData((prev) => ({
          ...prev,
          name: 'Décimo Tercer Sueldo (Navideño)',
          amount: '460.00',
          type: 'BONUS',
          frequency: 'ONE_TIME',
          isSpecial: true,
          specialType: 'DECIMO_TERCERO',
        }));
        break;
      case 'DECIMO_4':
        setBulkData((prev) => ({
          ...prev,
          name: 'Décimo Cuarto Sueldo (Escolar)',
          amount: '470.00',
          type: 'BONUS',
          frequency: 'ONE_TIME',
          isSpecial: true,
          specialType: 'DECIMO_CUARTO',
        }));
        break;
      case 'BONO_DESEMPENO':
        setBulkData((prev) => ({
          ...prev,
          name: 'Bono por Desempeño',
          amount: '100.00',
          type: 'BONUS',
          frequency: 'ONE_TIME',
          isSpecial: false,
          specialType: '',
        }));
        break;
      case 'VIATICO_ALIMENTACION':
        setBulkData((prev) => ({
          ...prev,
          name: 'Alimentación Mensual',
          amount: '60.00',
          type: 'MEAL',
          frequency: 'RECURRING',
          isSpecial: false,
          specialType: '',
        }));
        break;
      default:
        break;
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (bulkData.selectedDepartment === 'ALL') return true;
    return emp.department === bulkData.selectedDepartment;
  });

  const handleSelectAll = () => {
    const visibleIds = filteredEmployees.map((e) => e.id);
    const allSelected = visibleIds.every((id) => bulkData.selectedEmployees.includes(id));
    if (allSelected) {
      setBulkData((prev) => ({
        ...prev,
        selectedEmployees: prev.selectedEmployees.filter((id) => !visibleIds.includes(id)),
      }));
    } else {
      const merged = Array.from(new Set([...bulkData.selectedEmployees, ...visibleIds]));
      setBulkData((prev) => ({ ...prev, selectedEmployees: merged }));
    }
  };

  const toggleEmployee = (id) => {
    setBulkData((prev) => {
      const exists = prev.selectedEmployees.includes(id);
      return {
        ...prev,
        selectedEmployees: exists
          ? prev.selectedEmployees.filter((eId) => eId !== id)
          : [...prev.selectedEmployees, id],
      };
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignación Masiva de Beneficios"
      subtitle="Asigne beneficios fijos o cálculos de ley a múltiples colaboradores."
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            loading={loading}
            disabled={loading || bulkData.selectedEmployees.length === 0}
          >
            {loading ? 'Procesando...' : `Asignar a ${bulkData.selectedEmployees.length} Colaboradores`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Plantillas Legales Rápidas */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5 select-none">
            Plantillas Rápidas (Normativa Ecuador)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyTemplate('DECIMO_3')}
              className={`p-2.5 border rounded-[4px] text-left transition-colors cursor-pointer ${
                bulkData.specialType === 'DECIMO_TERCERO'
                  ? 'border-blue-600 bg-blue-50/40 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
              }`}
            >
              <p className="font-semibold text-xs">Décimo Tercero</p>
              <p className="text-[11px] text-gray-400">1 Sueldo Base</p>
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('DECIMO_4')}
              className={`p-2.5 border rounded-[4px] text-left transition-colors cursor-pointer ${
                bulkData.specialType === 'DECIMO_CUARTO'
                  ? 'border-blue-600 bg-blue-50/40 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
              }`}
            >
              <p className="font-semibold text-xs">Décimo Cuarto</p>
              <p className="text-[11px] text-gray-400">1 SBU ($470 USD)</p>
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('BONO_DESEMPENO')}
              className={`p-2.5 border rounded-[4px] text-left transition-colors cursor-pointer ${
                bulkData.name === 'Bono por Desempeño'
                  ? 'border-blue-600 bg-blue-50/40 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
              }`}
            >
              <p className="font-semibold text-xs">Bono Desempeño</p>
              <p className="text-[11px] text-gray-400">$100 USD Fijo</p>
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('VIATICO_ALIMENTACION')}
              className={`p-2.5 border rounded-[4px] text-left transition-colors cursor-pointer ${
                bulkData.name === 'Alimentación Mensual'
                  ? 'border-blue-600 bg-blue-50/40 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
              }`}
            >
              <p className="font-semibold text-xs">Alimentación</p>
              <p className="text-[11px] text-gray-400">$60 USD Exento</p>
            </button>
          </div>
        </div>

        <Input
          label="Concepto / Descripción"
          placeholder="Ej. Bono Anual de Resultados"
          value={bulkData.name}
          onChange={(e) => setBulkData({ ...bulkData, name: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Monto ($ USD)"
            type="number"
            step="0.01"
            min="0.01"
            mono
            value={bulkData.amount}
            onChange={(e) => setBulkData({ ...bulkData, amount: e.target.value })}
          />
          <Select
            label="Frecuencia"
            value={bulkData.frequency}
            onChange={(e) => setBulkData({ ...bulkData, frequency: e.target.value })}
            options={FREQUENCIES}
          />
          <Select
            label="Categoría Legal"
            value={bulkData.type}
            onChange={(e) => setBulkData({ ...bulkData, type: e.target.value })}
            options={BENEFIT_TYPES}
          />
        </div>

        {/* Selección de Colaboradores Destino */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-medium text-gray-600 select-none">
              Colaboradores Destino
            </label>
            <div className="flex items-center gap-2">
              <select
                value={bulkData.selectedDepartment}
                onChange={(e) =>
                  setBulkData((prev) => ({ ...prev, selectedDepartment: e.target.value }))
                }
                className="text-xs bg-white border border-gray-200 rounded px-2.5 py-1 text-gray-800 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Todos los Departamentos</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-mono tabular-nums text-gray-500">
                {bulkData.selectedEmployees.length} de {employees.length} seleccionados
              </span>
            </div>
          </div>

          <div className="border border-gray-200 rounded max-h-48 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
            <label className="p-2.5 flex items-center gap-2 cursor-pointer hover:bg-gray-100 text-xs font-semibold text-gray-800 select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={
                  filteredEmployees.length > 0 &&
                  filteredEmployees.every((e) => bulkData.selectedEmployees.includes(e.id))
                }
                onChange={handleSelectAll}
              />
              <span>Seleccionar Visibles ({filteredEmployees.length})</span>
            </label>

            {filteredEmployees.map((emp) => (
              <label
                key={emp.id}
                className="p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 text-xs text-gray-700 select-none"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={bulkData.selectedEmployees.includes(emp.id)}
                  onChange={() => toggleEmployee(emp.id)}
                />
                <span className="font-medium text-gray-900">
                  {emp.firstName} {emp.lastName}
                </span>
                <span className="text-[11px] text-gray-400 font-mono ml-auto">
                  {emp.department || 'General'} · {emp.position || 'Colaborador'}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BulkBenefitModal;
