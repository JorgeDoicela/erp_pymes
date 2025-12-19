import React from 'react';

const SelectField = ({ label, name, value, onChange, options, required = true, ...props }) => (
    <div className="flex flex-col">
        {label && <label className="text-sm font-medium text-slate-400 mb-1">{label}</label>}
        <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            {...props}
        >
            <option value="" disabled className="bg-slate-900">Seleccionar...</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
            ))}
        </select>
    </div>
);

export default SelectField;
