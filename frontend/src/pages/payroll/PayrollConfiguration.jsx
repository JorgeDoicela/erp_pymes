import { useState, useEffect } from 'react';
import { getPayrollConfig, savePayrollConfig } from '../../services/payroll/payrollConfig.service';

const PayrollConfiguration = () => {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({ workingDays: 30, items: [] });
    const [newItem, setNewItem] = useState({ name: '', type: 'DEDUCTION', isMandatory: false, percentage: '', fixedValue: '' });

    useEffect(() => { loadConfig(); }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await getPayrollConfig();
            if (res.success) setConfig({ workingDays: res.data.workingDays || 30, items: res.data.items || [] });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        if (!newItem.name) return alert('El nombre es requerido');
        if (!newItem.percentage && !newItem.fixedValue) return alert('Debe especificar porcentaje o valor fijo');
        setConfig({ ...config, items: [...config.items, { ...newItem, id: Date.now().toString() }] });
        setNewItem({ name: '', type: 'DEDUCTION', isMandatory: false, percentage: '', fixedValue: '' });
    };

    const handleRemoveItem = (index) => {
        const updated = [...config.items];
        updated.splice(index, 1);
        setConfig({ ...config, items: updated });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await savePayrollConfig(config);
            alert('Configuración guardada correctamente. Se ha generado una nueva versión activa.');
            loadConfig();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";
    const labelClass = "block text-xs font-medium text-gray-600 mb-1";

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Nómina · Parámetros del Sistema</p>
                    <h1 className="text-xl font-semibold text-gray-900">Configuración de Nómina</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Defina los rubros, deducciones e ingresos que se aplican en cada rol de pago.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                    {loading ? 'Guardando...' : 'Guardar Configuración'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Parámetros Generales */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden h-fit">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Parámetros Generales</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className={labelClass}>Días Laborables por Mes</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={config.workingDays}
                                onChange={e => setConfig({ ...config, workingDays: e.target.value })}
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Usado para el cálculo de valor diario (ej. 30 días).</p>
                        </div>
                        <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">Guardar creará una nueva versión histórica de la configuración.</p>
                    </div>
                </div>

                {/* Rubros y Conceptos */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Rubros y Conceptos</h3>
                    </div>

                    {/* Formulario Agregar Rubro */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50/30">
                        <p className="text-xs font-medium text-gray-600 mb-3">Nuevo Rubro</p>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Nombre</label>
                                <input type="text" placeholder="Ej. Aporte IESS" className={inputClass}
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Tipo</label>
                                <select className={inputClass} value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
                                    <option value="DEDUCTION">Deducción (−)</option>
                                    <option value="EARNING">Ingreso (+)</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Porcentaje / Fijo</label>
                                <div className="flex gap-1.5">
                                    <input type="number" placeholder="%" className={inputClass}
                                        value={newItem.percentage}
                                        onChange={e => setNewItem({ ...newItem, percentage: e.target.value, fixedValue: '' })}
                                    />
                                    <input type="number" placeholder="$" className={inputClass}
                                        value={newItem.fixedValue}
                                        onChange={e => setNewItem({ ...newItem, fixedValue: e.target.value, percentage: '' })}
                                    />
                                </div>
                            </div>
                            <button onClick={handleAddItem} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer">
                                + Agregar
                            </button>
                        </div>
                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                            <input type="checkbox" id="isMandatory" checked={newItem.isMandatory}
                                onChange={e => setNewItem({ ...newItem, isMandatory: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600">Obligatorio — aplica a todos los empleados</span>
                        </label>
                    </div>

                    {/* Tabla ERP de Rubros */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Aplicación</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {config.items.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-400">
                                            <p className="font-medium text-gray-700 text-xs">Sin rubros configurados</p>
                                            <p className="text-[11px] mt-0.5">Agrega el primer rubro usando el formulario superior.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    config.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-2.5 px-4 font-medium text-gray-900">{item.name}</td>
                                            <td className="py-2.5 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${item.type === 'EARNING' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                                                    {item.type === 'EARNING' ? 'Ingreso' : 'Deducción'}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                {item.percentage ? `${item.percentage}%` : `$${item.fixedValue}`}
                                            </td>
                                            <td className="py-2.5 px-4 text-gray-500">{item.isMandatory ? 'Obligatorio' : 'Opcional'}</td>
                                            <td className="py-2.5 px-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayrollConfiguration;
