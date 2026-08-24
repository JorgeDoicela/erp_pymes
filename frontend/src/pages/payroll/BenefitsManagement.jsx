import { useState, useEffect } from 'react';
import { getEmployees } from '../../services/employees/employee.service';
import { createBenefit, getEmployeeBenefits, deactivateBenefit, bulkCreateBenefit } from '../../services/payroll/benefits.service';

const BenefitsManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [benefits, setBenefits] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);

    // Forms
    const [formData, setFormData] = useState({
        name: '', amount: '', type: 'BONUS', frequency: 'ONE_TIME'
    });
    const [bulkData, setBulkData] = useState({
        name: '', amount: '', type: 'BONUS',
        isSpecial: false, specialType: '',
        selectedEmployees: []
    });

    useEffect(() => {
        loadEmployees();
    }, []);

    useEffect(() => {
        if (selectedEmployee) {
            loadBenefits(selectedEmployee.id);
        }
    }, [selectedEmployee]);

    const loadEmployees = async () => {
        try {
            const res = await getEmployees();
            if (res.success) {
                setEmployees(res.data);
                setBulkData(prev => ({ ...prev, selectedEmployees: res.data.map(e => e.id) }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadBenefits = async (empId) => {
        try {
            const res = await getEmployeeBenefits(empId);
            if (res.success) setBenefits(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        try {
            await createBenefit({ ...formData, amount: parseFloat(formData.amount), employeeId: selectedEmployee.id });
            setModalOpen(false);
            setFormData({ name: '', amount: '', type: 'BONUS', frequency: 'ONE_TIME' });
            loadBenefits(selectedEmployee.id);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleBulkCreate = async (e) => {
        e.preventDefault();
        if (bulkData.selectedEmployees.length === 0) return alert('Selecciona al menos un empleado');

        try {
            setLoading(true);
            const payload = {
                employeeIds: bulkData.selectedEmployees,
                name: bulkData.name,
                amount: bulkData.isSpecial ? 0 : parseFloat(bulkData.amount),
                type: bulkData.type,
                frequency: 'ONE_TIME',
                isSpecialCalculation: bulkData.isSpecial ? bulkData.specialType : null
            };

            await bulkCreateBenefit(payload);
            setBulkModalOpen(false);
            if (selectedEmployee) loadBenefits(selectedEmployee.id);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (id) => {
        if (!confirm('¿Cancelar este beneficio?')) return;
        try {
            await deactivateBenefit(id);
            loadBenefits(selectedEmployee.id);
        } catch (error) {
            alert(error.message);
        }
    };

    const toggleBulkEmployee = (id) => {
        setBulkData(prev => ({
            ...prev,
            selectedEmployees: prev.selectedEmployees.includes(id)
                ? prev.selectedEmployees.filter(e => e !== id)
                : [...prev.selectedEmployees, id]
        }));
    };

    const applyTemplate = (type) => {
        if (type === 'DECIMO_3') {
            setBulkData(prev => ({
                ...prev,
                name: 'Décimo Tercer Sueldo',
                isSpecial: true,
                specialType: 'DECIMO_TERCERO',
                type: 'BONUS',
                amount: ''
            }));
        } else if (type === 'DECIMO_4') {
            setBulkData(prev => ({
                ...prev,
                name: 'Décimo Cuarto Sueldo',
                isSpecial: true,
                specialType: 'DECIMO_CUARTO',
                type: 'BONUS',
                amount: ''
            }));
        } else if (type === 'FONDO_RESERVA') {
            setBulkData(prev => ({
                ...prev,
                name: 'Fondos de Reserva (Mensual)',
                isSpecial: false,
                amount: (selectedEmployee ? (parseFloat(selectedEmployee.salary?.toString().replace(/[^0-9.]/g, '') || '0') * 0.0833).toFixed(2) : ''),
                type: 'BONUS'
            }));
        } else if (type === 'UTILIDADES') {
            // Participación de Utilidades: calculada como porcentaje del salario real o dejada en blanco para que el admin la ingrese
            const utilAmountEst = selectedEmployee
                ? (parseFloat(selectedEmployee.salary?.toString().replace(/[^0-9.]/g, '') || '0') * 0.10).toFixed(2)
                : '';
            setBulkData(prev => ({
                ...prev,
                name: 'Participación de Utilidades',
                isSpecial: false,
                amount: utilAmountEst,
                type: 'BONUS'
            }));
        } else if (type === 'NAVIDAD') {
            // Canasta Navideña: calculada o dejada en blanco para que el admin ingrese el monto real
            const xmasAmountEst = selectedEmployee
                ? (parseFloat(selectedEmployee.salary?.toString().replace(/[^0-9.]/g, '') || '0') * 0.083).toFixed(2)
                : '';
            setBulkData(prev => ({
                ...prev,
                name: 'Canasta Navideña / Bono',
                isSpecial: false,
                amount: xmasAmountEst,
                type: 'BONUS'
            }));
        }
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";
    const labelClass = "block text-xs font-medium text-gray-600 mb-1";

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Nómina · Beneficios e Incentivos</p>
                    <h1 className="text-xl font-semibold text-gray-900">Gestión de Beneficios e Incentivos</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Administre bonos, viáticos y beneficios de ley para el personal.</p>
                </div>
                <button
                    onClick={() => setBulkModalOpen(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                >
                    + Asignación Masiva
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Employee List */}
                <div className="bg-white rounded border border-gray-200 overflow-hidden h-[calc(100vh-220px)] flex flex-col">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Empleados</h3>
                        <span className="text-[11px] font-mono text-gray-400">{employees.length}</span>
                    </div>
                    <div className="divide-y divide-gray-100 overflow-y-auto flex-grow">
                        {employees.map(emp => (
                            <div
                                key={emp.id}
                                onClick={() => setSelectedEmployee(emp)}
                                className={`px-4 py-2.5 cursor-pointer transition-colors text-xs ${
                                    selectedEmployee?.id === emp.id
                                        ? 'bg-blue-50 border-l-2 border-blue-500 font-medium text-blue-900'
                                        : 'hover:bg-gray-50/60 text-gray-700'
                                }`}
                            >
                                <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                                <p className="text-gray-400 text-[11px]">{emp.position}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Benefits Panel */}
                <div className="lg:col-span-3 bg-white rounded border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
                    {!selectedEmployee ? (
                        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                            <p className="text-sm font-medium text-gray-700">Seleccione un empleado</p>
                            <p className="text-xs text-gray-400 mt-1">Escoja un colaborador de la lista para gestionar sus beneficios.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                                    <p className="text-xs text-gray-500">{selectedEmployee.department} · {selectedEmployee.position}</p>
                                </div>
                                <button
                                    onClick={() => setModalOpen(true)}
                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                                >
                                    + Asignar Beneficio
                                </button>
                            </div>

                            {/* Tabla ERP de Beneficios */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Concepto</th>
                                            <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                            <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Frecuencia</th>
                                            <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Monto</th>
                                            <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Estado</th>
                                            <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {benefits.map(benefit => (
                                            <tr key={benefit.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-2.5 px-4 font-medium text-gray-900">{benefit.name}</td>
                                                <td className="py-2.5 px-4">
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-medium border bg-gray-50 text-gray-700 border-gray-200">
                                                        {benefit.type}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-gray-500">
                                                    {benefit.frequency === 'ONE_TIME' ? 'Pago Único' : 'Recurrente'}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                    ${benefit.amount.toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                                                        benefit.status === 'ACTIVE' ? 'bg-green-50 text-green-800 border-green-200' :
                                                        benefit.status === 'PROCESSED' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-red-50 text-red-800 border-red-200'
                                                    }`}>
                                                        {benefit.status === 'ACTIVE' ? 'PENDIENTE' : benefit.status === 'PROCESSED' ? 'PROCESADO' : 'CANCELADO'}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    {benefit.status === 'ACTIVE' && (
                                                        <button
                                                            onClick={() => handleDeactivate(benefit.id)}
                                                            className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {benefits.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-gray-400">
                                                    Sin beneficios asignados a este colaborador.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL ASIGNACIÓN INDIVIDUAL */}
            {modalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-md w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Nuevo Beneficio Individual</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer">×</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4">
                            <div>
                                <label className={labelClass}>Concepto</label>
                                <input
                                    type="text" required
                                    className={inputClass}
                                    placeholder="Ej. Bono de Productividad"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Monto ($)</label>
                                    <input
                                        type="number" step="0.01" required
                                        className={inputClass + ' font-mono'}
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Frecuencia</label>
                                    <select
                                        className={inputClass}
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="ONE_TIME">Pago Único</option>
                                        <option value="RECURRING">Recurrente</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Tipo</label>
                                <select
                                    className={inputClass}
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="BONUS">Bono</option>
                                    <option value="INCENTIVE">Incentivo</option>
                                    <option value="ALLOWANCE">Viático / Otros</option>
                                </select>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer">Asignar Beneficio</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ASIGNACIÓN MASIVA */}
            {bulkModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-2xl w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Asignación Masiva de Beneficios</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Asigne beneficios a múltiples colaboradores simultáneamente.</p>
                            </div>
                            <button onClick={() => setBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer">×</button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            {/* Plantillas */}
                            <div>
                                <label className={labelClass}>Plantillas Legales (Ecuador)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button type="button" onClick={() => applyTemplate('DECIMO_3')} className="p-2 border border-gray-200 hover:border-gray-300 rounded text-left hover:bg-gray-50 transition-colors">
                                        <p className="font-semibold text-xs text-gray-800">Décimo Tercero</p>
                                        <p className="text-[11px] text-gray-400">Bono Navideño</p>
                                    </button>
                                    <button type="button" onClick={() => applyTemplate('DECIMO_4')} className="p-2 border border-gray-200 hover:border-gray-300 rounded text-left hover:bg-gray-50 transition-colors">
                                        <p className="font-semibold text-xs text-gray-800">Décimo Cuarto</p>
                                        <p className="text-[11px] text-gray-400">Bono Escolar SBU</p>
                                    </button>
                                    <button type="button" onClick={() => applyTemplate('FONDO_RESERVA')} className="p-2 border border-gray-200 hover:border-gray-300 rounded text-left hover:bg-gray-50 transition-colors">
                                        <p className="font-semibold text-xs text-gray-800">Fondo Reserva</p>
                                        <p className="text-[11px] text-gray-400">8.33% sueldo</p>
                                    </button>
                                    <button type="button" onClick={() => applyTemplate('UTILIDADES')} className="p-2 border border-gray-200 hover:border-gray-300 rounded text-left hover:bg-gray-50 transition-colors">
                                        <p className="font-semibold text-xs text-gray-800">Utilidades</p>
                                        <p className="text-[11px] text-gray-400">Participación anual</p>
                                    </button>
                                </div>
                            </div>

                            <form id="bulkForm" onSubmit={handleBulkCreate} className="space-y-3">
                                <div>
                                    <label className={labelClass}>Nombre del Beneficio</label>
                                    <input type="text" required className={inputClass} placeholder="Ej. Bono de Desempeño" value={bulkData.name} onChange={e => setBulkData({ ...bulkData, name: e.target.value })} />
                                </div>

                                {!bulkData.isSpecial ? (
                                    <div>
                                        <label className={labelClass}>Monto Fijo ($)</label>
                                        <input type="number" step="0.01" required className={inputClass + ' font-mono'} placeholder="0.00" value={bulkData.amount} onChange={e => setBulkData({ ...bulkData, amount: e.target.value })} />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                                        <p className="font-medium">Cálculo Automático por Ley</p>
                                        <p className="text-[11px] mt-0.5">El sistema calculará el valor según la fórmula legal correspondiente.</p>
                                    </div>
                                )}

                                <div>
                                    <label className={labelClass}>Categoría</label>
                                    <select className={inputClass} value={bulkData.type} onChange={e => setBulkData({ ...bulkData, type: e.target.value })}>
                                        <option value="BONUS">Bono</option>
                                        <option value="INCENTIVE">Incentivo</option>
                                        <option value="ALLOWANCE">Viático / Otros</option>
                                    </select>
                                </div>
                            </form>

                            {/* Empleados masivos */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className={labelClass}>Selección de Colaboradores</label>
                                    <span className="text-[11px] font-mono text-gray-500">{bulkData.selectedEmployees.length} seleccionados</span>
                                </div>
                                <div className="border border-gray-200 rounded max-h-40 overflow-y-auto divide-y divide-gray-100">
                                    <label className="p-2.5 flex items-center gap-2 cursor-pointer hover:bg-gray-50 text-xs font-semibold text-gray-800 bg-gray-50/50">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={bulkData.selectedEmployees.length === employees.length}
                                            onChange={() => setBulkData(prev => ({
                                                ...prev,
                                                selectedEmployees: prev.selectedEmployees.length === employees.length ? [] : employees.map(e => e.id)
                                            }))}
                                        />
                                        <span>Seleccionar Todos ({employees.length})</span>
                                    </label>
                                    {employees.map(emp => (
                                        <label key={emp.id} className="p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 text-xs text-gray-700">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={bulkData.selectedEmployees.includes(emp.id)}
                                                onChange={() => toggleBulkEmployee(emp.id)}
                                            />
                                            <span>{emp.firstName} {emp.lastName}</span>
                                            <span className="text-[11px] text-gray-400 ml-auto">{emp.department}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button type="button" onClick={() => setBulkModalOpen(false)} className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer">Cancelar</button>
                            <button form="bulkForm" type="submit" disabled={loading || bulkData.selectedEmployees.length === 0} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50">
                                {loading ? 'Procesando...' : 'Procesar Asignación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BenefitsManagement;
