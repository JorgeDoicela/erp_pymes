import { useState, useEffect } from 'react';
import shiftService from '../../services/attendance/shiftService';
import * as employeeService from '../../services/employees/employee.service';

const ShiftManagement = () => {
    const [activeTab, setActiveTab] = useState('shifts');
    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [newShift, setNewShift] = useState({ name: '', startTime: '', endTime: '', toleranceMinutes: 15, breakMinutes: 60 });
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [assignmentData, setAssignmentData] = useState({ shiftId: '', startDate: '', endDate: '' });
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        window.scrollTo(0, 0);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const sRes = await shiftService.getShifts();
            if (sRes.success) setShifts(sRes.data);
            const eRes = await employeeService.getEmployees();
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
                setMessage({ text: 'Turno creado exitosamente.', type: 'success' });
                loadData();
                setNewShift({ name: '', startTime: '', endTime: '', toleranceMinutes: 15, breakMinutes: 60 });
            }
        } catch {
            setMessage({ text: 'Error al crear turno.', type: 'error' });
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (selectedEmployees.length === 0) {
            setMessage({ text: 'Seleccione al menos un empleado.', type: 'warning' });
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
                setMessage({ text: `Asignación completada. Exitosos: ${successCount}. Errores: ${errorCount}.`, type: errorCount > 0 ? 'warning' : 'success' });
                setSelectedEmployees([]);
            }
        } catch {
            setMessage({ text: 'Error en asignación masiva.', type: 'error' });
        }
    };

    const toggleEmployee = (id) => {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";
    const labelClass = "block text-xs font-medium text-gray-600 mb-1";

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Asistencia · Turnos</p>
                <h1 className="text-xl font-semibold text-gray-900">Gestión de Turnos y Horarios</h1>
                <p className="text-sm text-gray-500 mt-0.5">Configure los horarios laborales y asigne turnos a los colaboradores.</p>
            </div>

            {/* Tabs ERP */}
            <div className="flex border-b border-gray-200 text-xs">
                <button
                    onClick={() => setActiveTab('shifts')}
                    className={`px-4 py-2.5 font-medium transition-colors border-b-2 -mb-px ${activeTab === 'shifts' ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                >
                    Configurar Turnos
                </button>
                <button
                    onClick={() => setActiveTab('assign')}
                    className={`px-4 py-2.5 font-medium transition-colors border-b-2 -mb-px ${activeTab === 'assign' ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                >
                    Asignación Masiva
                </button>
            </div>

            {message.text && (
                <div className={`p-3 rounded text-xs border ${
                    message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                    'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'shifts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Formulario Nuevo Turno */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Nuevo Turno</h3>
                        </div>
                        <form onSubmit={handleCreateShift} className="p-4 space-y-4">
                            <div>
                                <label className={labelClass}>Nombre del turno (ej. Mañana)</label>
                                <input type="text" className={inputClass} value={newShift.name} onChange={(e) => setNewShift({ ...newShift, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Hora Inicio</label>
                                    <input type="time" className={inputClass} value={newShift.startTime} onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Hora Fin</label>
                                    <input type="time" className={inputClass} value={newShift.endTime} onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Tolerancia (minutos)</label>
                                <input type="number" min="0" className={inputClass} value={newShift.toleranceMinutes} onChange={(e) => setNewShift({ ...newShift, toleranceMinutes: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div>
                                <label className={labelClass}>Tiempo de Almuerzo (minutos)</label>
                                <input type="number" min="0" className={inputClass} value={newShift.breakMinutes} onChange={(e) => setNewShift({ ...newShift, breakMinutes: parseInt(e.target.value) || 0 })} />
                                <p className="text-[11px] text-gray-400 mt-1">Se descontará del total de horas del turno.</p>
                            </div>
                            <button type="submit" className="w-full px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer">
                                Crear Turno
                            </button>
                        </form>
                    </div>

                    {/* Lista de Turnos Existentes */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Turnos Registrados</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {shifts.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-xs">
                                    <p className="font-medium text-gray-700">Sin turnos configurados</p>
                                    <p className="mt-0.5">Crea el primer turno utilizando el formulario.</p>
                                </div>
                            ) : (
                                shifts.map(shift => (
                                    <div key={shift.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50/60 transition-colors text-xs">
                                        <div>
                                            <p className="font-medium text-gray-900">{shift.name}</p>
                                            <p className="text-gray-500 font-mono mt-0.5" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                {shift.startTime} — {shift.endTime}
                                                <span className="text-gray-400 ml-2">({shift.toleranceMinutes}m tol. · {shift.breakMinutes}m break)</span>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'assign' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Lista de Empleados */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Seleccionar Empleados</h3>
                            <span className="text-[11px] text-gray-400 font-mono">{selectedEmployees.length} seleccionados</span>
                        </div>
                        <div className="h-80 overflow-y-auto divide-y divide-gray-100">
                            {employees.map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => toggleEmployee(emp.id)}
                                    className={`px-4 py-2.5 flex justify-between items-center cursor-pointer transition-colors text-xs ${
                                        selectedEmployees.includes(emp.id)
                                            ? 'bg-blue-50 border-l-2 border-blue-500'
                                            : 'hover:bg-gray-50/60'
                                    }`}
                                >
                                    <div>
                                        <p className={`font-medium ${selectedEmployees.includes(emp.id) ? 'text-blue-800' : 'text-gray-900'}`}>
                                            {emp.firstName} {emp.lastName}
                                        </p>
                                        <p className="text-gray-400 text-[11px]">{emp.position}</p>
                                    </div>
                                    {selectedEmployees.includes(emp.id) && (
                                        <span className="text-blue-600 font-bold text-sm">✓</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Formulario de Asignación */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden h-fit">
                        <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Parámetros de Asignación</h3>
                        </div>
                        <form onSubmit={handleAssign} className="p-4 space-y-4">
                            <div>
                                <label className={labelClass}>Turno a Asignar</label>
                                <select className={inputClass} value={assignmentData.shiftId} onChange={(e) => setAssignmentData({ ...assignmentData, shiftId: e.target.value })} required>
                                    <option value="">Seleccione un turno...</option>
                                    {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Fecha de Inicio</label>
                                <input type="date" className={inputClass} value={assignmentData.startDate} onChange={(e) => setAssignmentData({ ...assignmentData, startDate: e.target.value })} required />
                            </div>
                            <div>
                                <label className={labelClass}>Fecha de Fin (Opcional)</label>
                                <input type="date" className={inputClass} value={assignmentData.endDate} onChange={(e) => setAssignmentData({ ...assignmentData, endDate: e.target.value })} />
                                <p className="text-[11px] text-gray-400 mt-1">Dejar vacío para asignación indefinida.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={selectedEmployees.length === 0}
                                className="w-full px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Asignar a {selectedEmployees.length} empleado{selectedEmployees.length !== 1 ? 's' : ''}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftManagement;
