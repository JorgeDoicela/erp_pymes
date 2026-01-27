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
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Gestión de Turnos y Horarios
                </h1>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                    ← Volver
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-700 pb-2">
                <button
                    onClick={() => setActiveTab('shifts')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'shifts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Configurar Turnos
                </button>
                <button
                    onClick={() => setActiveTab('assign')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'assign' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Asignación Masiva
                </button>
            </div>

            {message && (
                <div className="bg-blue-500/10 text-blue-300 p-4 rounded-lg mb-6 border border-blue-500/20">
                    {message}
                </div>
            )}

            {activeTab === 'shifts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Form Create */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-white/5">
                        <h3 className="text-xl font-bold mb-4">Nuevo Turno</h3>
                        <form onSubmit={handleCreateShift} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nombre (ej. Mañana)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    value={newShift.name}
                                    onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Hora Inicio</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                        value={newShift.startTime}
                                        onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Hora Fin</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                        value={newShift.endTime}
                                        onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tolerancia (minutos)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    value={newShift.toleranceMinutes}
                                    onChange={(e) => setNewShift({ ...newShift, toleranceMinutes: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tiempo de Almuerzo (minutos)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    value={newShift.breakMinutes}
                                    onChange={(e) => setNewShift({ ...newShift, breakMinutes: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-xs text-slate-500 mt-1">Se descontará del total de horas del turno</p>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded text-white font-medium">
                                Crear Turno
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">Turnos Existentes</h3>
                        {shifts.map(shift => (
                            <div key={shift.id} className="bg-slate-800 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg">{shift.name}</p>
                                    <p className="text-gray-400 text-sm">{shift.startTime} - {shift.endTime} <span className="text-xs text-slate-500">({shift.toleranceMinutes}m tol. | {shift.breakMinutes}m break)</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'assign' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Employee List */}
                    <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-white/5">
                        <h3 className="text-xl font-bold mb-4">Seleccionar Empleados ({selectedEmployees.length})</h3>
                        <div className="h-96 overflow-y-auto pr-2 space-y-2">
                            {employees.map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => toggleEmployee(emp.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center
                                    ${selectedEmployees.includes(emp.id)
                                            ? 'bg-blue-500/20 border-blue-500 text-white'
                                            : 'bg-slate-900/50 border-slate-700 text-gray-400 hover:bg-slate-700'}
                                `}
                                >
                                    <div>
                                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                                        <p className="text-xs">{emp.position}</p>
                                    </div>
                                    {selectedEmployees.includes(emp.id) && <span className="text-blue-400">✓</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assign Form */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-white/5 h-fit">
                        <h3 className="text-xl font-bold mb-4">Parámetros</h3>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Turno</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    value={assignmentData.shiftId}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, shiftId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Fecha Inicio</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    value={assignmentData.startDate}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, startDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Fecha Fin (Opcional)</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    value={assignmentData.endDate}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, endDate: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Dejar vacío para indefinido</p>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-3 rounded-lg text-white font-bold shadow-lg transition-all"
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
