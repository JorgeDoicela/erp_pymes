import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPayrollConfig, savePayrollConfig } from '../../services/payroll/payrollConfig.service';
import { FiCheck, FiInfo, FiTrash2, FiEdit2, FiHelpCircle, FiBookOpen, FiPlus, FiCpu, FiShield, FiBriefcase } from 'react-icons/fi';
import Modal from '../../components/common/Modal';

const SYSTEM_DYNAMIC_RUBROS = {
    'Sueldo Base': {
        category: 'SISTEMA_CONTRATO',
        tag: 'Por Contrato Individual',
        desc: 'El valor proviene del sueldo pactado en el contrato de cada colaborador (dividido para 30 días base).'
    },
    'Horas Extras 50%': {
        category: 'SISTEMA_BIOMETRICO',
        tag: 'Reloj Biométrico / Turnos',
        desc: 'Calculado automáticamente por marcaciones después de la jornada ordinaria hasta las 24h00 (Recargo 50%).'
    },
    'Horas Extras 100%': {
        category: 'SISTEMA_BIOMETRICO',
        tag: 'Reloj Biométrico / Feriados',
        desc: 'Calculado automáticamente en fines de semana, días de descanso y feriados nacionales (Recargo 100%).'
    },
    'Recargo Nocturno 25%': {
        category: 'SISTEMA_BIOMETRICO',
        tag: 'Turnos Nocturnos',
        desc: 'Calculado automáticamente para horas laboradas dentro de la franja nocturna de 19h00 a 06h00 (+25%).'
    },
    'Anticipo Quincenal / Sueldo': {
        category: 'SISTEMA_ANTICIPOS',
        tag: 'Módulo de Anticipos',
        desc: 'Descontado automáticamente según solicitudes de anticipo aprobadas y cobradas en el mes.'
    },
    'Impuesto a la Renta': {
        category: 'SISTEMA_SRI',
        tag: 'Tabla Progresiva SRI',
        desc: 'Retención mensual calculada bajo la proyección de ingresos gravables y rebaja por gastos personales del SRI.'
    },
    'Préstamo Quirografario IESS': {
        category: 'SISTEMA_BIESS',
        tag: 'Planilla BIESS / IESS',
        desc: 'Descuento mensual reportado por el BIESS por créditos quirografarios o hipotecarios.'
    }
};

const LEGAL_PRESET_ITEMS = [
    { name: 'Sueldo Base', type: 'EARNING', isMandatory: true, percentage: null, fixedValue: null },
    { name: 'Horas Extras 50%', type: 'EARNING', isMandatory: false, percentage: null, fixedValue: null },
    { name: 'Horas Extras 100%', type: 'EARNING', isMandatory: false, percentage: null, fixedValue: null },
    { name: 'Aporte IESS Personal', type: 'DEDUCTION', isMandatory: true, percentage: 9.45, fixedValue: null },
    { name: 'Aporte IESS Patronal', type: 'DEDUCTION', isMandatory: false, percentage: 12.15, fixedValue: null },
    { name: 'Décimo Tercer Sueldo', type: 'EARNING', isMandatory: true, percentage: 8.33, fixedValue: null },
    { name: 'Décimo Cuarto Sueldo', type: 'EARNING', isMandatory: true, percentage: null, fixedValue: 38.33 },
    { name: 'Fondo de Reserva', type: 'EARNING', isMandatory: false, percentage: 8.33, fixedValue: null },
    { name: 'Anticipo Quincenal / Sueldo', type: 'DEDUCTION', isMandatory: false, percentage: null, fixedValue: null },
    { name: 'Impuesto a la Renta', type: 'DEDUCTION', isMandatory: false, percentage: null, fixedValue: null },
    { name: 'Préstamo Quirografario IESS', type: 'DEDUCTION', isMandatory: false, percentage: null, fixedValue: null }
];

