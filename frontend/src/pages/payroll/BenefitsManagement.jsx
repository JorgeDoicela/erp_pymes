import React, { useState, useEffect } from 'react';
import { getEmployees } from '../../services/employees/employee.service';
import { createBenefit, getEmployeeBenefits, deactivateBenefit, bulkCreateBenefit } from '../../services/payroll/benefits.service';
import { FiUsers, FiUser, FiPlus, FiX, FiCheck, FiSettings, FiGift, FiTrello } from 'react-icons/fi';

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
            alert('Beneficio asignado exitosamente');
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
            alert('Asignación masiva completada');
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
                amount: (selectedEmployee ? (parseFloat(selectedEmployee.salary.replace(/[^0-9.]/g, '')) * 0.0833).toFixed(2) : '38.32'),
                type: 'BONUS'
            }));
        } else if (type === 'UTILIDADES') {
            setBulkData(prev => ({
                ...prev,
                name: 'Participación de Utilidades',
                isSpecial: false,
                amount: '450.00',
                type: 'BONUS'
            }));
        } else if (type === 'NAVIDAD') {
            setBulkData(prev => ({
                ...prev,
                name: 'Canasta Navideña / Bono',
                isSpecial: false,
                amount: '100.00',
                type: 'BONUS'
            }));
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <FiGift className="text-pink-500" /> Gestión de Beneficios e Incentivos
                    </h1>
                    <p className="text-slate-500">Administra bonos, viáticos y beneficios de ley.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setBulkModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        <FiUsers /> Asignación Masiva
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Employee List */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-lg font-bold text-slate-800">Empleados</h3>
                        <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold">{employees.length}</span>
                    </div>
                    <div className="space-y-1">
                        {employees.map(emp => (
                            <div
                                key={emp.id}
                                onClick={() => setSelectedEmployee(emp)}
                                className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedEmployee?.id === emp.id
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform translate-x-1'
                                    : 'hover:bg-slate-50 text-slate-600 border-transparent hover:border-slate-100'}`}
                            >
                                <p className="font-bold text-sm truncate">{emp.firstName} {emp.lastName}</p>
                                <p className={`text-[10px] uppercase tracking-wider font-semibold ${selectedEmployee?.id === emp.id ? 'text-blue-100' : 'text-slate-400'}`}>{emp.position}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Benefits Panel */}
                <div className="lg:col-span-3 bg-white rounded-xl p-6 border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
                    {!selectedEmployee ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-slate-400 py-20">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <FiUser size={48} className="text-slate-200" />
                            </div>
                            <p className="text-xl font-bold text-slate-500">Selecciona un empleado</p>
                            <p className="text-sm">Escoge a alguien de la lista para gestionar sus beneficios.</p>
                        </div>
                    ) : (
                        <div className="animate-slideUp">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl uppercase">
                                        {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="font-semibold text-slate-700">{selectedEmployee.department}</span>
                                            <span>•</span>
                                            <span>{selectedEmployee.position}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setModalOpen(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md active:scale-95"
                                >
                                    <FiPlus /> Asignar Beneficio
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-xs uppercase font-bold text-slate-400 tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3">Concepto</th>
                                            <th className="px-4 py-3">Tipo</th>
                                            <th className="px-4 py-3">Frecuencia</th>
                                            <th className="px-4 py-3">Monto</th>
                                            <th className="px-4 py-3 text-center">Estado</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {benefits.map(benefit => (
                                            <tr key={benefit.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="font-bold text-slate-800">{benefit.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Asignado: {new Date(benefit.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${benefit.type === 'BONUS' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        benefit.type === 'INCENTIVE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                            'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {benefit.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-slate-500 font-medium">
                                                    {benefit.frequency === 'ONE_TIME' ? 'Pago Único' : 'Recurrente'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="font-mono text-emerald-600 font-bold text-base">
                                                        ${benefit.amount.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm
                                                        ${benefit.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            benefit.status === 'PROCESSED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                        {benefit.status === 'ACTIVE' ? 'Pendiente' :
                                                            benefit.status === 'PROCESSED' ? 'Procesado' : 'Cancelado'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {benefit.status === 'ACTIVE' && (
                                                        <button
                                                            onClick={() => handleDeactivate(benefit.id)}
                                                            className="text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all opacity-0 group-hover:opacity-100 border border-red-100 hover:border-red-500 shadow-sm"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {benefits.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="py-20 text-center text-slate-400 bg-slate-50/20 rounded-b-xl border-t border-slate-50">
                                                    <FiTrello size={32} className="mx-auto mb-2 opacity-20" />
                                                    No hay beneficios registrados para este empleado.
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl animate-zoomIn">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Nuevo Beneficio</h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Concepto</label>
                                <input
                                    type="text" required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Ej. Bono de Productividad"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Monto ($)</label>
                                    <input
                                        type="number" step="0.01" required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Frecuencia</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="ONE_TIME">Pago Único</option>
                                        <option value="RECURRING">Recurrente</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['BONUS', 'INCENTIVE', 'ALLOWANCE'].map(t => (
                                        <button
                                            key={t} type="button"
                                            onClick={() => setFormData({ ...formData, type: t })}
                                            className={`py-2 rounded-lg text-xs font-bold border transition-all ${formData.type === t ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-colors">Cerrar</button>
                                <button type="submit" className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95">Asignar Ahora</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ASIGNACIÓN MASIVA */}
            {bulkModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl animate-zoomIn flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">Asignación Masiva</h3>
                                <p className="text-slate-400 text-sm">Crea beneficios para múltiples empleados a la vez.</p>
                            </div>
                            <button onClick={() => setBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full"><FiX size={20} /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pr-2 custom-scrollbar">
                            {/* Left: Settings */}
                            <div className="space-y-6">
                                <section>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Plantillas Legales (Ecuador)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => applyTemplate('DECIMO_3')} className="p-3 border rounded-xl hover:border-purple-300 hover:bg-purple-50 text-left transition-all group">
                                            <p className="font-bold text-xs text-purple-700">Décimo Tercero</p>
                                            <p className="text-[10px] text-purple-400">Bono Navideño Ley</p>
                                        </button>
                                        <button onClick={() => applyTemplate('DECIMO_4')} className="p-3 border rounded-xl hover:border-blue-300 hover:bg-blue-50 text-left transition-all group">
                                            <p className="font-bold text-xs text-blue-700">Décimo Cuarto</p>
                                            <p className="text-[10px] text-blue-400">Bono Escolar SBU</p>
                                        </button>
                                        <button onClick={() => applyTemplate('FONDO_RESERVA')} className="p-3 border rounded-xl hover:border-green-300 hover:bg-green-50 text-left transition-all group">
                                            <p className="font-bold text-xs text-green-700">Fondo de Reserva</p>
                                            <p className="text-[10px] text-green-400">8.33% del sueldo</p>
                                        </button>
                                        <button onClick={() => applyTemplate('UTILIDADES')} className="p-3 border rounded-xl hover:border-amber-300 hover:bg-amber-50 text-left transition-all group">
                                            <p className="font-bold text-xs text-amber-700">Utilidades</p>
                                            <p className="text-[10px] text-amber-400">Participación anual</p>
                                        </button>
                                        <button onClick={() => applyTemplate('NAVIDAD')} className="p-3 border rounded-xl hover:border-red-300 hover:bg-red-50 text-left transition-all group col-span-2">
                                            <p className="font-bold text-xs text-red-700">Extra / Navidad</p>
                                            <p className="text-[10px] text-red-400">Canasta o bono voluntario</p>
                                        </button>
                                    </div>
                                </section>

                                <form id="bulkForm" onSubmit={handleBulkCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Beneficio</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:outline-none transition-all shadow-inner"
                                            placeholder="Nombre de la bonificación"
                                            value={bulkData.name}
                                            onChange={e => setBulkData({ ...bulkData, name: e.target.value })}
                                        />
                                    </div>

                                    {!bulkData.isSpecial ? (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Monto Fijo para todos ($)</label>
                                            <input
                                                type="number" step="0.01" required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:outline-none transition-all shadow-inner"
                                                placeholder="0.00"
                                                value={bulkData.amount}
                                                onChange={e => setBulkData({ ...bulkData, amount: e.target.value })}
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FiSettings className="text-purple-600 animate-spin-slow" />
                                                <p className="font-bold text-xs text-purple-700">Cálculo Automático</p>
                                            </div>
                                            <p className="text-[11px] text-purple-600">El sistema calculará el monto automáticamente para cada empleado seleccionado (1 sueldo base).</p>
                                            <button
                                                type="button"
                                                onClick={() => setBulkData({ ...bulkData, isSpecial: false, specialType: '' })}
                                                className="mt-2 text-[10px] font-bold text-purple-700 underline"
                                            >
                                                Cambiar a monto fijo
                                            </button>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Categoría</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:outline-none transition-all"
                                            value={bulkData.type}
                                            onChange={e => setBulkData({ ...bulkData, type: e.target.value })}
                                        >
                                            <option value="BONUS">Bono</option>
                                            <option value="INCENTIVE">Incentivo</option>
                                            <option value="ALLOWANCE">Viático / Otros</option>
                                        </select>
                                    </div>
                                </form>
                            </div>

                            {/* Right: Employee Selection */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seleccionar Empleados</label>
                                    <span className="text-[10px] font-bold text-purple-600">{bulkData.selectedEmployees.length} seleccionados</span>
                                </div>
                                <div className="flex-grow bg-slate-50 p-2 rounded-xl border border-slate-100 overflow-y-auto h-64 shadow-inner custom-scrollbar">
                                    <div className="flex flex-col gap-1">
                                        <label className="p-2 flex items-center gap-3 cursor-pointer hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded-md text-purple-600 focus:ring-purple-500"
                                                checked={bulkData.selectedEmployees.length === employees.length}
                                                onChange={() => setBulkData(prev => ({
                                                    ...prev,
                                                    selectedEmployees: prev.selectedEmployees.length === employees.length ? [] : employees.map(e => e.id)
                                                }))}
                                            />
                                            <span className="text-sm font-bold text-slate-700">Seleccionar Todos</span>
                                        </label>
                                        <div className="h-px bg-slate-200 my-1 mx-2" />
                                        {employees.map(emp => (
                                            <label key={emp.id} className="p-2 flex items-center justify-between cursor-pointer hover:bg-white rounded-lg transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded-md text-purple-600 focus:ring-purple-500"
                                                        checked={bulkData.selectedEmployees.includes(emp.id)}
                                                        onChange={() => toggleBulkEmployee(emp.id)}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{emp.firstName} {emp.lastName}</p>
                                                        <p className="text-[10px] text-slate-400">{emp.department}</p>
                                                    </div>
                                                </div>
                                                {bulkData.selectedEmployees.includes(emp.id) && <FiCheck className="text-emerald-500" />}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                            <button type="button" onClick={() => setBulkModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all">Cancelar</button>
                            <button
                                form="bulkForm"
                                type="submit"
                                disabled={loading || bulkData.selectedEmployees.length === 0}
                                className={`flex-[2] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${loading || bulkData.selectedEmployees.length === 0
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-200 hover:shadow-purple-300'
                                    }`}
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiUsers />}
                                PROCESAR ASIGNACIÓN
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BenefitsManagement;
