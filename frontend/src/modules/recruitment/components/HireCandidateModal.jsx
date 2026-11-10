/**
 * @file HireCandidateModal.jsx
 * @description Modal de contratación e incorporación del candidato como empleado en nómina.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '../../../components/common/Modal';

export const HireCandidateModal = ({
  isOpen,
  onClose,
  candidateName,
  department,
  hireData,
  setHireData,
  onSubmit,
  submitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contratación e Incorporación a Nómina"
      subtitle={`Crear ficha de colaborador para ${candidateName}`}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Cédula de Identidad *
            </label>
            <input
              required
              type="text"
              maxLength={10}
              placeholder="17xxxxxxxx"
              value={hireData.identityCard}
              onChange={(e) => setHireData({ ...hireData, identityCard: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Salario Mensual (USD) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              placeholder="Ej: 1200.00"
              value={hireData.salary}
              onChange={(e) => setHireData({ ...hireData, salary: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 font-mono tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tipo de Contrato
            </label>
            <select
              value={hireData.contractType}
              onChange={(e) => setHireData({ ...hireData, contractType: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
            >
              <option value="Indefinido">Indefinido con periodo de prueba</option>
              <option value="Eventual">Eventual / Obra cierta</option>
              <option value="Plazo Fijo">Plazo Fijo</option>
              <option value="Pasantía">Pasantía / Formativo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fecha de Ingreso *
            </label>
            <input
              required
              type="date"
              value={hireData.startDate}
              onChange={(e) => setHireData({ ...hireData, startDate: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 font-mono tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Contraseña Inicial de Acceso al Portal *
          </label>
          <input
            required
            type="password"
            placeholder="Mínimo 8 caracteres..."
            value={hireData.password}
            onChange={(e) => setHireData({ ...hireData, password: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-[4px] text-gray-600 text-[11px] leading-relaxed">
          Al confirmar, el postulante será dado de alta como colaborador en el departamento de{' '}
          <strong className="text-gray-900">{department || 'General'}</strong> y se creará su
          usuario para el portal de autoservicio y nómina.
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-[4px] text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-[4px] text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Procesando Contrato...' : 'Confirmar Contratación'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default HireCandidateModal;
