import React from 'react';
import { FiInfo } from 'react-icons/fi';

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = true, error, help, ...props }) => (
    <div className="flex flex-col group relative">
        {label && (
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
        )}
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={`bg-white border ${error ? 'border-red-400' : 'border-gray-200'} rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 ${error ? 'focus:ring-red-500/20' : 'focus:ring-blue-500/20'} transition-colors placeholder-gray-400`}
            {...props}
        />
        {error && <span className="text-[11px] font-medium text-red-600 mt-1">{error}</span>}
    </div>
);

export default InputField;

