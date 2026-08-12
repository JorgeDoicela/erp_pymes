import React from 'react';
import { FiInfo, FiLock } from 'react-icons/fi';
import MaskedText from '../../../components/common/MaskedText';

// Detecta si un valor parece ser texto cifrado (hex largo con ':') que nunca se desencriptó
const looksEncrypted = (val) => {
    if (!val || typeof val !== 'string') return false;
    const parts = val.split(':');
    return parts.length === 4 && parts.every(p => /^[0-9a-f]{10,}/i.test(p));
};

const sanitize = (value, isPrivate) => {
    if (value === null || value === undefined || value === '') {
        return isPrivate ? null : 'N/A';
    }
    if (looksEncrypted(String(value))) return null;
    return value;
};

export const InfoItem = ({ label, value, isPrivate, isMasked }) => {
    const display = sanitize(value, isPrivate);
    return (
        <div className="bg-gray-50/60 p-3 rounded border border-gray-200">
            <label className="text-[11px] text-gray-500 uppercase font-semibold tracking-wider block mb-1">
                {label}{' '}
                {isPrivate && (
                    <span className="text-amber-800 ml-1 text-[10px] bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                        PRIVADO
                    </span>
                )}
            </label>
            {display !== null ? (
                isMasked ? (
                    <div className="text-xs font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                        <MaskedText value={display} label={label.toLowerCase()} />
                    </div>
                ) : (
                    <p className="text-xs font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{display}</p>
                )
            ) : (
                <p className="text-xs font-medium text-gray-400 italic flex items-center gap-1">
                    <FiLock size={12} className="text-gray-400" />
                    {isPrivate ? 'No registrado' : 'N/A'}
                </p>
            )}
        </div>
    );
};

export const EmptyState = ({ message }) => (
    <div className="col-span-full py-8 text-center text-gray-400 text-xs bg-gray-50/50 rounded border border-gray-200">
        {message}
    </div>
);

export const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
        case 'expert': return 'bg-green-50 text-green-800 border border-green-200';
        case 'advanced': return 'bg-blue-50 text-blue-800 border border-blue-200';
        case 'intermediate': return 'bg-amber-50 text-amber-800 border border-amber-200';
        default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
};

export const InputField = ({ label, name, type = "text", value, onChange, error, help }) => (
    <div className="flex flex-col group relative">
        <div className="flex items-center gap-1.5 mb-1">
            <label className="text-xs font-medium text-gray-700">{label}</label>
            {help && (
                <div className="relative group/help">
                    <FiInfo size={12} className="text-gray-400 cursor-help hover:text-blue-600 transition-colors" />
                    <div className="absolute bottom-full left-0 mb-1.5 w-52 p-2 bg-gray-900 border border-gray-800 rounded text-[11px] text-gray-200 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none shadow-lg">
                        {help}
                    </div>
                </div>
            )}
        </div>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className={`bg-white border ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors`}
        />
        {error && <span className="text-[11px] font-medium text-red-600 mt-1">{error}</span>}
    </div>
);

export const SelectField = ({ label, name, value, onChange, options, error, help }) => (
    <div className="flex flex-col group relative">
        <div className="flex items-center gap-1.5 mb-1">
            <label className="text-xs font-medium text-gray-700">{label}</label>
            {help && (
                <div className="relative group/help">
                    <FiInfo size={12} className="text-gray-400 cursor-help hover:text-blue-600 transition-colors" />
                    <div className="absolute bottom-full left-0 mb-1.5 w-52 p-2 bg-gray-900 border border-gray-800 rounded text-[11px] text-gray-200 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none shadow-lg">
                        {help}
                    </div>
                </div>
            )}
        </div>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full bg-white border ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors`}
        >
            <option value="">Seleccione</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {error && <span className="text-[11px] font-medium text-red-600 mt-1">{error}</span>}
    </div>
);

