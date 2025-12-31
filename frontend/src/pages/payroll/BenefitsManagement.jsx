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
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">
                Gestión de Beneficios e Incentivos
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Employee List */}
                <div className="bg-slate-800 rounded-xl p-4 border border-white/5 h-[calc(100vh-200px)] overflow-y-auto">
                    <h3 className="text-lg font-bold mb-4 text-slate-300">Empleados</h3>
                    <div className="space-y-2">
                        {employees.map(emp => (
                            <div
                                key={emp.id}
                                onClick={() => setSelectedEmployee(emp)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedEmployee?.id === emp.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
                            >
                                <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                                <p className="text-xs opacity-70">{emp.position}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Benefits Panel */}
                <div className="lg:col-span-3 bg-slate-800 rounded-xl p-6 border border-white/5">
                    {!selectedEmployee ? (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            <p>Selecciona un empleado para gestionar sus beneficios.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                                    <p className="text-slate-400">{selectedEmployee.department} - {selectedEmployee.position}</p>
                                </div>
                                <button
                                    onClick={() => setModalOpen(true)}
                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                                >
                                    + Asignar Beneficio
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-500">
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
                                    <tbody className="divide-y divide-white/5">
                                        {benefits.map(benefit => (
                                            <tr key={benefit.id} className="hover:bg-slate-700/30">
                                                <td className="p-4 font-medium text-white">{benefit.name}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-700 text-blue-300">
                                                        {benefit.type}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {benefit.frequency === 'ONE_TIME' ? 'Pago Único' : 'Recurrente'}
                                                </td>
                                                <td className="p-4 font-mono text-emerald-400 font-bold">
                                                    ${benefit.amount.toFixed(2)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold 
                                                        ${benefit.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                                                            benefit.status === 'PROCESSED' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {benefit.status === 'ACTIVE' ? 'Pendiente' :
                                                            benefit.status === 'PROCESSED' ? 'Procesado' : 'Cancelado'}
                                                    </span>
                                                </td>
                                                <td className="p-4">{new Date(benefit.createdAt).toLocaleDateString()}</td>
                                                <td className="p-4 text-center">
                                                    {benefit.status === 'ACTIVE' && (
                                                        <button
                                                            onClick={() => handleDeactivate(benefit.id)}
                                                            className="text-red-400 hover:text-red-300 text-xs font-bold"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {benefits.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="p-8 text-center text-slate-500">
                                                    No hay beneficios asignados.
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-8 rounded-xl border border-white/10 w-96 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Nuevo Beneficio/Bono</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Concepto</label>
                                <input
                                    type="text" required
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    placeholder="Ej. Bono Navidad"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Monto ($)</label>
                                <input
                                    type="number" step="0.01" required
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="BONUS">Bono</option>
                                        <option value="INCENTIVE">Incentivo</option>
                                        <option value="ALLOWANCE">Viático</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Frecuencia</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="ONE_TIME">Único</option>
                                        <option value="RECURRING">Recurrente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white px-4 py-2">Cancelar</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BenefitsManagement;
