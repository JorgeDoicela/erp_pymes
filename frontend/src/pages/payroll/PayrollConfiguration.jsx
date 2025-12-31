import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPayrollConfig, savePayrollConfig } from '../../services/payroll/payrollConfig.service';

const PayrollConfiguration = () => {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        workingDays: 30,
        items: []
    });

    const [newItem, setNewItem] = useState({
        name: '',
        type: 'DEDUCTION', // EARNING or DEDUCTION
        isMandatory: false,
        percentage: '',
        fixedValue: ''
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await getPayrollConfig();
            if (res.success) {
                // Backend returns data.items, we need to ensure structure
                setConfig({
                    workingDays: res.data.workingDays || 30,
                    items: res.data.items || []
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        if (!newItem.name) return alert("El nombre es requerido");
        if (!newItem.percentage && !newItem.fixedValue) return alert("Debe especificar porcentaje o valor fijo");

        setConfig({
            ...config,
            items: [...config.items, { ...newItem, id: Date.now().toString() }] // Temp ID
        });

        setNewItem({
            name: '',
            type: 'DEDUCTION',
            isMandatory: false,
            percentage: '',
            fixedValue: ''
        });
    };

    const handleRemoveItem = (index) => {
        const updatedItems = [...config.items];
        updatedItems.splice(index, 1);
        setConfig({ ...config, items: updatedItems });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await savePayrollConfig(config);
            alert("Configuración guardada correctamente. Se ha generado una nueva versión activa.");
            loadConfig();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-8">
                Configuración de Nómina
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* General Settings */}
                <div className="bg-slate-800 p-6 rounded-xl border border-white/5 space-y-6 h-fit">
                    <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Parámetros Generales</h2>

                    <div>
                        <label className="block text-slate-400 mb-2">Días Laborables (Mes)</label>
                        <input
                            type="number"
                            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white"
                            value={config.workingDays}
                            onChange={e => setConfig({ ...config, workingDays: e.target.value })}
                        />
                        <p className="text-xs text-slate-500 mt-1">Usado para cálculo diario (ej. 30 días)</p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-colors mt-8"
                    >
                        {loading ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                    <p className="text-xs text-center text-slate-500 mt-2">Guardar creará una nueva versión histórica.</p>
                </div>

                {/* Payroll Items (Rubros) */}
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-white/5">
                    <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Rubros y Conceptos</h2>

                    {/* Add Item Form */}
                    <div className="bg-slate-900/50 p-4 rounded-lg mb-6 border border-slate-700/50">
                        <h3 className="font-bold text-sm text-slate-300 mb-4">Agregar Nuevo Rubro</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="lg:col-span-2">
                                <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Aporte IESS"
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm"
                                    value={newItem.type}
                                    onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                >
                                    <option value="DEDUCTION">Deducción (-)</option>
                                    <option value="EARNING">Ingreso (+)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Valor</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="%"
                                        className="w-1/2 bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm"
                                        value={newItem.percentage}
                                        onChange={e => setNewItem({ ...newItem, percentage: e.target.value, fixedValue: '' })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="$"
                                        className="w-1/2 bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm"
                                        value={newItem.fixedValue}
                                        onChange={e => setNewItem({ ...newItem, fixedValue: e.target.value, percentage: '' })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddItem}
                                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg font-bold text-sm transition-colors"
                            >
                                + Agregar
                            </button>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isMandatory"
                                checked={newItem.isMandatory}
                                onChange={e => setNewItem({ ...newItem, isMandatory: e.target.checked })}
                            />
                            <label htmlFor="isMandatory" className="text-sm text-slate-400">Es obligatorio (Aplica a todos)</label>
                        </div>
                    </div>

                    {/* List */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="bg-slate-900 text-slate-200">
                                <tr>
                                    <th className="p-3">Nombre</th>
                                    <th className="p-3">Tipo</th>
                                    <th className="p-3">Valor</th>
                                    <th className="p-3">Obligatorio</th>
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {config.items.length === 0 && (
                                    <tr><td colSpan="5" className="p-4 text-center text-slate-500">No hay rubros configurados.</td></tr>
                                )}
                                {config.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="p-3 font-medium text-white">{item.name}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'EARNING' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {item.type === 'EARNING' ? 'Ingreso' : 'Deducción'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {item.percentage ? `${item.percentage}%` : `$${item.fixedValue}`}
                                        </td>
                                        <td className="p-3">{item.isMandatory ? 'Sí' : 'No'}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => handleRemoveItem(index)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayrollConfiguration;
