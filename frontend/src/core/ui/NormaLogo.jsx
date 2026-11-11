/**
 * @file NormaLogo.jsx
 * @description Norma ERP - Logotipo conforme al estándar estilos-erp-pymes (Holded / Xero / Linear)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

/**
 * Isotipo plano de alto contraste para Norma ERP:
 * - Superficie antracita (#111827) con esquinas sobrias (rx=4).
 * - Cero gradientes, cero sombras y cero artificios decorativos.
 * - Monograma N simétrico compuesto por dos pilares en blanco (#ffffff)
 *   y diagonal de precisión en azul operativo único (#2563eb).
 */
export const NormaIcon = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`flex-shrink-0 ${className}`}
    aria-label="Norma Isotipo"
  >
    {/* Contenedor plano sobrio (esquinas 4px según estándar de la skill) */}
    <rect width="32" height="32" rx="4" fill="#111827" />

    {/* Pilar izquierdo (Blanco puro, 3.5px) */}
    <rect x="7.5" y="7" width="3.5" height="18" rx="0.5" fill="#ffffff" />

    {/* Diagonal de precisión (Azul plano #2563eb con pendiente continua exacta) */}
    <polygon points="11,7 14.5,7 21,18.5 21,25 17.5,25 11,13.5" fill="#2563eb" />

    {/* Pilar derecho (Blanco puro, 3.5px) */}
    <rect x="21" y="7" width="3.5" height="18" rx="0.5" fill="#ffffff" />
  </svg>
);

export const NormaLogo = ({
  variant = 'full', // 'full' | 'icon' | 'dark'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) => {
  const iconSizes = {
    sm: 24,
    md: 30,
    lg: 36,
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-[15px]',
    lg: 'text-lg',
  };

  const iconSize = iconSizes[size] || iconSizes.md;
  const textSize = textSizes[size] || textSizes.md;

  if (variant === 'icon') {
    return <NormaIcon size={iconSize} className={className} />;
  }

  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <NormaIcon size={iconSize} />
      <div className="flex items-center leading-none">
        <span
          className={`font-bold tracking-tight ${textSize} ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          NORMA
        </span>
      </div>
    </div>
  );
};

export default NormaLogo;
