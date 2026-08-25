import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

const SIZE_CLASSES = {
    sm: 'max-w-md w-full',
    md: 'max-w-lg w-full',
    lg: 'max-w-2xl w-full',
    xl: 'max-w-4xl w-full',
    '2xl': 'max-w-5xl w-full',
    '3xl': 'max-w-6xl w-full',
    '4xl': 'max-w-7xl w-full',
    '5xl': 'max-w-[92vw] xl:max-w-[1440px] w-full',
    '6xl': 'w-[95vw] max-w-[1780px] h-[93vh] max-h-[94vh]',
    '7xl': 'w-[96vw] max-w-[1880px] h-[94vh] max-h-[95vh]',
    full: 'w-[97vw] h-[95vh] max-h-[95vh]',
    screen: 'w-[98vw] h-[97vh] max-h-[97vh]'
};

/**
 * Componente Modal Universal con React Portal para ERP Empresarial.
 * Se monta directamente en document.body para evitar problemas de stacking context,
 * overflow de contenedores padres, z-index de cabeceras/sidebars y scroll de fondo.
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,
    size = 'md',
    showCloseButton = true,
    closeOnEscape = true,
    closeOnClickOutside = true,
    className = '',
    headerClassName = '',
    bodyClassName = ''
}) => {
    // Bloquear scroll del fondo (body) cuando el modal está abierto
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;
        
        // Evitar saltos de ancho por la barra de desplazamiento
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollBarWidth > 0) {
            document.body.style.paddingRight = `${scrollBarWidth}px`;
        }
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
        };
    }, [isOpen]);

    // Cerrar con tecla Escape
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-x-hidden overflow-y-auto">
            {/* Backdrop / Fondo Oscuro que cubre TODA la pantalla */}
            <div
                className="fixed inset-0 bg-gray-950/60 backdrop-blur-[2px] transition-opacity duration-200"
                onClick={closeOnClickOutside ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Contenedor del Diálogo */}
            <div
                className={`relative w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} bg-white border border-gray-200 rounded shadow-2xl z-10 my-auto flex flex-col max-h-[95vh] overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95 ${className}`}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className={`px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3 bg-white shrink-0 ${headerClassName}`}>
                        <div className="min-w-0 flex-1">
                            {title && (
                                <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight truncate">
                                    {title}
                                </h3>
                            )}
                            {subtitle && (
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-700 p-1 -mr-1 rounded hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                                aria-label="Cerrar modal"
                            >
                                <FiX size={18} />
                            </button>
                        )}
                    </div>
                )}

                {/* Body con scroll independiente */}
                <div className={`p-5 overflow-y-auto text-xs text-gray-700 flex-1 min-h-0 ${bodyClassName}`}>
                    {children}
                </div>

                {/* Footer Opcional */}
                {footer && (
                    <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-200 flex items-center justify-end gap-2.5 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default Modal;
