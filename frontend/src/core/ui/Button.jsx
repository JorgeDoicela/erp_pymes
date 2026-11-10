/**
 * @file Button.jsx
 * @description Botón atómico conforme al estándar estilos-erp-pymes (Holded / Xero / Linear)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

const VARIANTS = {
  primary:
    'bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  table:
    'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  destructive:
    'border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-3 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
};

export const Button = ({
  children,
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  icon: Icon = null,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = VARIANTS[variant] || VARIANTS.primary;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 select-none ${baseClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
