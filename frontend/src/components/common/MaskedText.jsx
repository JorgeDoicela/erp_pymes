import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Componente de Alta Seguridad para Enmascaramiento y Copiado.
 * - Muestra la cédula enmascarada en pantalla (ej. ••••••8888).
 * - Al hacer clic en el texto, copia el valor real al portapapeles sin mostrarlo en pantalla.
 * - Diseño ultralimpio sin iconos ni emojis.
 */
const MaskedText = ({ value, label = 'cédula', maskLength = 4, className = '' }) => {
    if (!value) return <span className="text-slate-400 italic">N/A</span>;

    const valStr = String(value);
    const maskedValue = valStr.length > maskLength
        ? '•'.repeat(valStr.length - maskLength) + valStr.slice(-maskLength)
        : '••••••••••';

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(valStr);
        toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} copiada al portapapeles`, {
            duration: 2000
        });
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`font-mono cursor-pointer select-none text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 px-1.5 py-0.5 rounded transition-all focus:outline-none ${className}`}
            title={`Haz clic para copiar ${label}`}
        >
            {maskedValue}
        </button>
    );
};

export default MaskedText;
