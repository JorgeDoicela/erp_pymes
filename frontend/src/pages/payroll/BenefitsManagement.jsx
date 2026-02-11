import React, { useState, useEffect } from 'react';
import { getEmployees } from '../../services/employees/employee.service';
import { createBenefit, getEmployeeBenefits, deactivateBenefit } from '../../services/payroll/benefits.service';

const BenefitsManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [benefits, setBenefits] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal & Form
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', amount: '', type: 'BONUS', frequency: 'ONE_TIME'
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
            if (res.success) setEmployees(res.data);
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

    const handleDeactivate = async (id) => {
        if (!confirm('¿Cancelar este beneficio?')) return;
        try {
            await deactivateBenefit(id);
            loadBenefits(selectedEmployee.id);
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Gestión de Beneficios e Incentivos
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Employee List */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm h-[calc(100vh-200px)] overflow-y-auto">
                    <h3 className="text-lg font-bold mb-4 text-slate-800 px-2">Empleados</h3>
                    <div className="space-y-2">
                        {employees.map(emp => (
                            <div
                                key={emp.id}
                                onClick={() => setSelectedEmployee(emp)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedEmployee?.id === emp.id ? 'bg-blue-50 text-blue-700 border border-blue-100 font-medium shadow-sm' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'}`}
                            >
                                <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                                <p className={`text-xs ${selectedEmployee?.id === emp.id ? 'text-blue-500' : 'text-slate-400'}`}>{emp.position}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Benefits Panel */}
                <div className="lg:col-span-3 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    {!selectedEmployee ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                            <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <p className="text-lg font-medium">Selecciona un empleado para gestionar sus beneficios.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                                    <p className="text-slate-500">{selectedEmployee.department} - {selectedEmployee.position}</p>
                                </div>
                                <button
                                    onClick={() => setModalOpen(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Asignar Beneficio
                                </button>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4">Concepto</th>
                                            <th className="p-4">Tipo</th>
                                            <th className="p-4">Frecuencia</th>
                                            <th className="p-4">Monto</th>
                                            <th className="p-4">Estado</th>
                                            <th className="p-4">Fecha Asignación</th>
                                            <th className="p-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {benefits.map(benefit => (
                                            <tr key={benefit.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-medium text-slate-800">{benefit.name}</td>
                                                <td className="p-4">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                        {benefit.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-500">
                                                    {benefit.frequency === 'ONE_TIME' ? 'Pago Único' : 'Recurrente'}
                                                </td>
                                                <td className="p-4 font-mono text-emerald-600 font-bold">
                                                    ${benefit.amount.toFixed(2)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border 
                                                        ${benefit.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            benefit.status === 'PROCESSED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                        {benefit.status === 'ACTIVE' ? 'Pendiente' :
                                                            benefit.status === 'PROCESSED' ? 'Procesado' : 'Cancelado'}
                                                    </span>
                                                </td>
                                                <td className="p-4">{new Date(benefit.createdAt).toLocaleDateString()}</td>
                                                <td className="p-4 text-center">
                                                    {benefit.status === 'ACTIVE' && (
                                                        <button
                                                            onClick={() => handleDeactivate(benefit.id)}
                                                            className="text-red-500 hover:text-red-700 text-xs font-semibold bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {benefits.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="p-12 text-center text-slate-500 bg-slate-50/50">
                                                    No hay beneficios asignados a este empleado.
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

            {/* MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl border border-slate-200 w-96 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Nuevo Beneficio/Bono</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Concepto</label>
                                <input
                                    type="text" required
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                                    placeholder="Ej. Bono Navidad"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Monto ($)</label>
                                <input
                                    type="number" step="0.01" required
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Tipo</label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="BONUS">Bono</option>
                                        <option value="INCENTIVE">Incentivo</option>
                                        <option value="ALLOWANCE">Viático</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Frecuencia</label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="ONE_TIME">Único</option>
                                        <option value="RECURRING">Recurrente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-800 px-4 py-2 font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all hover:shadow-md">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BenefitsManagement;
