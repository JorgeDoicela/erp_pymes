/**
 * @file Table.jsx
 * @description Sistema de tablas tipo hoja de cálculo limpia conforme a estilos-erp-pymes
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const Table = ({ children, className = '', containerClassName = '' }) => (
  <div
    className={`w-full overflow-x-auto border border-gray-200 rounded-[4px] bg-white ${containerClassName}`}
  >
    <table className={`w-full text-left border-collapse text-xs text-gray-700 ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '' }) => (
  <thead
    className={`bg-gray-50/60 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider select-none ${className}`}
  >
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-gray-100 ${className}`}>{children}</tbody>
);

export const TableRow = ({ children, className = '', onClick }) => (
  <tr
    onClick={onClick}
    className={`border-b border-gray-100 hover:bg-gray-50/60 transition-colors ${
      onClick ? 'cursor-pointer' : ''
    } ${className}`}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = '', align = 'left' }) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <th
      scope="col"
      className={`py-2.5 px-3.5 font-semibold text-gray-600 ${
        alignClasses[align] || alignClasses.left
      } ${className}`}
    >
      {children}
    </th>
  );
};

export const TableCell = ({
  children,
  className = '',
  align = 'left',
  mono = false,
  tabular = false,
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      className={`py-2.5 px-3.5 text-gray-700 ${alignClasses[align] || alignClasses.left} ${
        mono || tabular ? 'font-mono tabular-nums' : ''
      } ${className}`}
    >
      {children}
    </td>
  );
};

export default Table;
