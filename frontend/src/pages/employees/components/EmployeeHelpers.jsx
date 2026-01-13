import React from 'react';

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

export const InputField = ({ label, name, type = "text", value, onChange }) => (
    <div className="flex flex-col">
        <label className="text-sm font-medium text-slate-400 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
    </div>
);
