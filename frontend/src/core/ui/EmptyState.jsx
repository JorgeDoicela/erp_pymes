/**
 * @file EmptyState.jsx
 * @description Estado vacío sobrio conforme al estándar estilos-erp-pymes
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const EmptyState = ({
  title = 'No hay registros',
  description = 'No se encontraron datos para mostrar en este criterio de búsqueda.',
  action = null,
  className = '',
}) => (
  <div className={`p-12 text-center ${className}`}>
    <h4 className="text-sm font-medium text-gray-700">{title}</h4>
    {description && <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{description}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

export default EmptyState;
