import React from 'react';

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = true, ...props }) => (
    <div className="flex flex-col">
        {label && <label className="text-sm font-medium text-slate-400 mb-1">{label}</label>}
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-600"
            {...props}
        />
    </div>
);

export default InputField;
