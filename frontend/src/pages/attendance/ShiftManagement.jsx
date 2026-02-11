import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import shiftService from '../../services/attendance/shiftService';
import * as employeeService from '../../services/employees/employee.service'; // Corrected named import
import { motion } from 'framer-motion';

const ShiftManagement = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' | 'assign'
    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);

    // Create Shift Form
    const [newShift, setNewShift] = useState({ name: '', startTime: '', endTime: '', toleranceMinutes: 15, breakMinutes: 60 });

    // Assign Form
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [assignmentData, setAssignmentData] = useState({
        shiftId: '',
        startDate: '',
        endDate: ''
    });

    const [message, setMessage] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const sRes = await shiftService.getShifts();
            if (sRes.success) setShifts(sRes.data);

            // Corrected function name
            const eRes = await employeeService.getEmployees();
            // Adjust based on actual employeeService response structure. Usually it returns { success: true, data: [...] } or just [...]
            // I will assume it returns data directly or check response.
            if (Array.isArray(eRes)) setEmployees(eRes);
            else if (eRes.data) setEmployees(eRes.data);

        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateShift = async (e) => {
        e.preventDefault();
        try {
            const res = await shiftService.createShift(newShift);
            if (res.success) {
                setMessage('Turno creado exitosamente');
                loadData();
                setNewShift({ name: '', startTime: '', endTime: '', toleranceMinutes: 15, breakMinutes: 60 });
            }
        } catch (err) {
            setMessage('Error al crear turno');
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (selectedEmployees.length === 0) {
            setMessage('Seleccione al menos un empleado');
            return;
        }
        try {
            const res = await shiftService.assignShifts({
                employeeIds: selectedEmployees,
                shiftId: assignmentData.shiftId,
                startDate: assignmentData.startDate,
                endDate: assignmentData.endDate || null
            });

            if (res.success) {
                const successCount = res.data.success.length;
                const errorCount = res.data.errors.length;
                setMessage(`Asignación completada. Exitosos: ${successCount}. Errores: ${errorCount}`);
                if (errorCount > 0) {
                    console.log("Errores de asignación:", res.data.errors);
                    alert(`Hubo ${errorCount} errores (posibibles solapamientos). revise consola.`);
                }
                setSelectedEmployees([]);
            }
        } catch (err) {
            setMessage('Error en asignación masiva');
        }
    };

    const toggleEmployee = (id) => {
        if (selectedEmployees.includes(id)) {
            setSelectedEmployees(selectedEmployees.filter(e => e !== id));
        } else {
            setSelectedEmployees([...selectedEmployees, id]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Turnos y Horarios</h2>
                    <p className="text-slate-500 text-sm">Configure los horarios laborales y asigne turnos</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                    Volver
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab('shifts')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-[9px] ${activeTab === 'shifts' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
                >
                    Configurar Turnos
                </button>
                <button
                    onClick={() => setActiveTab('assign')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-[9px] ${activeTab === 'assign' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
                >
                    Asignación Masiva
                </button>
            </div>

            {message && (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-xl mb-6 border border-blue-100 shadow-sm">
                    {message}
                </div>
            )}

            {activeTab === 'shifts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Form Create */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Nuevo Turno</h3>
                        <form onSubmit={handleCreateShift} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Nombre (ej. Mañana)</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={newShift.name}
                                    onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Hora Inicio</label>
                                    <input
                                        type="time"
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={newShift.startTime}
                                        onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Hora Fin</label>
                                    <input
                                        type="time"
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={newShift.endTime}
                                        onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Tolerancia (minutos)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={newShift.toleranceMinutes}
                                    onChange={(e) => setNewShift({ ...newShift, toleranceMinutes: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Tiempo de Almuerzo (minutos)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={newShift.breakMinutes}
                                    onChange={(e) => setNewShift({ ...newShift, breakMinutes: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-xs text-slate-400 mt-1">Se descontará del total de horas del turno</p>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg text-white font-medium shadow-sm transition-all hover:shadow-md">
                                Crear Turno
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">Turnos Existentes</h3>
                        {shifts.map(shift => (
                            <div key={shift.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center hover:border-blue-200 transition-colors">
                                <div>
                                    <p className="font-bold text-lg text-slate-800">{shift.name}</p>
                                    <p className="text-slate-500 text-sm">{shift.startTime} - {shift.endTime} <span className="text-xs text-slate-400">({shift.toleranceMinutes}m tol. | {shift.breakMinutes}m break)</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'assign' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Employee List */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Seleccionar Empleados ({selectedEmployees.length})</h3>
                        <div className="h-96 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {employees.map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => toggleEmployee(emp.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center group
                                    ${selectedEmployees.includes(emp.id)
                                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}
                                `}
                                >
                                    <div>
                                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                                        <p className="text-xs text-slate-500 group-hover:text-slate-600">{emp.position}</p>
                                    </div>
                                    {selectedEmployees.includes(emp.id) && <span className="text-blue-600 font-bold">✓</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assign Form */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Parámetros</h3>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Turno</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={assignmentData.shiftId}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, shiftId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Fecha Inicio</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={assignmentData.startDate}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, startDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Fecha Fin (Opcional)</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={assignmentData.endDate}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, endDate: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">Dejar vacío para indefinido</p>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg text-white font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={selectedEmployees.length === 0}
                            >
                                Asignar a Selección
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftManagement;
