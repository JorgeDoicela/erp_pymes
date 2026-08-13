import { useState, useEffect } from 'react';
import { 
    runMorlOptimization, 
    getMorlHistory, 
    exportAcademicDataset 
} from '../../services/intelligenceService';
import { 
    FiTarget, 
    FiDollarSign, 
    FiTrendingUp, 
    FiCheckCircle, 
    FiPlay, 
    FiDownload, 
    FiLayers, 
    FiSliders, 
    FiPieChart, 
    FiZap,
    FiAward,
    FiActivity
} from 'react-icons/fi';
import { 
    ScatterChart, 
    Scatter, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';

const MorlParetoDashboard = () => {
    const [history, setHistory] = useState([]);
    const [activeRun, setActiveRun] = useState(null);
    const [selectedPointIndex, setSelectedPointIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [optimizing, setOptimizing] = useState(false);

    // Formulario MORL
    const [budgetLimit, setBudgetLimit] = useState(15000);
    const [targetDepartment, setTargetDepartment] = useState('ALL');
    const [customTitle, setCustomTitle] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const resHistory = await getMorlHistory();
            if (resHistory.success && resHistory.data.length > 0) {
                setHistory(resHistory.data);
            }
            // Ejecutar simulación inicial por defecto
            await handleRunOptimization('Optimización MORL Presupuestaria IT', 15000, 'ALL');
        } catch (error) {
            console.error('Error al cargar datos MORL:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunOptimization = async (overrideTitle, overrideBudget, overrideDept) => {
        try {
            setOptimizing(true);
            const payload = {
                budgetLimit: overrideBudget !== undefined ? overrideBudget : Number(budgetLimit),
                targetDepartment: overrideDept || targetDepartment,
                customTitle: overrideTitle || customTitle || null
            };

            const res = await runMorlOptimization(payload);
            if (res.success) {
                setActiveRun(res.data);
                setSelectedPointIndex(res.data.selectedPointIndex || 0);
                const updatedHist = await getMorlHistory();
                if (updatedHist.success) setHistory(updatedHist.data);
            }
        } catch (error) {
            console.error('Error al ejecutar optimización MORL:', error);
        } finally {
            setOptimizing(false);
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);
    };

    if (loading && !activeRun) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <FiTarget className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-sm font-medium text-slate-400">Calculando Frontera de Pareto (Vector Q-Learning)...</p>
            </div>
        );
    }

    const paretoPoints = activeRun?.paretoFrontier || [];
    const selectedPoint = paretoPoints[selectedPointIndex] || paretoPoints[0] || {};
    const actionBreakdown = selectedPoint.actionBreakdown || {};

    const scatterData = paretoPoints.map((pt, idx) => ({
        index: idx,
        x: pt.totalCostEstimate,
        y: pt.expectedRetentionRate,
        w1: pt.weightRetention,
        w2: pt.weightCost,
        retained: pt.retainedEmployeeCount
    }));

    return (
        <div className="space-y-6 pb-12">
            {/* Header ERP */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded uppercase tracking-wider">
                            Multi-Objective Reinforcement Learning (MORL)
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded uppercase tracking-wider flex items-center gap-1">
                            <FiAward className="w-3 h-3 text-indigo-400" />
                            Frontera Eficiente de Pareto (Soluciones No Dominadas)
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <FiTarget className="text-amber-600 dark:text-amber-400" />
                        Motor de Optimización Multiobjetivo MORL
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Equilibrio económico exacto entre inversión en compensaciones ($) y tasa de retención esperada (%) mediante Q-Learning.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportAcademicDataset('csv')}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1.5"
                    >
                        <FiDownload className="w-3.5 h-3.5" />
                        Exportar Dataset Paper
                    </button>
                </div>
            </div>

            {/* Workbench & Active Results */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Form: MORL Configurator */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FiSliders className="text-amber-500" />
                            Configurador Presupuestario MORL
                        </h2>
                    </div>

                    <div className="space-y-4 text-xs">
                        <div>
                            <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                                <span>Límite Presupuestario ($)</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">{formatMoney(budgetLimit)}</span>
                            </div>
                            <input
                                type="range"
                                min="2000"
                                max="50000"
                                step="1000"
                                value={budgetLimit}
                                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Departamento Objetivo
                            </label>
                            <select
                                value={targetDepartment}
                                onChange={(e) => setTargetDepartment(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                            >
                                <option value="ALL">Todos los Departamentos (Global)</option>
                                <option value="Tecnología">Tecnología / IT</option>
                                <option value="Ventas">Ventas y Comercial</option>
                                <option value="Operaciones">Operaciones</option>
                                <option value="Finanzas">Finanzas y Contabilidad</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Título Personalizado (Opcional)
                            </label>
                            <input
                                type="text"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                                placeholder="Ej. Plan Anual Retención Q4"
                            />
                        </div>

                        <button
                            onClick={() => handleRunOptimization()}
                            disabled={optimizing}
                            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                        >
                            <FiPlay className={`w-3.5 h-3.5 ${optimizing ? 'animate-spin' : ''}`} />
                            {optimizing ? 'Entrenando Q-Learning Vectorial...' : 'Calcular Frontera de Pareto'}
                        </button>
                    </div>
                </div>

                {/* Right (2 cols): Selected Pareto Point & Interactive Chart */}
                <div className="lg:col-span-2 space-y-4">
                    {/* KPI Cards Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span>Costo de Política Selección</span>
                                <FiDollarSign className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                    {formatMoney(selectedPoint.totalCostEstimate)}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">Peso Costo w₂ = {selectedPoint.weightCost}</p>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span>Tasa Retención Esperada</span>
                                <FiTrendingDown className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {selectedPoint.expectedRetentionRate}%
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">Peso Retención w₁ = {selectedPoint.weightRetention}</p>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span>Empleados Retenidos</span>
                                <FiCheckCircle className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {selectedPoint.retainedEmployeeCount} Empleados
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">Solución No Dominada de Pareto</p>
                        </div>
                    </div>

                    {/* Interactive Pareto Scatter Chart */}
                    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FiActivity className="text-amber-500" />
                                    Curva de la Frontera Eficiente de Pareto (Presupuesto $ vs. Retención %)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Haz clic en cualquier punto de la curva para cargar la política de intervenciones correspondiente.
                                </p>
                            </div>
                        </div>

                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                    <XAxis type="number" dataKey="x" name="Costo Presupuestario" unit="$" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis type="number" dataKey="y" name="Tasa Retención" unit="%" domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip 
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ payload }) => {
                                            if (payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 text-xs space-y-1">
                                                        <p className="font-bold text-amber-400">Punto Pareto #{data.index + 1}</p>
                                                        <p>Costo: {formatMoney(data.x)}</p>
                                                        <p>Retención: {data.y}%</p>
                                                        <p className="text-[10px] text-slate-400">Preferencia w₁ (Retención) = {data.w1}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="Puntos Pareto" data={scatterData} onClick={(node) => setSelectedPointIndex(node.index)}>
                                        {scatterData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={index === selectedPointIndex ? '#f59e0b' : '#3b82f6'} 
                                                r={index === selectedPointIndex ? 8 : 5} 
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Matrix Breakdown */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FiPieChart className="text-amber-500" />
                        Desglose de Acciones Recomendadas para el Punto Pareto Seleccionado
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Acciones óptimas aprendidas por la política greedy de Q-Learning según categoría de riesgo.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{actionBreakdown.NO_ACTION || 0}</span>
                        <p className="text-[10px] text-slate-500">Sin Intervención</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{actionBreakdown.TRAINING_GRANT || 0}</span>
                        <p className="text-[10px] text-slate-500">Beca Capacitación</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{actionBreakdown.REMOTE_WORK_2D || 0}</span>
                        <p className="text-[10px] text-slate-500">Teletrabajo 2d/sem</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{actionBreakdown.SALARY_BUMP_5 || 0}</span>
                        <p className="text-[10px] text-slate-500">Aumento 5%</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{actionBreakdown.SALARY_BUMP_10 || 0}</span>
                        <p className="text-[10px] text-slate-500">Aumento 10%</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{actionBreakdown.PROMOTION_BONUS || 0}</span>
                        <p className="text-[10px] text-slate-500">Ascenso + Bono</p>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FiLayers className="text-amber-500" />
                            Historial de Corridas de Optimización MORL
                        </h2>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold">
                                <th className="p-3">Título Corrida</th>
                                <th className="p-3">Dept. Objetivo</th>
                                <th className="p-3">Presupuesto Límite</th>
                                <th className="p-3">Muestra</th>
                                <th className="p-3">Puntos Pareto No Dominados</th>
                                <th className="p-3">Fecha Ejecución</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-4 text-center text-slate-400 italic">No hay ejecuciones MORL registradas.</td>
                                </tr>
                            ) : (
                                history.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.title}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">
                                                {item.targetDepartment}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono">{formatMoney(item.budgetLimit)}</td>
                                        <td className="p-3 font-mono">{item.sampleSize} emp.</td>
                                        <td className="p-3 font-bold font-mono text-amber-600 dark:text-amber-400">{item.paretoPointsCount} puntos</td>
                                        <td className="p-3 text-slate-400 font-mono text-[11px]">{new Date(item.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MorlParetoDashboard;
