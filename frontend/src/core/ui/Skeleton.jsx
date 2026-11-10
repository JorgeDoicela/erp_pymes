/**
 * @file Skeleton.jsx
 * @description Indicador de carga placeholder con animación sutil de pulso
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const Skeleton = ({ className = '', rounded = 'rounded-[4px]' }) => (
  <div className={`animate-pulse bg-gray-100 ${rounded} ${className}`} />
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full space-y-2.5 p-4 bg-white border border-gray-200 rounded-[4px]">
    <div className="flex gap-4 border-b border-gray-100 pb-2.5">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={`h-${i}`} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={`r-${r}`} className="flex gap-4 py-2 border-b border-gray-50 last:border-none">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={`c-${r}-${c}`} className="h-3.5 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
