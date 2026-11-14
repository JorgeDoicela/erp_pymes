/**
 * @file Select.jsx
 * @description Select accesible basado en DOM (combobox + listbox) compatible con exploración TalkBack en 2 toques y estilos-erp-pymes.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useId, useState, useRef, useEffect, useMemo } from 'react';
import { FiInfo, FiChevronDown, FiCheck } from 'react-icons/fi';

function extractSelectOptions(options, children) {
  if (Array.isArray(options) && options.length > 0) {
    return options.map((opt) => ({
      value: String(opt.value ?? ''),
      label: String(opt.label ?? opt.value ?? ''),
      disabled: Boolean(opt.disabled),
    }));
  }
  const items = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.type !== 'option') return;
    const rawLabel = React.Children.toArray(child.props.children).join('');
    items.push({
      value: String(child.props.value ?? ''),
      label: rawLabel.trim(),
      disabled: Boolean(child.props.disabled),
    });
  });
  return items;
}

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
      name,
      value,
      defaultValue,
      onChange,
      disabled = false,
      required = false,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const containerRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [internalVal, setInternalVal] = useState(defaultValue ?? '');

    const normalizedOptions = useMemo(
      () => extractSelectOptions(options, children),
      [options, children]
    );

    const currentValue = value !== undefined ? String(value ?? '') : String(internalVal ?? '');
    const selectedOption =
      normalizedOptions.find((opt) => opt.value === currentValue) ||
      (!placeholder ? normalizedOptions[0] : null);
    const displayLabel = selectedOption?.label || placeholder || 'Seleccionar...';

    useEffect(() => {
      if (!isOpen) return;
      const handleOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }, [isOpen]);

    const handleSelectOption = (opt) => {
      if (opt.disabled) return;
      if (value === undefined) setInternalVal(opt.value);
      setIsOpen(false);
      if (onChange) {
        onChange({
          target: { name, id: selectId, value: opt.value },
          currentTarget: { name, id: selectId, value: opt.value },
        });
      }
    };

    return (
      <div ref={containerRef} className="w-full relative">
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

        <button
          ref={ref}
          id={selectId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-label={ariaLabel || label || placeholder || 'Menú desplegable'}
          data-selected-label={selectedOption?.label || ''}
          disabled={disabled}
          required={required}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`w-full bg-white border text-xs text-gray-900 rounded-[4px] px-3 py-1.5 flex items-center justify-between gap-2 text-left focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
            error ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
          } ${className}`}
        >
          <span className={`truncate ${!selectedOption && placeholder ? 'text-gray-400' : ''}`}>
            {displayLabel}
          </span>
          <FiChevronDown
            size={14}
            className={`text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && !disabled && (
          <div
            role="listbox"
            aria-label={ariaLabel || label || 'Opciones'}
            className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[4px] shadow-lg z-50 max-h-60 overflow-y-auto py-1"
          >
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === selectedOption?.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 text-blue-900 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <FiCheck size={13} className="text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

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
