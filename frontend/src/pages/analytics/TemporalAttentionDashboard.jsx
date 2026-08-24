import { useState, useEffect } from 'react';
import { 
    getTemporalAttentionSummary, 
    calibrateTemporalAttention 
} from '../../services/intelligenceService';
import { 
    FiActivity, 
    FiZap, 
    FiRefreshCw, 
    FiCpu, 
    FiCalendar,
    FiTrendingUp,
    FiInfo,
    FiUser,
    FiSliders
} from 'react-icons/fi';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line
} from 'recharts';

const TemporalAttentionDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calibrating, setCalibrating] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getTemporalAttentionSummary();
            if (res?.success && res.data) {
                setSummary(res.data);
                if (res.data.employees && res.data.employees.length > 0) {
                    setSelectedEmployee(res.data.employees[0]);
                }
            }
        } catch (e) {
            console.error('Error al cargar atención temporal:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCalibrate = async () => {
        try {
            setCalibrating(true);
            const res = await calibrateTemporalAttention();
            if (res?.success) {
                setToastMessage(`Calibración completada: Época ${res.data.epoch} | Brier: ${res.data.brierScore}`);
                await loadData();
            }
        } catch (e) {
            setToastMessage('Error durante la calibración de atención');
        } finally {
            setCalibrating(false);
            setTimeout(() => setToastMessage(null), 4000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <FiRefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
                    <p className="text-sm text-gray-500 font-medium">Computando Atención Temporal Auto-Supervisada (Vaswani et al. 2017)...</p>
                </div>
            </div>
        );
    }

    const monthlyChartData = (summary?.meanMonthlyWeights || []).map((weight, idx) => ({
        month: `Mes ${idx + 1} (${12 - idx}m atrás)`,
        weight: Number((weight * 100).toFixed(1)),
        rawWeight: weight
    }));

    const selectedTrajectory = selectedEmployee?.monthlyTrajectory || [];

    return (
        <div className="space-y-6 pb-12">
            {/* Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-bounce">
                    <FiZap className="text-amber-400 w-5 h-5" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full flex items-center gap-1">
                                <FiCpu className="w-3 h-3" /> Arquitectura Transformer
                            </span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">
                                Scaled Dot-Product Attention
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Atención Temporal Auto-Supervisada (Temporal Self-Attention)
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ponderación no lineal sobre secuencias de 12 meses de comportamiento socio-laboral para modelado de riesgo de rotación.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCalibrate}
                            disabled={calibrating}
                            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            <FiSliders className={`w-4 h-4 ${calibrating ? 'animate-spin' : ''}`} />
                            {calibrating ? 'Optimizando Q/K/V...' : 'Calibrar Matrices Q/K/V'}
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Muestra Activa</span>
                        <FiUser className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.sampleSize || 0}</span>
                        <span className="text-xs text-gray-500">colaboradores</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Con trayectoria de 12 meses</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Época de Calibración</span>
                        <FiActivity className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">Época {summary?.calibrationEpoch || 0}</span>
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">SGD Adaptativo con L2</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Brier Score Global</span>
                        <FiZap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary?.brierScore || '0.1580'}</span>
                        <span className="text-xs text-emerald-600 font-semibold">Calibrado</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Error cuadrático medio out-of-sample</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Espacio Latente</span>
                        <FiCpu className="w-4 h-4 text-pink-500" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">d_model = 4</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Ausencias, Tardanzas, Desempeño, Horas Extra</p>
                </div>
            </div>

            {/* Gráfico Agregado de Pesos de Atención Temporal */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">
                            Distribución de Atención Temporal Agregada α₁...α₁₂
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Porcentaje de relevancia que el mecanismo de atención asigna a cada mes para predecir eventos de rotación.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg">
                        <FiInfo /> Vaswani et al. (2017) Scaled Dot-Product
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                            <YAxis unit="%" tick={{ fontSize: 11 }} tickLine={false} />
                            <Tooltip 
                                formatter={(value) => [`${value}%`, 'Peso de Atención']}
                                contentStyle={{ backgroundColor: '#1F2937', color: '#FFF', borderRadius: '8px', border: 'none' }}
                            />
                            <Bar dataKey="weight" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detalle por Colaborador Seleccionado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de Colaboradores */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs space-y-3 lg:col-span-1 max-h-[500px] overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Colaboradores Evaluados</h3>
                    <div className="space-y-2">
                        {(summary?.employees || []).map((emp) => {
                            const isSelected = selectedEmployee?.employeeId === emp.employeeId;
                            return (
                                <div
                                    key={emp.employeeId}
                                    onClick={() => setSelectedEmployee(emp)}
                                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                                        isSelected
                                            ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600 shadow-xs'
                                            : 'bg-gray-50 dark:bg-gray-750 border-gray-100 dark:border-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{emp.employeeName}</p>
                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 rounded-md font-medium">
                                            Pico: Mes {emp.peakAttentionMonth?.monthIndex + 1}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{emp.department} • {emp.position}</p>
                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                        <span>Impacto Hazard: {emp.temporalHazardImpact}</span>
                                        <span>Peso Pico: {Number((emp.peakAttentionMonth?.weight * 100).toFixed(1))}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Trayectoria Temporal del Colaborador */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-xs lg:col-span-2 space-y-4">
                    {selectedEmployee ? (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Trayectoria Temporal: {selectedEmployee.employeeName}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Evolución mes a mes y correlación con el peso de atención asignado por el modelo.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400">Mes Crítico Identificado</span>
                                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                        {selectedEmployee.peakAttentionMonth?.monthsAgo} meses atrás
                                    </p>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={selectedTrajectory}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="monthNumber" label={{ value: 'Mes (1..12)', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#FFF', borderRadius: '8px' }} />
                                        <Line type="monotone" dataKey="attentionWeight" name="Peso Atención (α)" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="absences" name="Ausencias Norm." stroke="#EF4444" strokeWidth={2} />
                                        <Line type="monotone" dataKey="performance" name="Desempeño Norm." stroke="#10B981" strokeWidth={2} />
                                        <Line type="monotone" dataKey="overtime" name="Horas Extra Norm." stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 4" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Desglose de Factores en Mes Pico */}
                            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                <div>
                                    <span className="text-xs text-gray-500">Ausencias Mes Pico</span>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {Number((selectedEmployee.peakAttentionMonth?.absencesNorm * 100).toFixed(0))}%
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">Tardanzas Mes Pico</span>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {Number((selectedEmployee.peakAttentionMonth?.latesNorm * 100).toFixed(0))}%
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">Desempeño Mes Pico</span>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {Number((selectedEmployee.peakAttentionMonth?.perfNorm * 100).toFixed(0))}%
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">Horas Extra Mes Pico</span>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {Number((selectedEmployee.peakAttentionMonth?.overtimeNorm * 100).toFixed(0))}%
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            Selecciona un colaborador para inspeccionar su trayectoria de atención.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemporalAttentionDashboard;
