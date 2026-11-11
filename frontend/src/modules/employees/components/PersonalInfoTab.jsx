/**
 * @file PersonalInfoTab.jsx
 * @description Pestaña de información personal, identificación legal y contacto del colaborador.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { InfoItem } from './EmployeeHelpers';
import { CIVIL_STATUS_OPTIONS } from '../constants/employeeOptions';

export const PersonalInfoTab = ({ employee }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
      <InfoItem
        label="Cédula / Identificación Fiscal"
        value={employee.identityCard}
        isMasked={true}
      />
      <InfoItem
        label="Fecha de Nacimiento"
        value={
          employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('es-EC') : 'N/A'
        }
      />
      <InfoItem
        label="Estado Civil"
        value={
          CIVIL_STATUS_OPTIONS.find((c) => c.value === employee.civilStatus)?.label ||
          employee.civilStatus
        }
      />
      <InfoItem label="Dirección Domiciliaria" value={employee.address} />
      <InfoItem label="Teléfono de Contacto" value={employee.phone} />
      <InfoItem label="Correo Electrónico" value={employee.email} />
    </div>
  );
};

export default PersonalInfoTab;
