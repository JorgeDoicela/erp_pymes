import React from 'react';
import { FiInfo } from 'react-icons/fi';

export const InfoItem = ({ label, value, isPrivate }) => (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <label className="text-xs text-slate-500 uppercase font-semibold tracking-wider block mb-1">
            {label} {isPrivate && '[Privado]'}
        </label>
        <p className="text-lg font-medium text-slate-200">{value || 'N/A'}</p>
    </div>
);

export const EmptyState = ({ message }) => (
    <div className="col-span-full py-12 text-center text-slate-500 italic border-2 border-dashed border-slate-800 rounded-xl">
        {message}
    </div>
);

export const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
        case 'expert': return 'bg-emerald-500/20 text-emerald-300';
        case 'advanced': return 'bg-blue-500/20 text-blue-300';
        case 'intermediate': return 'bg-yellow-500/20 text-yellow-300';
        default: return 'bg-slate-500/20 text-slate-300';
    }
};

export const InputField = ({ label, name, type = "text", value, onChange, error, help }) => (
    <div className="flex flex-col group relative">
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
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className={`bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/50' : 'focus:ring-blue-500/50'} transition-all`}
        />
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
);

export const SelectField = ({ label, name, value, onChange, options, error, help }) => (
    <div className="flex flex-col group relative">
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
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/50' : 'focus:ring-blue-500/50'} transition-all`}
        >
            <option value="">Seleccione</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
);
