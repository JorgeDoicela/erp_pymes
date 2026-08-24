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
import useAutoSync from '../../hooks/useAutoSync.js';
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

    const loadData = async (isSilent = false) => {
        if (!isSilent && !offboardings.length) setLoading(true);
        try {
            const [resOff, resEmp] = await Promise.all([
                getOffboardings(),
                getEmployees()
            ]);
            if (resOff.success) setOffboardings(resOff.data);
            if (resEmp.success) setEmployees(resEmp.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const { lastSynced, isSyncing, triggerSync } = useAutoSync(
        () => loadData(true),
        { intervalMs: 30000 }
    );

    useEffect(() => {
        loadData();
    }, []);

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
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Recursos Humanos · Desvinculación</p>
                    <h1 className="text-xl font-semibold text-gray-900">Offboarding y Finiquito Legal</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Gestión de listas de salida, devolución de activos y liquidaciones de ley.
                    </p>
                </div>
            </div>

            {/* Navegación por Pestañas ERP */}
            <div className="flex border-b border-gray-200 overflow-x-auto gap-6 text-xs">
                <button
                    onClick={() => setActiveTab('OFFBOARDINGS')}
                    className={`pb-2.5 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        activeTab === 'OFFBOARDINGS'
                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    Procesos de Salida Activos
                </button>
                <button
                    onClick={() => setActiveTab('SIMULATOR')}
                    className={`pb-2.5 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        activeTab === 'SIMULATOR'
                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    Simulador de Liquidación
                </button>
            </div>

            {/* TAB 1: PROCESOS DE SALIDA */}
            {activeTab === 'OFFBOARDINGS' && (
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Registro de Salidas y Finiquitos</h3>
                    </div>

                    {/* VISTA MÓVIL: Tarjetas Apiladas (Responsive UX) */}
                    <div className="block md:hidden divide-y divide-gray-100 bg-white rounded border border-gray-200">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-xs font-mono">Cargando procesos de salida...</div>
                        ) : offboardings.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-xs italic">
                                No hay procesos de salida registrados.
                            </div>
                        ) : (
                            offboardings.map(off => {
                                const checklist = JSON.parse(off.checklist || '[]');
                                const completedTasks = checklist.filter(t => t.completed).length;
                                const totalTasks = checklist.length;
                                const isComplete = totalTasks > 0 && completedTasks === totalTasks;

                                return (
                                    <div key={off.id} className="p-4 space-y-2 bg-white">
                                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-xs">{off.employee?.firstName} {off.employee?.lastName}</h4>
                                                <p className="text-[11px] text-gray-400 mt-0.5">{off.employee?.department || 'General'}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                                                off.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {off.status === 'COMPLETED' ? 'COMPLETADO' : 'EN PROCESO'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase block">Causal de Salida</span>
                                                <span className="font-medium text-gray-800">{getCausalLabel(off.causal)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase block">Fecha Salida</span>
                                                <span className="text-gray-700 font-mono">{new Date(off.exitDate).toLocaleDateString('es-EC')}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase block">Total Liquidación</span>
                                                <span className="font-mono font-semibold text-gray-900 tabular-nums">${off.totalSettlement.toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase block">Checklist</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                                    isComplete ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {completedTasks}/{totalTasks} Tareas
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                                            <button
                                                onClick={() => {
                                                    setSelectedOffboarding(off);
                                                    setChecklistModalOpen(true);
                                                }}
                                                className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium transition-colors"
                                            >
                                                Gestionar Checklist
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const sim = await simulateSettlement({
                                                        employeeId: off.employeeId,
                                                        exitDate: off.exitDate,
                                                        causal: off.causal
                                                    });
                                                    if (sim?.success) generateSettlementPDF(sim.data);
                                                }}
                                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                            >
                                                PDF Finiquito
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* VISTA ESCRITORIO: Tabla Completa */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Empleado</th>
                                    <th className="py-2.5 px-4">Causal de Salida</th>
                                    <th className="py-2.5 px-4">Fecha Salida</th>
                                    <th className="py-2.5 px-4 text-right">Total Liquidación</th>
                                    <th className="py-2.5 px-4 text-center">Checklist</th>
                                    <th className="py-2.5 px-4 text-center">Estado</th>
                                    <th className="py-2.5 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {loading ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-gray-400 text-xs font-mono">Cargando procesos de salida...</td></tr>
                                ) : offboardings.length === 0 ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-gray-400 text-xs italic">No hay procesos de salida registrados.</td></tr>
                                ) : (
                                    offboardings.map(off => {
                                        const checklist = JSON.parse(off.checklist || '[]');
                                        const completedTasks = checklist.filter(t => t.completed).length;
                                        const totalTasks = checklist.length;
                                        const isComplete = totalTasks > 0 && completedTasks === totalTasks;

                                        return (
                                            <tr key={off.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-2.5 px-4 font-medium text-gray-900">
                                                    {off.employee?.firstName} {off.employee?.lastName}
                                                    <p className="text-[11px] font-normal text-gray-400">{off.employee?.department || 'General'}</p>
                                                </td>
                                                <td className="py-2.5 px-4 text-gray-700">
                                                    {getCausalLabel(off.causal)}
                                                </td>
                                                <td className="py-2.5 px-4 font-mono text-gray-600">
                                                    {new Date(off.exitDate).toLocaleDateString('es-EC')}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                                                    ${off.totalSettlement.toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                                        isComplete ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}>
                                                        {completedTasks} / {totalTasks}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                                                        off.status === 'COMPLETED'
                                                            ? 'bg-green-50 text-green-800 border-green-200'
                                                            : 'bg-amber-50 text-amber-800 border-amber-200'
                                                    }`}>
                                                        {off.status === 'COMPLETED' ? 'COMPLETADO' : 'EN PROCESO'}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOffboarding(off);
                                                                setChecklistModalOpen(true);
                                                            }}
                                                            className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                        >
                                                            Checklist
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
                                                            className="border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Controls Form */}
                    <div className="bg-white p-5 rounded border border-gray-200 space-y-4">
                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2.5 flex items-center gap-2">
                            <CalculatorIcon className="w-4 h-4 text-blue-600" />
                            Parámetros de Liquidación
                        </h3>

                        <form onSubmit={handleSimulate} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Empleado</label>
                                <select
                                    required
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500"
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
                                <label className="block font-medium text-gray-700 mb-1">Fecha Estimada de Salida</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
                                    value={simForm.exitDate}
                                    onChange={(e) => setSimForm({ ...simForm, exitDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Causal Legal de Salida</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500"
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
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                                <CalculatorIcon className="w-4 h-4" />
                                {simLoading ? 'Calculando...' : 'Calcular Liquidación de Ley'}
                            </button>
                        </form>
                    </div>

                    {/* Results Simulation Display */}
                    <div className="lg:col-span-2 space-y-4">
                        {simResult ? (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-5 rounded border border-gray-200 space-y-4 text-xs"
                            >
                                <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900">
                                            {simResult.employee.firstName} {simResult.employee.lastName}
                                        </h4>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            {simResult.employee.position} · C.I. {simResult.employee.identityCard} · Sueldo Base: <span className="font-mono">${simResult.baseSalary.toFixed(2)}</span>
                                        </p>
                                    </div>
                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-mono font-medium rounded border border-blue-200">
                                        {simResult.yearsWorked} Años de Servicio ({simResult.daysWorkedTotal} Días)
                                    </span>
                                </div>

                                {/* Calculation breakdown cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-600">13er Sueldo Proporcional:</span>
                                        <span className="font-mono font-semibold text-gray-900 tabular-nums">${simResult.thirteenthProportional.toFixed(2)}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-600">14to Sueldo Proporcional (SBU):</span>
                                        <span className="font-mono font-semibold text-gray-900 tabular-nums">${simResult.fourteenthProportional.toFixed(2)}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-600">Vacaciones No Gozadas ({simResult.pendingVacationDays} d):</span>
                                        <span className="font-mono font-semibold text-gray-900 tabular-nums">${simResult.vacationAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-600">Desahucio (25% por año):</span>
                                        <span className="font-mono font-semibold text-gray-900 tabular-nums">${simResult.desahucioAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="p-3 bg-red-50/60 rounded border border-red-200 flex justify-between items-center sm:col-span-2">
                                        <span className="font-medium text-red-900">Indemnización Despido Intempestivo (Art. 188):</span>
                                        <span className="font-mono font-bold text-red-700 text-sm tabular-nums">${simResult.severanceAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Total Liquidación Banner */}
                                <div className="bg-gray-900 text-white p-4 rounded flex flex-col sm:flex-row justify-between items-center gap-3">
                                    <div>
                                        <p className="text-[11px] text-gray-400 uppercase tracking-wider">Total Acta de Finiquito Estimada</p>
                                        <h3 className="text-2xl font-mono font-semibold mt-0.5 tabular-nums">${simResult.totalSettlement.toFixed(2)}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => generateSettlementPDF(simResult)}
                                            className="px-3 py-1.5 bg-white text-gray-900 rounded text-xs font-medium hover:bg-gray-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <DocumentTextIcon className="w-4 h-4" /> Exportar PDF
                                        </button>
                                        <button
                                            onClick={handleStartOffboarding}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors cursor-pointer shadow-xs"
                                        >
                                            Iniciar Proceso Oficial
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-white p-10 rounded border border-gray-200 text-center text-gray-400 space-y-2">
                                <CalculatorIcon className="w-8 h-8 mx-auto text-gray-300" />
                                <p className="font-semibold text-gray-700 text-sm">Simulador de Acta de Finiquito y Liquidación</p>
                                <p className="text-xs max-w-md mx-auto text-gray-500">
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
                    <div className="app-modal-overlay">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Checklist de Salida (Offboarding)</h3>
                                    <p className="text-[11px] text-gray-500 mt-0.5">{selectedOffboarding.employee?.firstName} {selectedOffboarding.employee?.lastName}</p>
                                </div>
                                <button onClick={() => setChecklistModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">&times;</button>
                            </div>

                            <div className="p-5 space-y-2.5 max-h-[400px] overflow-y-auto text-xs">
                                {JSON.parse(selectedOffboarding.checklist || '[]').map((task) => (
                                    <div 
                                        key={task.id} 
                                        onClick={() => handleToggleTask(task.id, task.completed)}
                                        className={`p-3 rounded border transition-colors cursor-pointer flex items-center justify-between ${
                                            task.completed 
                                                ? 'bg-green-50/50 border-green-200 text-green-900'
                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => {}} // Handled by div onClick
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className="font-medium">{task.label}</span>
                                        </div>
                                        <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                                            task.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {task.completed ? 'COMPLETADO' : 'PENDIENTE'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={() => setChecklistModalOpen(false)}
                                    className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors"
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
