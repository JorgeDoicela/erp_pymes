import React from 'react';
import { FiInfo } from 'react-icons/fi';

const SelectField = ({ label, name, value, onChange, options, required = true, error, help, ...props }) => (
    <div className="flex flex-col group relative">
        {label && (
            <div className="flex items-center gap-2 mb-1">
                <label className="text-sm font-medium text-slate-400">{label}</label>
                {help && (
                    <div className="relative group/help">
                        <FiInfo size={12} className="text-slate-500 cursor-help hover:text-blue-400 transition-colors" />
                        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-slate-300 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none shadow-xl">
                            {help}
                        </div>
                    </div>
                )}
            </div>
        )}
        <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={`bg-slate-800/50 border ${error ? 'border-red-500' : 'border-slate-700/50'} rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/50' : 'focus:ring-blue-500/50'} focus:border-blue-500/50 transition-all`}
            {...props}
        >
            <option value="" disabled className="bg-slate-900">Seleccionar...</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
            ))}
        </select>
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
);

export default SelectField;
