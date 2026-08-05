import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    simulateSettlement, 
    startOffboarding, 
    updateChecklistStep, 
    getOffboardings 
} from '../../services/employees/onboardingOffboarding.service';
import { getEmployees } from '../../services/employees/employee.service';
import { generateSettlementPDF } from '../../utils/generateSettlementPDF';
import { 
    UserMinusIcon, 
    CalculatorIcon, 
    CheckCircleIcon, 
    DocumentTextIcon,
    ArrowPathIcon,
    ExclamationCircleIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

const OffboardingManagement = () => {
    const [offboardings, setOffboardings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('OFFBOARDINGS'); // OFFBOARDINGS | SIMULATOR

    // Simulator State
    const [simForm, setSimForm] = useState({
        employeeId: '',
        exitDate: new Date().toISOString().split('T')[0],
        causal: 'VOLUNTARY_RESIGNATION'
    });
    const [simResult, setSimResult] = useState(null);
    const [simLoading, setSimLoading] = useState(false);

    // Checklist Modal
    const [selectedOffboarding, setSelectedOffboarding] = useState(null);
    const [checklistModalOpen, setChecklistModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resOff, resEmp] = await Promise.all([
                getOffboardings(),
                getEmployees()
            ]);
            if (resOff.success) setOffboardings(resOff.data);
            if (resEmp) setEmployees(Array.isArray(resEmp) ? resEmp : resEmp.data || []);
        } catch (error) {
            console.error('Error al cargar datos de Offboarding:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSimulate = async (e) => {
        e.preventDefault();
        if (!simForm.employeeId) {
            alert('Selecciona un empleado para simular la liquidación');
            return;
        }
        setSimLoading(true);
        try {
            const res = await simulateSettlement(simForm);
            if (res.success) {
                setSimResult(res.data);
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setSimLoading(false);
        }
    };

    const handleStartOffboarding = async () => {
        if (!simResult) return;
        if (!window.confirm(`¿Confirmas iniciar el proceso oficial de desvinculación para ${simResult.employee.firstName} ${simResult.employee.lastName}?`)) return;

        try {
            const res = await startOffboarding({
                employeeId: simResult.employee.id,
                exitDate: simForm.exitDate,
                causal: simForm.causal,
                notes: 'Proceso de salida iniciado desde simulador de liquidación'
            });
            if (res.success) {
                alert('Proceso de Offboarding iniciado. Se generó el checklist automático de salida.');
                loadData();
                setActiveTab('OFFBOARDINGS');
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const handleToggleTask = async (taskId, currentCompleted) => {
        if (!selectedOffboarding) return;
        try {
            const res = await updateChecklistStep(selectedOffboarding.id, taskId, !currentCompleted);
            if (res.success) {
                setSelectedOffboarding(res.data);
                loadData();
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const getCausalLabel = (causal) => {
        switch (causal) {
            case 'VOLUNTARY_RESIGNATION': return 'Renuncia Voluntaria';
            case 'UNFAIR_DISMISSAL': return 'Despido Intempestivo (Art. 188)';
            case 'CONTRACT_END': return 'Fin de Contrato';
            case 'JUST_CAUSE': return 'Visto Bueno / Causa Justa';
            default: return causal;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <UserMinusIcon className="w-8 h-8 text-rose-600" />
                        Offboarding y Simulador de Finiquito Legal
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestión de listas de salida, devolución de activos y liquidaciones legales de ley
                    </p>
                </div>

                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('OFFBOARDINGS')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'OFFBOARDINGS'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Procesos de Salida Activos
                    </button>
                    <button
                        onClick={() => setActiveTab('SIMULATOR')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === 'SIMULATOR'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <CalculatorIcon className="w-4 h-4" />
                        Simulador de Liquidación
                    </button>
                </div>
            </div>

            {/* TAB 1: PROCESOS DE SALIDA */}
            {activeTab === 'OFFBOARDINGS' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-base">Registro de Salidas y Finiquitos</h3>
                        <button onClick={loadData} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowPathIcon className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-200/80">
                                <tr>
                                    <th className="p-4">Empleado</th>
                                    <th className="p-4 text-center">Causal de Salida</th>
                                    <th className="p-4 text-center">Fecha Salida</th>
                                    <th className="p-4 text-right">Total Liquidación</th>
                                    <th className="p-4 text-center">Checklist</th>
                                    <th className="p-4 text-center">Estado</th>
                                    <th className="p-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Cargando procesos de salida...</td></tr>
                                ) : offboardings.length === 0 ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">No hay procesos de salida registrados.</td></tr>
                                ) : (
                                    offboardings.map(off => {
                                        const checklist = JSON.parse(off.checklist || '[]');
                                        const completedTasks = checklist.filter(t => t.completed).length;
                                        const totalTasks = checklist.length;
                                        const isComplete = totalTasks > 0 && completedTasks === totalTasks;

                                        return (
                                            <tr key={off.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-4 font-bold text-slate-900">
                                                    {off.employee?.firstName} {off.employee?.lastName}
                                                    <p className="text-xs font-normal text-slate-400">{off.employee?.department || 'General'}</p>
                                                </td>
                                                <td className="p-4 text-center text-xs font-semibold text-slate-700">
                                                    {getCausalLabel(off.causal)}
                                                </td>
                                                <td className="p-4 text-center text-xs text-slate-500">
                                                    {new Date(off.exitDate).toLocaleDateString('es-EC')}
                                                </td>
                                                <td className="p-4 text-right font-mono font-bold text-emerald-700 text-base">
                                                    ${off.totalSettlement.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                                                        isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {completedTasks} / {totalTasks} Tareas
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                        off.status === 'COMPLETED'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {off.status === 'COMPLETED' ? 'COMPLETADO' : 'EN PROCESO'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOffboarding(off);
                                                                setChecklistModalOpen(true);
                                                            }}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                        >
                                                            <ClipboardDocumentCheckIcon className="w-4 h-4" /> Checklist
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const sim = await simulateSettlement({
                                                                    employeeId: off.employeeId,
                                                                    exitDate: off.exitDate,
                                                                    causal: off.causal
                                                                });
                                                                if (sim.success) generateSettlementPDF(sim.data);
                                                            }}
                                                            className="px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all"
                                                        >
                                                            PDF Finiquito
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: SIMULADOR DE LIQUIDACIÓN LEGAL */}
            {activeTab === 'SIMULATOR' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Controls Form */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                            <CalculatorIcon className="w-5 h-5 text-blue-600" />
                            Parámetros de Liquidación
                        </h3>

                        <form onSubmit={handleSimulate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Seleccionar Empleado</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={simForm.employeeId}
                                    onChange={(e) => setSimForm({ ...simForm, employeeId: e.target.value })}
                                >
                                    <option value="">-- Selecciona un Empleado --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} ({emp.department || 'General'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Fecha Estimada de Salida</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
                                    value={simForm.exitDate}
                                    onChange={(e) => setSimForm({ ...simForm, exitDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Causal Legal de Salida</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={simForm.causal}
                                    onChange={(e) => setSimForm({ ...simForm, causal: e.target.value })}
                                >
                                    <option value="VOLUNTARY_RESIGNATION">Renuncia Voluntaria (Desahucio 25%)</option>
                                    <option value="UNFAIR_DISMISSAL">Despido Intempestivo (Art. 188 + Desahucio)</option>
                                    <option value="CONTRACT_END">Terminación por Plazo de Contrato</option>
                                    <option value="JUST_CAUSE">Visto Bueno / Causa Justa</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={simLoading || !simForm.employeeId}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CalculatorIcon className="w-4 h-4" />
                                {simLoading ? 'Calculando Haberes...' : 'Calcular Liquidación de Ley'}
                            </button>
                        </form>
                    </div>

                    {/* Results Simulation Display */}
                    <div className="lg:col-span-2 space-y-6">
                        {simResult ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6"
                            >
                                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-800">
                                            {simResult.employee.firstName} {simResult.employee.lastName}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {simResult.employee.position} • C.I. {simResult.employee.identityCard} • Sueldo Base: ${simResult.baseSalary.toFixed(2)}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                                        {simResult.yearsWorked} Años de Servicio ({simResult.daysWorkedTotal} Días)
                                    </span>
                                </div>

                                {/* Calculation breakdown cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center">
                                        <span className="font-semibold text-slate-700">13er Sueldo Proporcional:</span>
                                        <span className="font-mono font-bold text-slate-900 text-sm">${simResult.thirteenthProportional.toFixed(2)}</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center">
                                        <span className="font-semibold text-slate-700">14to Sueldo Proporcional (SBU):</span>
                                        <span className="font-mono font-bold text-slate-900 text-sm">${simResult.fourteenthProportional.toFixed(2)}</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center">
                                        <span className="font-semibold text-slate-700">Vacaciones No Gozadas ({simResult.pendingVacationDays} días):</span>
                                        <span className="font-mono font-bold text-slate-900 text-sm">${simResult.vacationAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center">
                                        <span className="font-semibold text-slate-700">Desahucio (25% por año):</span>
                                        <span className="font-mono font-bold text-slate-900 text-sm">${simResult.desahucioAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200/60 flex justify-between items-center md:col-span-2">
                                        <span className="font-bold text-rose-800">Indemnización por Despido Intempestivo (Art. 188):</span>
                                        <span className="font-mono font-extrabold text-rose-700 text-base">${simResult.severanceAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Total Liquidación Banner */}
                                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl flex justify-between items-center shadow-md">
                                    <div>
                                        <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Total Acta de Finiquito Estimada</p>
                                        <h3 className="text-3xl font-black mt-1">${simResult.totalSettlement.toFixed(2)}</h3>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => generateSettlementPDF(simResult)}
                                            className="px-4 py-2.5 bg-white text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            <DocumentTextIcon className="w-4 h-4" /> Exportar PDF
                                        </button>
                                        <button
                                            onClick={handleStartOffboarding}
                                            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-sm"
                                        >
                                            Iniciar Offboarding Oficial
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center text-slate-400 space-y-3">
                                <CalculatorIcon className="w-12 h-12 mx-auto text-slate-300" />
                                <p className="font-bold text-slate-600 text-base">Simulador de Acta de Finiquito y Liquidación</p>
                                <p className="text-xs max-w-md mx-auto">
                                    Selecciona un empleado y la causal de salida para proyectar el cálculo exacto de haberes de ley (Décimos, Vacaciones, Desahucio e Indemnizaciones).
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Checklist Offboarding Modal */}
            <AnimatePresence>
                {checklistModalOpen && selectedOffboarding && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Checklist de Salida (Offboarding)</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{selectedOffboarding.employee?.firstName} {selectedOffboarding.employee?.lastName}</p>
                                </div>
                                <button onClick={() => setChecklistModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                                {JSON.parse(selectedOffboarding.checklist || '[]').map((task) => (
                                    <div 
                                        key={task.id} 
                                        onClick={() => handleToggleTask(task.id, task.completed)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                            task.completed 
                                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => {}} // Handled by div onClick
                                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold">{task.label}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            task.completed ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {task.completed ? 'COMPLETADO' : 'PENDIENTE'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                                <button
                                    onClick={() => setChecklistModalOpen(false)}
                                    className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OffboardingManagement;
