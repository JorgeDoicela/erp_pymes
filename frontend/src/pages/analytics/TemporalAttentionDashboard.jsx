import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    getTemporalAttentionSummary, 
    calibrateTemporalAttention 
} from '../../services/intelligenceService';
import { 
    FiRefreshCw, 
    FiSliders,
    FiArrowLeft
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
                setToastMessage(`Calibración completada: Época ${res.data.epoch} | Brier Score: ${res.data.brierScore}`);
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
            <div className="p-12 text-center text-gray-400 text-xs font-mono">
                Computando Atención Temporal Auto-Supervisada (Scaled Dot-Product Attention)...
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
        <div className="space-y-6">
            {/* Toast Notificación */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded shadow-xl text-xs font-mono flex items-center gap-2 border border-gray-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            to="/analytics"
                            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium transition-colors"
                        >
                            <FiArrowLeft className="w-3 h-3" />
                            <span>Analíticas</span>
                        </Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider font-mono">
                            Deep Learning Secuencial
                        </span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Atención Temporal Auto-Supervisada (Temporal Self-Attention)
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Ponderación no lineal sobre secuencias de 12 meses de comportamiento socio-laboral para modelado de riesgo de rotación.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <Link
                        to="/analytics"
                        className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a Analíticas</span>
                    </Link>
                    <button
                        onClick={handleCalibrate}
                        disabled={calibrating}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <FiSliders className={`w-3.5 h-3.5 ${calibrating ? 'animate-spin' : ''}`} />
                        <span>{calibrating ? 'Optimizando Q/K/V...' : 'Calibrar Matrices Q/K/V'}</span>
                    </button>
                </div>
            </div>

            {/* Fila de Métricas Clave ERP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded border border-gray-200 space-y-1">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                        Muestra Activa
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-semibold font-mono text-gray-900 tabular-nums">
                            {summary?.sampleSize || 0}
                        </span>
                        <span className="text-xs text-gray-500">colaboradores</span>
                    </div>
                    <p className="text-[11px] text-gray-400">Con trayectoria de 12 meses</p>
                </div>

                <div className="bg-white p-4.5 rounded border border-gray-200 space-y-1">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                        Época de Calibración
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-semibold font-mono text-gray-900 tabular-nums">
                            Época {summary?.calibrationEpoch || 0}
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-500">SGD Adaptativo con L2</p>
                </div>

                <div className="bg-white p-4.5 rounded border border-gray-200 space-y-1">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                        Brier Score Global
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-semibold font-mono text-emerald-700 tabular-nums">
                            {summary?.brierScore || '0.1580'}
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-400">Error cuadrático medio out-of-sample</p>
                </div>

                <div className="bg-white p-4.5 rounded border border-gray-200 space-y-1">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                        Espacio Latente
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-semibold font-mono text-gray-900 tabular-nums">
                            d_model = 4
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-400">Ausencias, Tardanzas, Desempeño, H. Extra</p>
                </div>
            </div>

            {/* Gráfico Agregado de Pesos de Atención Temporal */}
            <div className="bg-white p-4.5 rounded border border-gray-200 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                            Distribución de Atención Temporal Agregada α₁...α₁₂
                        </h3>
                        <p className="text-[11px] text-gray-400">
                            Porcentaje de relevancia que el mecanismo asigna a cada mes para predecir eventos de rotación.
                        </p>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">
                        Vaswani et al. (2017) Scaled Dot-Product
                    </span>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="month" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" />
                            <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#111827', fontSize: '11px' }}
                                formatter={(value) => [`${value}%`, 'Peso de Atención']}
                            />
                            <Bar dataKey="weight" fill="#2563eb" radius={[2, 2, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detalle por Colaborador Seleccionado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Directorio de Colaboradores Evaluados */}
                <div className="bg-white rounded border border-gray-200 overflow-hidden lg:col-span-1 flex flex-col h-[520px]">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                            Colaboradores Evaluados
                        </h3>
                        <span className="text-[10px] font-mono text-gray-500 tabular-nums">
                            {summary?.employees?.length || 0} Registros
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                        {(summary?.employees || []).map((emp) => {
                            const isSelected = selectedEmployee?.employeeId === emp.employeeId;
                            return (
                                <button
                                    key={emp.employeeId}
                                    type="button"
                                    onClick={() => setSelectedEmployee(emp)}
                                    className={`w-full p-3.5 text-left transition-colors cursor-pointer flex flex-col gap-1 ${
                                        isSelected
                                            ? 'bg-blue-50/40 border-l-2 border-blue-600'
                                            : 'hover:bg-gray-50/70'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-gray-900">{emp.employeeName}</p>
                                        <span className="text-[10px] font-mono text-gray-600 font-medium tabular-nums">
                                            Pico: Mes {emp.peakAttentionMonth?.monthIndex + 1}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500">{emp.department} · {emp.position}</p>
                                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mt-1">
                                        <span>Hazard: {emp.temporalHazardImpact}</span>
                                        <span className="tabular-nums">Peso: {Number((emp.peakAttentionMonth?.weight * 100).toFixed(1))}%</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Trayectoria Temporal del Colaborador */}
                <div className="bg-white p-4.5 rounded border border-gray-200 lg:col-span-2 space-y-4 flex flex-col justify-between">
                    {selectedEmployee ? (
                        <>
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                            Trayectoria: {selectedEmployee.employeeName}
                                        </h3>
                                        <p className="text-[11px] text-gray-500">
                                            Evolución mensual y correlación con el peso de atención asignado por el modelo.
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <span className="text-[10px] font-mono text-gray-400 uppercase">Mes Crítico</span>
                                        <p className="text-xs font-semibold font-mono text-blue-700">
                                            {selectedEmployee.peakAttentionMonth?.monthsAgo} meses atrás
                                        </p>
                                    </div>
                                </div>

                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={selectedTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                            <XAxis dataKey="monthNumber" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Mes (1..12)', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#9ca3af' }} />
                                            <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#111827', fontSize: '11px' }} />
                                            <Line type="monotone" dataKey="attentionWeight" name="Peso Atención (α)" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                                            <Line type="monotone" dataKey="absences" name="Ausencias Norm." stroke="#ef4444" strokeWidth={1.5} dot={false} />
                                            <Line type="monotone" dataKey="performance" name="Desempeño Norm." stroke="#10b981" strokeWidth={1.5} dot={false} />
                                            <Line type="monotone" dataKey="overtime" name="Horas Extra Norm." stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Desglose de Factores en Mes Pico */}
                            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                <div>
                                    <span className="text-[10px] uppercase font-mono text-gray-500">Ausencias Mes Pico</span>
                                    <p className="text-xs font-semibold font-mono text-gray-900 tabular-nums mt-0.5">
                                        {Number((selectedEmployee.peakAttentionMonth?.absencesNorm * 100).toFixed(0))}%
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-mono text-gray-500">Tardanzas Mes Pico</span>
                                    <p className="text-xs font-semibold font-mono text-gray-900 tabular-nums mt-0.5">
                                        {Number((selectedEmployee.peakAttentionMonth?.latesNorm * 100).toFixed(0))}%
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-mono text-gray-500">Desempeño Mes Pico</span>
                                    <p className="text-xs font-semibold font-mono text-gray-900 tabular-nums mt-0.5">
                                        {Number((selectedEmployee.peakAttentionMonth?.perfNorm * 100).toFixed(0))}%
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-mono text-gray-500">Horas Extra Mes Pico</span>
                                    <p className="text-xs font-semibold font-mono text-gray-900 tabular-nums mt-0.5">
                                        {Number((selectedEmployee.peakAttentionMonth?.overtimeNorm * 100).toFixed(0))}%
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-gray-400 text-xs">
                            Selecciona un colaborador para inspeccionar su trayectoria de atención.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemporalAttentionDashboard;

