/**
 * @file Input.jsx
 * @description Input atómico conforme al Form System de estilos-erp-pymes
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useId } from 'react';

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      type = 'text',
      icon: Icon = null,
      className = '',
      id,
      mono = false,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-gray-600 mb-1 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`w-full bg-white border text-xs text-gray-800 rounded px-3 py-1.5 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
              Icon ? 'pl-8' : ''
            } ${mono ? 'font-mono tabular-nums' : ''} ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-200'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-[11px] text-red-600 font-medium mt-1 leading-tight">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-gray-400 mt-1 leading-tight">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
