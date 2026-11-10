/**
 * @file Select.jsx
 * @description Select atómico conforme al Form System de estilos-erp-pymes
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useId } from 'react';

export const Select = React.forwardRef(
  ({ label, error, helperText, options = [], children, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-gray-600 mb-1 select-none"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-white border text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
          } ${className}`}
          {...props}
        >
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
