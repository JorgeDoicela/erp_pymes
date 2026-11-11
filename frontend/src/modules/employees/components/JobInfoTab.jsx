/**
 * @file JobInfoTab.jsx
 * @description Pestaña de datos contractuales, laborales y datos bancarios para acreditación de haberes.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { InfoItem } from './EmployeeHelpers';
import { CONTRACT_TYPES } from '../constants/employeeOptions';

export const JobInfoTab = ({ employee }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
      <InfoItem label="Departamento" value={employee.department} />
      <InfoItem label="Cargo / Posición" value={employee.position} />
      <InfoItem
        label="Fecha de Ingreso"
        value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('es-EC') : 'N/A'}
      />
      <InfoItem
        label="Modalidad de Contrato"
        value={
          CONTRACT_TYPES.find((c) => c.value === employee.contractType)?.label ||
          employee.contractType
        }
      />
      <InfoItem
        label="Salario Base Mensual"
        value={
          employee.salary != null
            ? `$${employee.salary.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`
            : null
        }
        isPrivate
      />
      <InfoItem
        label="Rol en el Sistema"
        value={
          {
            admin: 'Administrador',
            employee: 'Colaborador',
            manager: 'Gerente / Supervisor',
          }[employee.role] || employee.role
        }
      />
      <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Datos Bancarios para Acreditación
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoItem label="Institución Bancaria" value={employee.bankName} isPrivate />
          <InfoItem label="N° Cuenta" value={employee.accountNumber} isPrivate />
          <InfoItem label="Tipo de Cuenta" value={employee.accountType} isPrivate />
        </div>
      </div>
    </div>
  );
};

export default JobInfoTab;
