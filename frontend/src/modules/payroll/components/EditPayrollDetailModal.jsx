/**
 * @file EditPayrollDetailModal.jsx
 * @description Modal de ajuste manual de rol individual (bonos, horas extras, deducciones)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { Modal } from '@/core/ui/Modal.jsx';
import { Button } from '@/core/ui/Button.jsx';
import { Input } from '@/core/ui/Input.jsx';

export const EditPayrollDetailModal = ({
  isOpen,
  onClose,
  editingDetail,
  setEditingDetail,
  onSubmit,
}) => {
  if (!editingDetail) return null;

  const bonuses = (() => {
    try {
      return typeof editingDetail.bonuses === 'string'
        ? JSON.parse(editingDetail.bonuses || '[]')
        : editingDetail.bonuses || [];
    } catch {
      return [];
    }
  })();

  const deductions = (() => {
    try {
      return typeof editingDetail.deductions === 'string'
        ? JSON.parse(editingDetail.deductions || '[]')
        : editingDetail.deductions || [];
    } catch {
      return [];
    }
  })();

  const handleAddBonus = () => {
    const next = [...bonuses, { name: '', amount: 0 }];
    setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(next) });
  };

  const handleUpdateBonus = (index, field, value) => {
    const next = [...bonuses];
    next[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(next) });
  };

  const handleRemoveBonus = (index) => {
    const next = bonuses.filter((_, i) => i !== index);
    setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(next) });
  };

  const handleAddDeduction = () => {
    const next = [...deductions, { name: '', amount: 0 }];
    setEditingDetail({ ...editingDetail, deductions: JSON.stringify(next) });
  };

  const handleUpdateDeduction = (index, field, value) => {
    const next = [...deductions];
    next[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setEditingDetail({ ...editingDetail, deductions: JSON.stringify(next) });
  };

  const handleRemoveDeduction = (index) => {
    const next = deductions.filter((_, i) => i !== index);
    setEditingDetail({ ...editingDetail, deductions: JSON.stringify(next) });
  };

  // Cálculo reactivo del neto estimado
  const baseSalary = parseFloat(editingDetail.baseSalary) || 0;
  const overtimeAmount = parseFloat(editingDetail.overtimeAmount) || 0;
  const totalBonuses = bonuses.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
  const totalDeductions = deductions.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
  const estimatedNet = Math.max(
    0,
    baseSalary + overtimeAmount + totalBonuses - totalDeductions
  ).toFixed(2);

  const employeeName = editingDetail.employee
    ? `${editingDetail.employee.firstName || ''} ${editingDetail.employee.lastName || ''}`.trim()
    : 'Empleado';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajuste Manual de Rol"
      subtitle={`Colaborador: ${employeeName}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSubmit}>
            Guardar Ajustes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Sueldo Base Ganado ($)"
            type="number"
            step="0.01"
            mono
            value={editingDetail.baseSalary}
            onChange={(e) =>
              setEditingDetail({
                ...editingDetail,
                baseSalary: parseFloat(e.target.value) || 0,
              })
            }
          />
          <Input
            label="Horas Extras ($)"
            type="number"
            step="0.01"
            mono
            value={editingDetail.overtimeAmount}
            onChange={(e) =>
              setEditingDetail({
                ...editingDetail,
                overtimeAmount: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>

        {/* Sección de Bonos e Ingresos Extra */}
        <div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-1.5 mb-2.5">
            <h4 className="text-xs font-semibold text-gray-700">Bonos e Ingresos Adicionales</h4>
            <button
              type="button"
              onClick={handleAddBonus}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer"
            >
              + Añadir Ingreso
            </button>
          </div>
          <div className="space-y-2">
            {bonuses.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic">No hay bonos registrados.</p>
            ) : (
              bonuses.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Descripción del ingreso"
                    className="flex-1 bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                    value={item.name}
                    onChange={(e) => handleUpdateBonus(idx, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="$"
                    className="w-24 font-mono tabular-nums bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                    value={item.amount}
                    onChange={(e) => handleUpdateBonus(idx, 'amount', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveBonus(idx)}
                    className="text-red-400 hover:text-red-600 text-base leading-none p-1 cursor-pointer"
                    title="Eliminar ingreso"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sección de Deducciones y Egresos */}
        <div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-1.5 mb-2.5">
            <h4 className="text-xs font-semibold text-gray-700">Deducciones y Descuentos</h4>
            <button
              type="button"
              onClick={handleAddDeduction}
              className="text-red-600 hover:text-red-700 text-xs font-medium cursor-pointer"
            >
              + Añadir Deducción
            </button>
          </div>
          <div className="space-y-2">
            {deductions.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic">
                No hay deducciones manuales registradas.
              </p>
            ) : (
              deductions.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Descripción del descuento"
                    className="flex-1 bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                    value={item.name}
                    onChange={(e) => handleUpdateDeduction(idx, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="$"
                    className="w-24 font-mono tabular-nums bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                    value={item.amount}
                    onChange={(e) => handleUpdateDeduction(idx, 'amount', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDeduction(idx)}
                    className="text-red-400 hover:text-red-600 text-base leading-none p-1 cursor-pointer"
                    title="Eliminar deducción"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resumen Estimado del Rol */}
        <div className="bg-gray-50 border border-gray-200 rounded p-3 flex justify-between items-center text-xs">
          <span className="font-medium text-gray-600 uppercase tracking-wider">
            Neto a Recibir (Estimado)
          </span>
          <span className="text-sm font-semibold font-mono text-gray-900 tabular-nums">
            ${estimatedNet}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default EditPayrollDetailModal;
