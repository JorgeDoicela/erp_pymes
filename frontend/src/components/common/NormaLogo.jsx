/**
 * @file NormaLogo.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

/**
 * Logotipo oficial de Norma ERP conforme al estándar de diseño empresarial
 * (Holded / Xero / Linear): sobrio, minimalista, sin artificios y de alto contraste.
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
    {/* Superficie base oscura institucional */}
    <rect width="32" height="32" rx="5" fill="#0f172a" />

    {/* Monograma N geométrico de alta precisión con trazo de escuadra */}
    <path d="M8.5 24V8H11.5L20.5 21V8H23.5V24H20.5L11.5 11V24H8.5Z" fill="#ffffff" />

    {/* Acento sutil de regla / precisión normativa en la base derecha */}
    <rect x="21" y="22" width="2.5" height="2" fill="#2563eb" />
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
    lg: 38,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
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
      <div className="flex items-center gap-1.5 leading-none">
        <span
          className={`font-bold tracking-tight ${textSize} ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          NORMA
        </span>
        <span
          className={`font-mono text-[10px] font-semibold tracking-wider uppercase px-1 py-0.5 rounded-[3px] border ${
            isDark
              ? 'bg-slate-800 text-slate-300 border-slate-700'
              : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}
        >
          ERP
        </span>
      </div>
    </div>
  );
};

export default NormaLogo;
