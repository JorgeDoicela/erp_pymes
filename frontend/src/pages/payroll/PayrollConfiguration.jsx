import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPayrollConfig, savePayrollConfig } from '../../services/payroll/payrollConfig.service';

const PayrollConfiguration = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({ workingDays: 30, items: [] });
    const [newItem, setNewItem] = useState({ name: '', type: 'DEDUCTION', isMandatory: false, percentage: '', fixedValue: '' });
    const [editingIndex, setEditingIndex] = useState(null);
    const [editItem, setEditItem] = useState({ name: '', type: 'DEDUCTION', isMandatory: false, percentage: '', fixedValue: '' });
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await getPayrollConfig();
            if (res.success && res.data) {
                setConfig({
                    workingDays: res.data.workingDays || 30,
                    items: (res.data.items || []).map((item, idx) => ({
                        ...item,
                        id: item.id || `item-${idx}-${Date.now()}`
                    }))
                });
            }
        } catch (error) {
            toast.error(error.message || 'Error al cargar la configuración de nómina');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        getPayrollConfig()
            .then(res => {
                if (isMounted && res.success && res.data) {
                    setConfig({
                        workingDays: res.data.workingDays || 30,
                        items: (res.data.items || []).map((item, idx) => ({
                            ...item,
                            id: item.id || `item-${idx}-${Date.now()}`
                        }))
                    });
                }
            })
            .catch(error => {
                if (isMounted) toast.error(error.message || 'Error al cargar la configuración de nómina');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    const handleAddItem = (e) => {
        e.preventDefault();
        const trimmedName = newItem.name.trim();
        if (!trimmedName) {
            return toast.error('El nombre del rubro es obligatorio');
        }
        if (!newItem.percentage && !newItem.fixedValue) {
            return toast.error('Debe especificar un porcentaje (%) o un valor fijo ($)');
        }

        const pct = newItem.percentage ? parseFloat(newItem.percentage) : null;
        const fix = newItem.fixedValue ? parseFloat(newItem.fixedValue) : null;

        if (pct !== null && (isNaN(pct) || pct < 0 || pct > 100)) {
            return toast.error('El porcentaje debe ser un valor válido entre 0% y 100%');
        }
        if (fix !== null && (isNaN(fix) || fix < 0)) {
            return toast.error('El valor fijo debe ser un número positivo');
        }

        // Check duplicate name
        if (config.items.some(i => i.name.toLowerCase() === trimmedName.toLowerCase())) {
            return toast.error(`Ya existe un rubro llamado "${trimmedName}"`);
        }

        setConfig({
            ...config,
            items: [
                ...config.items,
                {
                    id: `new-${Date.now()}`,
                    name: trimmedName,
                    type: newItem.type,
                    isMandatory: newItem.isMandatory,
                    percentage: pct,
                    fixedValue: fix
                }
            ]
        });

        setNewItem({ name: '', type: 'DEDUCTION', isMandatory: false, percentage: '', fixedValue: '' });
        toast.success(`Rubro "${trimmedName}" añadido a la lista`);
    };

    const handleStartEdit = (index) => {
        const item = config.items[index];
        setEditingIndex(index);
        setEditItem({
            name: item.name,
            type: item.type,
            isMandatory: item.isMandatory,
            percentage: item.percentage !== null && item.percentage !== undefined ? item.percentage : '',
            fixedValue: item.fixedValue !== null && item.fixedValue !== undefined ? item.fixedValue : ''
        });
    };

    const handleSaveEdit = () => {
        const trimmedName = editItem.name.trim();
        if (!trimmedName) {
            return toast.error('El nombre del rubro no puede estar vacío');
        }
        if (!editItem.percentage && !editItem.fixedValue) {
            return toast.error('Debe especificar un porcentaje (%) o un valor fijo ($)');
        }

        const pct = editItem.percentage !== '' ? parseFloat(editItem.percentage) : null;
        const fix = editItem.fixedValue !== '' ? parseFloat(editItem.fixedValue) : null;

        if (pct !== null && (isNaN(pct) || pct < 0 || pct > 100)) {
            return toast.error('El porcentaje debe ser un valor válido entre 0% y 100%');
        }
        if (fix !== null && (isNaN(fix) || fix < 0)) {
            return toast.error('El valor fijo debe ser un número positivo');
        }

        const updated = [...config.items];
        updated[editingIndex] = {
            ...updated[editingIndex],
            name: trimmedName,
            type: editItem.type,
            isMandatory: editItem.isMandatory,
            percentage: pct,
            fixedValue: fix
        };

        setConfig({ ...config, items: updated });
        setEditingIndex(null);
        toast.success('Rubro actualizado');
    };

    const handleRemoveItem = (index) => {
        const item = config.items[index];
        setConfirmModal({
            open: true,
            title: 'Eliminar Rubro',
            message: `¿Está seguro de eliminar el rubro "${item.name}"? Los cambios se aplicarán al guardar la configuración.`,
            onConfirm: () => {
                const updated = [...config.items];
                updated.splice(index, 1);
                setConfig({ ...config, items: updated });
                setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
                toast.success(`Rubro "${item.name}" eliminado de la lista`);
            }
        });
    };

    const handleLoadLegalPreset = () => {
        const legalItems = [
            { name: 'Aporte Personal IESS', type: 'DEDUCTION', isMandatory: true, percentage: 9.45, fixedValue: null },
            { name: 'Aporte Patronal IESS', type: 'DEDUCTION', isMandatory: false, percentage: 12.15, fixedValue: null },
            { name: 'Fondo de Reserva', type: 'EARNING', isMandatory: true, percentage: 8.33, fixedValue: null },
            { name: 'Décimo Tercer Sueldo', type: 'EARNING', isMandatory: true, percentage: 8.33, fixedValue: null }
        ];

        const applyPreset = () => {
            const existingNames = new Set(config.items.map(i => i.name.toLowerCase()));
            const newItems = [...config.items];
            let addedCount = 0;

            legalItems.forEach(item => {
                if (!existingNames.has(item.name.toLowerCase())) {
                    newItems.push({ ...item, id: `legal-${Date.now()}-${Math.random()}` });
                    addedCount++;
                }
            });

            setConfig({ ...config, items: newItems });
            setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
            if (addedCount > 0) {
                toast.success(`Se agregaron ${addedCount} rubros de ley ecuatoriana.`);
            } else {
                toast.success('Todos los rubros legales ya estaban presentes en la lista.');
            }
        };

        if (config.items.length > 0) {
            setConfirmModal({
                open: true,
                title: 'Cargar Plantilla Legal IESS / Ley',
                message: '¿Desea incorporar la plantilla de rubros de ley laboral (Aporte IESS 9.45%, Patronal 12.15%, Fondo de Reserva y Décimo Tercero)? Los rubros existentes no duplicados se mantendrán.',
                onConfirm: applyPreset
            });
        } else {
            applyPreset();
        }
    };

    const handleSave = async () => {
        const workingDays = parseInt(config.workingDays, 10);
        if (isNaN(workingDays) || workingDays < 1 || workingDays > 31) {
            return toast.error('Los días laborables por mes deben ser un número entre 1 y 31');
        }

        setSaving(true);
        try {
            await savePayrollConfig(config);
            toast.success('Configuración de nómina guardada con éxito.');
            loadConfig();
        } catch (error) {
            toast.error(error.message || 'Error al guardar la configuración');
        } finally {
            setSaving(false);
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
                    <p className="text-sm text-gray-500 mt-0.5">Defina los rubros, deducciones e ingresos base que se aplican al procesar roles de pago.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleLoadLegalPreset}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Cargar Plantilla IESS / Ley
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
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
                                min="1"
                                max="31"
                                className={`${inputClass} font-mono`}
                                style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                                value={config.workingDays}
                                onChange={e => setConfig({ ...config, workingDays: e.target.value })}
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Usado como base para el cálculo del sueldo diario y horas extras (estándar laboral: 30 días).</p>
                        </div>
                        <div className="border-t border-gray-100 pt-3">
                            <p className="text-[11px] text-gray-500 font-medium">Historial y Versiones:</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Al guardar se genera una nueva versión activa de parámetros sin alterar nóminas previamente aprobadas.</p>
                        </div>
                    </div>
                </div>

                {/* Rubros y Conceptos */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Rubros y Conceptos Globales</h3>
                        <span className="text-[11px] font-mono text-gray-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {config.items.length} {config.items.length === 1 ? 'rubro' : 'rubros'}
                        </span>
                    </div>

                    {/* Formulario Agregar Rubro */}
                    <form onSubmit={handleAddItem} className="p-4 border-b border-gray-200 bg-gray-50/30">
                        <p className="text-xs font-medium text-gray-700 mb-3">Añadir Nuevo Rubro</p>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-5">
                                <label className={labelClass}>Nombre del Rubro</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Aporte Personal IESS"
                                    className={inputClass}
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className={labelClass}>Tipo</label>
                                <select
                                    className={inputClass}
                                    value={newItem.type}
                                    onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                >
                                    <option value="DEDUCTION">Deducción (−)</option>
                                    <option value="EARNING">Ingreso (+)</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Valor</label>
                                <div className="flex gap-1">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        placeholder="%"
                                        className={`${inputClass} font-mono px-2`}
                                        value={newItem.percentage}
                                        onChange={e => setNewItem({ ...newItem, percentage: e.target.value, fixedValue: '' })}
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="$"
                                        className={`${inputClass} font-mono px-2`}
                                        value={newItem.fixedValue}
                                        onChange={e => setNewItem({ ...newItem, fixedValue: e.target.value, percentage: '' })}
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                    + Añadir
                                </button>
                            </div>
                        </div>
                        <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={newItem.isMandatory}
                                onChange={e => setNewItem({ ...newItem, isMandatory: e.target.checked })}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600">Obligatorio (aplicar a todos los colaboradores en rol regular)</span>
                        </label>
                    </form>

                    {/* Tabla ERP de Rubros */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200">
                                    <th className="py-2 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nombre del Rubro</th>
                                    <th className="py-2 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="py-2 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Valor / Tasa</th>
                                    <th className="py-2 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Aplicación</th>
                                    <th className="py-2 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-400 text-xs">
                                            Cargando configuración...
                                        </td>
                                    </tr>
                                ) : config.items.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center text-gray-400">
                                            <p className="font-medium text-gray-700 text-xs">Sin rubros configurados</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Utilice el formulario superior o cargue la plantilla legal de ley.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    config.items.map((item, index) => {
                                        const isEditing = editingIndex === index;
                                        return (
                                            <tr key={item.id || index} className="hover:bg-gray-50/60 transition-colors">
                                                {isEditing ? (
                                                    <>
                                                        <td className="py-2 px-4">
                                                            <input
                                                                type="text"
                                                                className={inputClass}
                                                                value={editItem.name}
                                                                onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            <select
                                                                className={inputClass}
                                                                value={editItem.type}
                                                                onChange={e => setEditItem({ ...editItem, type: e.target.value })}
                                                            >
                                                                <option value="DEDUCTION">Deducción (−)</option>
                                                                <option value="EARNING">Ingreso (+)</option>
                                                            </select>
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="%"
                                                                    className={`${inputClass} font-mono px-1.5`}
                                                                    value={editItem.percentage}
                                                                    onChange={e => setEditItem({ ...editItem, percentage: e.target.value, fixedValue: '' })}
                                                                />
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="$"
                                                                    className={`${inputClass} font-mono px-1.5`}
                                                                    value={editItem.fixedValue}
                                                                    onChange={e => setEditItem({ ...editItem, fixedValue: e.target.value, percentage: '' })}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editItem.isMandatory}
                                                                    onChange={e => setEditItem({ ...editItem, isMandatory: e.target.checked })}
                                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                                                                />
                                                                <span className="text-[11px] text-gray-600">Obligatorio</span>
                                                            </label>
                                                        </td>
                                                        <td className="py-2 px-4 text-right space-x-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={handleSaveEdit}
                                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                                                            >
                                                                OK
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingIndex(null)}
                                                                className="px-2 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs rounded transition-colors cursor-pointer"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="py-2.5 px-4 font-medium text-gray-900">{item.name}</td>
                                                        <td className="py-2.5 px-4">
                                                            <span className={`text-[11px] font-medium ${item.type === 'EARNING' ? 'text-green-700' : 'text-red-700'}`}>
                                                                {item.type === 'EARNING' ? 'Ingreso (+)' : 'Deducción (−)'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-4 font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                            {item.percentage ? `${item.percentage}%` : `$${Number(item.fixedValue || 0).toFixed(2)}`}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-gray-600 text-xs">
                                                            {item.isMandatory ? 'Obligatorio' : 'Opcional'}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right space-x-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStartEdit(index)}
                                                                className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmación Estándar ERP */}
            {confirmModal.open && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-md w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">{confirmModal.title}</h3>
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-5 text-xs text-gray-600 leading-relaxed">
                            {confirmModal.message}
                        </div>
                        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmModal.onConfirm}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollConfiguration;
