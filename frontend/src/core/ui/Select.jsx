/**
 * @file Select.jsx
 * @description Select atómico conforme al Form System de estilos-erp-pymes
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useId } from 'react';
import { FiInfo } from 'react-icons/fi';

export const Select = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      help,
      placeholder,
      options = [],
      children,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <div className="flex items-center gap-1.5 mb-1">
            <label
              htmlFor={selectId}
              className="block text-xs font-medium text-gray-700 select-none"
            >
              {label}
            </label>
            {help && (
              <div className="relative group/help">
                <FiInfo
                  size={12}
                  className="text-gray-400 cursor-help hover:text-blue-600 transition-colors"
                />
                <div className="absolute bottom-full left-0 mb-1.5 w-52 p-2 bg-gray-900 border border-gray-800 rounded text-[11px] text-gray-200 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none shadow-lg">
                  {help}
                </div>
              </div>
            )}
          </div>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-white border text-xs text-gray-900 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-white text-gray-400">
              {placeholder}
            </option>
          )}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p className="text-[11px] text-red-600 font-medium mt-1 leading-tight">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-gray-400 mt-1 leading-tight">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
