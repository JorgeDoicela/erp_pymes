/**
 * @file Modal.jsx
 * @description Diálogo modal conforme al estándar estilos-erp-pymes
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-5xl',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white border border-gray-200 rounded-[6px] w-full overflow-hidden shadow-xl ${sizeClass} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto select-text">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-200 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
