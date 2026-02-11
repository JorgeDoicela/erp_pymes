import React from 'react';
import { FiInfo } from 'react-icons/fi';

export const InfoItem = ({ label, value, isPrivate }) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">
            {label} {isPrivate && <span className="text-amber-600 ml-1 text-[10px] bg-amber-50 px-1 py-0.5 rounded border border-amber-100">PRIVADO</span>}
        </label>
        <p className="text-base font-medium text-slate-800">{value || 'N/A'}</p>
    </div>
);

export const EmptyState = ({ message }) => (
    <div className="col-span-full py-12 text-center text-slate-500 italic border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        {message}
    </div>
);

export const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
        case 'expert': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
        case 'advanced': return 'bg-blue-50 text-blue-700 border border-blue-100';
        case 'intermediate': return 'bg-amber-50 text-amber-700 border border-amber-100';
        default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
};

export const InputField = ({ label, name, type = "text", value, onChange, error, help }) => (
    <div className="flex flex-col group relative">
        <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            {help && (
                <div className="relative group/help">
                    <FiInfo size={14} className="text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
                    <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none shadow-xl">
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
            className={`bg-white border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'} rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all shadow-sm`}
        />
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
);

export const SelectField = ({ label, name, value, onChange, options, error, help }) => (
    <div className="flex flex-col group relative">
        <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            {help && (
                <div className="relative group/help">
                    <FiInfo size={14} className="text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
                    <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none shadow-xl">
                        {help}
                    </div>
                </div>
            )}
        </div>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full bg-white border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'} rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-4 transition-all shadow-sm`}
        >
            <option value="">Seleccione</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
);