const PayrollConfiguration = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({ workingDays: 30, items: [] });

    // New Item Form State
    const [newItemMode, setNewItemMode] = useState('PERCENTAGE'); // 'PERCENTAGE' | 'FIXED'
    const [newItem, setNewItem] = useState({
        name: '',
        type: 'EARNING',
        isMandatory: false,
        value: ''
    });

    // Edit Item Form State
    const [editingIndex, setEditingIndex] = useState(null);
    const [editItemMode, setEditItemMode] = useState('PERCENTAGE');
    const [editItem, setEditItem] = useState({
        name: '',
        type: 'EARNING',
        isMandatory: false,
        value: ''
    });

    const [showGuideModal, setShowGuideModal] = useState(false);
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
        loadConfig();
    }, []);

    const handleAddItem = (e) => {
        e.preventDefault();
        const trimmedName = newItem.name.trim();
        if (!trimmedName) {
            return toast.error('El nombre del rubro es obligatorio');
        }

        const val = parseFloat(newItem.value);
        if (isNaN(val) || val < 0) {
            return toast.error(`Debe ingresar un valor numérico válido para el ${newItemMode === 'PERCENTAGE' ? 'porcentaje' : 'monto fijo'}`);
        }
        if (newItemMode === 'PERCENTAGE' && val > 100) {
            return toast.error('El porcentaje no puede ser superior al 100%');
        }

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
                    percentage: newItemMode === 'PERCENTAGE' ? val : null,
                    fixedValue: newItemMode === 'FIXED' ? val : null
                }
            ]
        });

        setNewItem({ name: '', type: 'EARNING', isMandatory: false, value: '' });
        toast.success(`Rubro "${trimmedName}" añadido`);
    };

    const handleStartEdit = (index) => {
        const item = config.items[index];
        const isPct = item.percentage !== null && item.percentage !== undefined;
        setEditingIndex(index);
        setEditItemMode(isPct ? 'PERCENTAGE' : 'FIXED');
        setEditItem({
            name: item.name,
            type: item.type,
            isMandatory: item.isMandatory || false,
            value: isPct ? item.percentage : item.fixedValue !== null && item.fixedValue !== undefined ? item.fixedValue : ''
        });
    };

    const handleSaveEdit = () => {
        const trimmedName = editItem.name.trim();
        if (!trimmedName) return toast.error('El nombre del rubro no puede estar vacío');

        const isDynamic = !!SYSTEM_DYNAMIC_RUBROS[trimmedName];
        let pct = null;
        let fix = null;

        if (!isDynamic) {
            const val = parseFloat(editItem.value);
            if (isNaN(val) || val < 0) {
                return toast.error('Ingrese un valor numérico válido');
            }
            if (editItemMode === 'PERCENTAGE') {
                if (val > 100) return toast.error('El porcentaje no puede exceder el 100%');
                pct = val;
            } else {
                fix = val;
            }
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
        const applyPreset = () => {
            const existingNames = new Set(config.items.map(i => i.name.toLowerCase()));
            const newItems = [...config.items];
            let addedCount = 0;

            LEGAL_PRESET_ITEMS.forEach(item => {
                if (!existingNames.has(item.name.toLowerCase())) {
                    newItems.push({
                        id: `legal-${Date.now()}-${Math.random()}`,
                        name: item.name,
                        type: item.type,
                        isMandatory: item.isMandatory,
                        percentage: item.percentage,
                        fixedValue: item.fixedValue
                    });
                    addedCount++;
                }
            });

            setConfig({ ...config, workingDays: 30, items: newItems });
            setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
            if (addedCount > 0) {
                toast.success(`Se incorporaron ${addedCount} rubros de la plantilla legal.`);
            } else {
                toast.success('Todos los rubros de ley ya están configurados.');
            }
        };

        if (config.items.length > 0) {
            setConfirmModal({
                open: true,
                title: 'Cargar Plantilla Legal IESS & Código del Trabajo',
                message: '¿Desea incorporar todos los rubros de ley ecuatoriana (Sueldo base, Horas Extras, IESS Personal 9.45%, Patronal 12.15%, 13ro, 14to SBU/12, Fondos de Reserva y Anticipos)?',
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

    const inputClass = "w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";
    const labelClass = "block text-[11px] font-medium text-gray-600 mb-1";

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Nómina · Legislación Laboral del Ecuador</p>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Parámetros y Catálogo de Rubros de Nómina</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Definición de base de cálculo mensual, aportes al IESS, beneficios de ley y bonificaciones.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowGuideModal(true)}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <FiBookOpen size={13} />
                        <span>Guía Legal Ecuador</span>
                    </button>
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
                {/* Columna Izquierda: Parámetros Generales y Explicación Legal */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden h-fit space-y-4 p-4 text-xs">
                    <div className="border-b border-gray-100 pb-2">
                        <h3 className="font-semibold text-gray-900 uppercase tracking-wider text-xs flex items-center justify-between">
                            <span>Base de Cálculo Mensual</span>
                            <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                30 Días / 240 Horas
                            </span>
                        </h3>
                    </div>

                    <div>
                        <label className={labelClass}>Días Laborables Estándar por Mes</label>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            className={`${inputClass} font-mono font-bold text-gray-900`}
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                            value={config.workingDays}
                            onChange={e => setConfig({ ...config, workingDays: e.target.value })}
                        />
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                            <strong>Estándar Ecuatoriano: 30 días</strong> (Código del Trabajo Art. 82 e IESS). Se utiliza base 30 para liquidar sueldos regulares completos en todos los meses (febrero, meses de 31 días, etc.).
                        </p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2 text-[11px] text-gray-600 leading-relaxed">
                        <div className="font-semibold text-gray-800 flex items-center gap-1">
                            <FiHelpCircle className="text-blue-600" size={13} />
                            Cálculo de Días y Fechas en Ecuador:
                        </div>
                        <ul className="space-y-1.5 list-disc pl-4 text-gray-600">
                            <li>
                                <strong>Mes Completo (30 días):</strong> Si el colaborador trabaja el mes entero sin faltas, cobra el 100% de su sueldo base pactado.
                            </li>
                            <li>
                                <strong>Ingresos / Salidas proporcionales:</strong> Si entra a mitad de mes (ej. el día 15), se liquidan los días trabajados en base 30 (<span className="font-mono text-gray-800">Sueldo / 30 × Días</span>).
                            </li>
                            <li>
                                <strong>Faltas injustificadas:</strong> Cada ausencia descuenta 1 día de labor (<span className="font-mono text-gray-800">Sueldo / 30</span>) más la fracción de descanso semanal.
                            </li>
                            <li>
                                <strong>Valor Hora Ordinaria:</strong> <span className="font-mono text-gray-800">Sueldo / 240 horas</span> (30 días × 8 horas).
                            </li>
                        </ul>
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                        <p className="text-[11px] text-gray-500 font-medium">Versionado Activo:</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Al guardar se genera una nueva versión activa para las próximas liquidaciones sin alterar nóminas ya cerradas o aprobadas.</p>
                    </div>
                </div>

                {/* Columna Derecha: Catálogo de Rubros */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Catálogo de Rubros y Conceptos</h3>
                        <span className="text-[11px] font-mono text-gray-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {config.items.length} {config.items.length === 1 ? 'rubro' : 'rubros'}
                        </span>
                    </div>

                    {/* Formulario Agregar Rubro Personalizado */}
                    <form onSubmit={handleAddItem} className="p-4 border-b border-gray-200 bg-gray-50/30 text-xs">
                        <p className="font-semibold text-gray-800 text-xs mb-3 flex items-center gap-1.5">
                            <FiPlus className="text-blue-600" /> Añadir Nuevo Rubro o Bonificación
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-4">
                                <label className={labelClass}>Nombre del Rubro *</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Bono de Movilización"
                                    className={inputClass}
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className={labelClass}>Naturaleza *</label>
                                <select
                                    className={inputClass}
                                    value={newItem.type}
                                    onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                >
                                    <option value="EARNING">Ingreso (+)</option>
                                    <option value="DEDUCTION">Deducción (−)</option>
                                </select>
                            </div>

                            <div className="sm:col-span-3">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-medium text-gray-600">Valor / Tasa *</label>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                        <button
                                            type="button"
                                            onClick={() => setNewItemMode('PERCENTAGE')}
                                            className={`px-1.5 py-0.5 rounded font-mono font-medium ${newItemMode === 'PERCENTAGE' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-400'}`}
                                        >
                                            % Tasa
                                        </button>
                                        <span>|</span>
                                        <button
                                            type="button"
                                            onClick={() => setNewItemMode('FIXED')}
                                            className={`px-1.5 py-0.5 rounded font-mono font-medium ${newItemMode === 'FIXED' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-400'}`}
                                        >
                                            $ Fijo
                                        </button>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={newItemMode === 'PERCENTAGE' ? 100 : undefined}
                                        placeholder={newItemMode === 'PERCENTAGE' ? 'Ej: 5.00%' : 'Ej: 50.00$'}
                                        className={`${inputClass} font-mono`}
                                        value={newItem.value}
                                        onChange={e => setNewItem({ ...newItem, value: e.target.value })}
                                    />
                                    <span className="absolute right-2.5 top-1.5 text-gray-400 font-mono text-xs pointer-events-none">
                                        {newItemMode === 'PERCENTAGE' ? '%' : 'USD'}
                                    </span>
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                                >
                                    + Añadir
                                </button>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={newItem.isMandatory}
                                onChange={e => setNewItem({ ...newItem, isMandatory: e.target.checked })}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[11px] text-gray-600">Aplicar obligatoriamente a todos los colaboradores en cada rol regular</span>
                        </label>
                    </form>

                    {/* Tabla de Rubros con Estados Claros */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/75 border-b border-gray-200">
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rubro / Concepto</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Modo de Cálculo / Valor</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Aplicación</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-400 text-xs">
                                            Cargando catálogo de rubros...
                                        </td>
                                    </tr>
                                ) : config.items.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center text-gray-400">
                                            No hay rubros configurados. Haz clic en "Cargar Plantilla IESS / Ley" para iniciar.
                                        </td>
                                    </tr>
                                ) : (
                                    config.items.map((item, index) => {
                                        const dynamicInfo = SYSTEM_DYNAMIC_RUBROS[item.name];
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
                                                                <option value="EARNING">Ingreso (+)</option>
                                                                <option value="DEDUCTION">Deducción (−)</option>
                                                            </select>
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            {dynamicInfo ? (
                                                                <div className="text-[11px] text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                                                    {dynamicInfo.tag} (Automático)
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5">
                                                                    <select
                                                                        className="w-20 bg-white border border-gray-200 rounded px-1.5 py-1 text-[11px]"
                                                                        value={editItemMode}
                                                                        onChange={e => setEditItemMode(e.target.value)}
                                                                    >
                                                                        <option value="PERCENTAGE">% Tasa</option>
                                                                        <option value="FIXED">$ Fijo</option>
                                                                    </select>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        className={`${inputClass} font-mono`}
                                                                        value={editItem.value}
                                                                        onChange={e => setEditItem({ ...editItem, value: e.target.value })}
                                                                    />
                                                                </div>
                                                            )}
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
                                                        <td className="py-2 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={handleSaveEdit}
                                                                    className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                                                                >
                                                                    Guardar
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingIndex(null)}
                                                                    className="px-2.5 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="py-2.5 px-4">
                                                            <div className="font-semibold text-gray-900">{item.name}</div>
                                                            {dynamicInfo && (
                                                                <div className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                                                                    {dynamicInfo.desc}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 px-4">
                                                            <span className={`text-xs font-semibold ${item.type === 'EARNING' ? 'text-emerald-700' : 'text-red-700'}`}>
                                                                {item.type === 'EARNING' ? 'Ingreso (+)' : 'Deducción (−)'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-4 font-mono">
                                                            {dynamicInfo ? (
                                                                <span className="text-[11px] font-sans font-medium text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                                                    <FiCpu size={11} className="text-gray-500" />
                                                                    {dynamicInfo.tag}
                                                                </span>
                                                            ) : item.percentage !== null && item.percentage !== undefined ? (
                                                                <span className="text-xs font-bold text-gray-900 tabular-nums">
                                                                    {parseFloat(item.percentage).toFixed(2)}%
                                                                </span>
                                                            ) : item.fixedValue !== null && item.fixedValue !== undefined ? (
                                                                <span className="text-xs font-bold text-gray-900 tabular-nums">
                                                                    ${parseFloat(item.fixedValue).toFixed(2)} USD
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-gray-600 text-[11px]">
                                                            {item.isMandatory ? (
                                                                <span className="text-blue-800 font-medium bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                                                    Obligatorio General
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-500">
                                                                    Opcional / Por Caso
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartEdit(index)}
                                                                    className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                                                >
                                                                    Editar
                                                                </button>
                                                                {!dynamicInfo && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveItem(index)}
                                                                        className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                                                    >
                                                                        Eliminar
                                                                    </button>
                                                                )}
                                                            </div>
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

            {/* Modal: Guía Laboral Ecuador */}
            <Modal
                isOpen={showGuideModal}
                onClose={() => setShowGuideModal(false)}
                title="Normativa y Fórmulas Laborales (Ecuador)"
                subtitle="Código del Trabajo, IESS y Ministerio del Trabajo"
                size="lg"
                footer={
                    <button
                        onClick={() => setShowGuideModal(false)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shadow-xs"
                    >
                        Entendido
                    </button>
                }
            >
                <div className="space-y-4 text-gray-700 leading-relaxed">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1.5">
                        <h4 className="font-bold text-gray-900 text-xs">1. Base de Cálculo de 30 Días (Mes Comercial)</h4>
                        <p className="text-[11px] text-gray-600">
                            En Ecuador, los sueldos mensuales regulares cubren 30 días independientemente del mes calendario (28, 29, 30 o 31 días).
                            El valor hora se calcula dividiendo el sueldo para <strong>240 horas</strong> (<span className="font-mono">30 días × 8 horas/día</span>).
                        </p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1.5">
                        <h4 className="font-bold text-gray-900 text-xs">2. Recargos y Horas Extraordinarias</h4>
                        <ul className="list-disc pl-4 text-[11px] text-gray-600 space-y-1">
                            <li><strong>Recargo Nocturno (25%):</strong> Turnos ordinarios entre las 19h00 y las 06h00.</li>
                            <li><strong>Horas Suplementarias (50%):</strong> Trabajo posterior a la jornada hasta las 24h00 (<span className="font-mono">Hora × 1.50</span>).</li>
                            <li><strong>Horas Extraordinarias (100%):</strong> Fines de semana, feriados o de 24h00 a 06h00 (<span className="font-mono">Hora × 2.00</span>).</li>
                        </ul>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1.5">
                        <h4 className="font-bold text-gray-900 text-xs">3. Aportes IESS y Beneficios de Ley</h4>
                        <ul className="list-disc pl-4 text-[11px] text-gray-600 space-y-1">
                            <li><strong>Aporte Personal IESS (9.45%):</strong> Descuento sobre sueldo + horas extras + comisiones.</li>
                            <li><strong>Aporte Patronal IESS (12.15%):</strong> Costo a cargo de la empresa (no se descuenta al trabajador).</li>
                            <li><strong>Décimo Tercero (8.33%):</strong> Bono navideño equivalente a la doceava parte de lo ganado.</li>
                            <li><strong>Décimo Cuarto ($38.33):</strong> Bono escolar equivalente a 1/12 del SBU ($470 / 12).</li>
                            <li><strong>Fondos de Reserva (8.33%):</strong> A partir del año (mes 13) de labores continuas.</li>
                        </ul>
                    </div>
                </div>
            </Modal>

            {/* Modal de Confirmación */}
            <Modal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
                title={confirmModal.title}
                size="sm"
                footer={
                    <>
                        <button
                            onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
                            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmModal.onConfirm}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shadow-xs"
                        >
                            Continuar
                        </button>
                    </>
                }
            >
                <div className="text-gray-600 leading-relaxed text-xs">
                    {confirmModal.message}
                </div>
            </Modal>
        </div>
    );
};

export default PayrollConfiguration;
