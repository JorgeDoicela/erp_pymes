/**
 * @file EmployeeProfileHeader.jsx
 * @description Encabezado de perfil de colaborador con resumen métrico y selector de navegación.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CONTRACT_TYPES } from '../../../constants/employeeOptions';

export const EmployeeProfileHeader = ({
  employee,
  id,
  user,
  isAdminOrHR,
  employeesList = [],
  onEditClick,
  onTerminateClick,
  tabs = [],
  activeTab,
  setActiveTab,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Selector de Empleado para Administradores cuando ven un ID específico */}
      {isAdminOrHR && id && employeesList.length > 0 && (
        <div className="bg-white p-3 rounded-[4px] border border-gray-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600">Visualizando Colaborador:</span>
            <select
              value={employee.id}
              onChange={(e) => navigate(`/admin/employees/${e.target.value}`)}
              className="bg-white border border-gray-200 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600 font-medium"
            >
              {employeesList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.identityCard || emp.position})
                </option>
              ))}
            </select>
          </div>
          <Link to="/profile" className="text-xs text-blue-600 hover:underline font-medium">
            ← Ir a Mi Perfil Personal
          </Link>
        </div>
      )}

      {/* Header ERP con Balance Operativo */}
      <div className="bg-white rounded-[4px] p-5 border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[4px] bg-gray-100 border border-gray-200 flex items-center justify-center font-mono font-bold text-gray-800 text-base shrink-0">
              {employee.firstName?.charAt(0) || 'U'}
              {employee.lastName?.charAt(0) || ''}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">
                  {employee.firstName} {employee.lastName}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold border ${
                    employee.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {employee.isActive ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
              <p className="text-xs font-medium text-blue-700 mt-0.5">
                {employee.position} · <span className="text-gray-500">{employee.department}</span>
              </p>
              <p className="text-xs text-gray-400 font-mono mt-0.5 tabular-nums">
                {employee.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {id && (
              <Link
                to={`/admin/expedientes/${employee.id}`}
                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-[4px] transition-colors cursor-pointer"
              >
                Ver Expediente Digital ↗
              </Link>
            )}
            <button
              type="button"
              onClick={onEditClick}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[4px] transition-colors cursor-pointer"
            >
              Editar Perfil
            </button>
            {id && (
              <button
                type="button"
                onClick={() => navigate('/admin/employees')}
                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-[4px] transition-colors cursor-pointer"
              >
                Volver a Nómina
              </button>
            )}
            {employee.isActive && user?.role === 'admin' && id && (
              <button
                type="button"
                onClick={onTerminateClick}
                className="px-3 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-medium rounded-[4px] transition-colors cursor-pointer"
              >
                Dar de Baja
              </button>
            )}
          </div>
        </div>

        {/* Resumen Métrico en Línea */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50/70 p-3 rounded-[4px] border border-gray-200">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
              Departamento
            </span>
            <span className="font-semibold text-gray-900">{employee.department || '—'}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
              Tipo de Contrato
            </span>
            <span className="font-semibold text-gray-900">
              {CONTRACT_TYPES.find((c) => c.value === employee.contractType)?.label ||
                employee.contractType ||
                'Indefinido'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
              Fecha de Ingreso
            </span>
            <span className="font-mono text-gray-800 tabular-nums">
              {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('es-EC') : '—'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
              Salario Base
            </span>
            <span className="font-mono text-emerald-800 font-semibold tabular-nums">
              {employee.salary != null
                ? `$${employee.salary.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`
                : 'Confidencial'}
            </span>
          </div>
        </div>

        {/* Pestañas con Contadores Integrados */}
        <div className="flex border-b border-gray-200 overflow-x-auto gap-1 text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3 font-medium transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 font-mono text-[11px] text-gray-400 tabular-nums">
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileHeader;
