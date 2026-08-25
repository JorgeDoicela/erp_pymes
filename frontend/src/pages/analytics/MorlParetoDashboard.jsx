import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    runMorlOptimization, 
    getMorlHistory, 
    exportAcademicDataset 
} from '../../services/intelligenceService';
import { 
    FiTarget, 
    FiPlay, 
    FiDownload, 
    FiLayers, 
    FiSliders, 
    FiPieChart, 
    FiActivity,
    FiArrowLeft
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

    // Formulario de Optimización — budgetLimit se inicializa desde el ~5% de la nómina real
    const [budgetLimit, setBudgetLimit] = useState(0);
    const [targetDepartment, setTargetDepartment] = useState('ALL');
    const [customTitle, setCustomTitle] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [resHistory, resDashboard] = await Promise.all([
                getMorlHistory(),
                import('../../services/intelligenceService.js').then(m => m.getDashboard())
            ]);

            // Calcular presupuesto sugerido: 5% de la masa salarial mensual real del tenant
            if (resDashboard?.data?.payroll) {
                const payrollData = resDashboard.data.payroll;
                const monthlySalaryMass = payrollData.totalMonthlyCost || payrollData.nextPayrollAmount || 0;
                const suggested = Math.round(monthlySalaryMass * 0.05 * 12); // 5% anual
                setBudgetLimit(suggested > 0 ? suggested : 5000);
            }

            if (resHistory.success && resHistory.data.length > 0) {
                setHistory(resHistory.data);
                const last = resHistory.data[0];
                setActiveRun(last);
                setSelectedPointIndex(last.selectedPointIndex || 0);
                // Si ya hay una corrida previa, usar su budgetLimit como referencia
                if (last.budgetLimit > 0) setBudgetLimit(last.budgetLimit);
            }
        } catch (error) {
            console.error('Error al cargar datos de optimización:', error);
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
            console.error('Error al ejecutar optimización:', error);
        } finally {
            setOptimizing(false);
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-400 text-xs font-mono">
                Cargando optimizador de presupuesto y retención...
            </div>
        );
    }

    if (!activeRun) {
        return (
            <div className="p-12 text-center text-gray-400 text-xs font-mono space-y-3 bg-white rounded border border-gray-200">
                <p className="text-sm font-semibold text-gray-700">Sin optimizaciones ejecutadas aún</p>
                <p className="text-xs text-gray-500">Configura tu presupuesto límite y encuentra la combinación óptima de retención</p>
                <button
                    onClick={() => handleRunOptimization()}
                    disabled={optimizing}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded transition-colors cursor-pointer shadow-xs"
                >
                    Ejecutar Primera Optimización
                </button>
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
        <div className="space-y-6">
            {/* Header ERP */}
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
                            Optimización Presupuestaria
                        </span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Optimización Multiobjetivo (MORL - Frontera de Pareto)
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Cálculo de compensación óptima en la frontera de Pareto entre costo empresarial y riesgo de fuga.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to="/analytics"
                        className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a Analíticas</span>
                    </Link>
                    <button
                        onClick={() => exportAcademicDataset('csv')}
                        className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                        <FiDownload className="w-3.5 h-3.5" />
                        <span>Exportar Reporte</span>
                    </button>
                </div>
            </div>

            {/* Explicación Sencilla de Negocio para PyMEs */}
            <div className="bg-white border border-gray-200 rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            ¿Cómo funciona este optimizador?
                        </span>
                        <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Equilibrio Óptimo
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-4xl">
                        Cada punto en la gráfica representa una combinación eficiente: el sistema calcula la inversión mínima necesaria para alcanzar el mayor porcentaje posible de permanencia del personal. Elige el punto que mejor se ajuste al presupuesto disponible de tu negocio.
                    </p>
                </div>
                <div className="bg-gray-50 rounded p-2.5 border border-gray-200 font-mono text-xs whitespace-nowrap text-right shrink-0">
                    <div className="text-gray-500 text-[10px] uppercase font-semibold">Opciones Óptimas</div>
                    <div className="text-gray-900 font-bold text-sm tabular-nums">{paretoPoints.length} <span className="text-xs font-normal text-gray-500">alternativas calculadas</span></div>
                </div>
            </div>

            {/* Configuración y Resultados Interactivos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulario de Presupuesto */}
                <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <FiSliders className="text-blue-600" />
                            Definir Presupuesto Límite
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                                <span>Presupuesto Máximo Anual</span>
                                <span className="font-mono font-semibold text-gray-900">{formatMoney(budgetLimit)}</span>
                            </div>
                            <input
                                type="range"
                                min="2000"
                                max="50000"
                                step="1000"
                                value={budgetLimit}
                                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Departamento Objetivo
                            </label>
                            <select
                                value={targetDepartment}
                                onChange={(e) => setTargetDepartment(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                            >
                                <option value="ALL">Toda la Empresa (Global)</option>
                                <option value="Tecnología">Tecnología / IT</option>
                                <option value="Ventas">Ventas y Comercial</option>
                                <option value="Operaciones">Operaciones y Logística</option>
                                <option value="Finanzas">Finanzas y Contabilidad</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Título del Plan (Opcional)
                            </label>
                            <input
                                type="text"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                placeholder="Ej. Plan Anual de Fidelización Q4"
                            />
                        </div>

                        <button
                            onClick={() => handleRunOptimization()}
                            disabled={optimizing}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <FiPlay className={`w-3.5 h-3.5 ${optimizing ? 'animate-spin' : ''}`} />
                            {optimizing ? 'Calculando Opciones Óptimas...' : 'Recalcular Plan Óptimo'}
                        </button>
                    </div>
                </div>

                {/* Opción Seleccionada y Gráfica Interactiva */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Resumen Contable de la Opción Seleccionada */}
                    <div className="bg-white border border-gray-200 rounded p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">
                            Resumen de la Opción Seleccionada (Alternativa #{selectedPointIndex + 1})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                            <div className="py-2 sm:py-0 sm:px-4 first:pl-0 flex flex-col justify-between">
                                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Inversión Estimada</span>
                                <div className="mt-1 flex items-baseline space-x-2">
                                    <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                        {formatMoney(selectedPoint.totalCostEstimate)}
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-400 mt-1">Costo total de las medidas</span>
                            </div>

                            <div className="py-2 sm:py-0 sm:px-4 flex flex-col justify-between">
                                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Retención Estimada</span>
                                <div className="mt-1 flex items-baseline space-x-2">
                                    <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                        {selectedPoint.expectedRetentionRate}%
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-400 mt-1">Permanencia esperada del equipo</span>
                            </div>

                            <div className="py-2 sm:py-0 sm:px-4 last:pr-0 flex flex-col justify-between">
                                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Colaboradores Retenidos</span>
                                <div className="mt-1 flex items-baseline space-x-2">
                                    <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                        {selectedPoint.retainedEmployeeCount} personas
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-400 mt-1">Protegidos contra renuncias</span>
                            </div>
                        </div>
                    </div>

                    {/* Gráfica de Opciones Óptimas */}
                    <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <FiActivity className="text-blue-600" />
                                Curva de Rendimiento: Presupuesto ($) vs. Retención (%)
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Haz clic en cualquiera de los puntos para ver el desglose exacto de medidas de esa opción.
                            </p>
                        </div>

                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis type="number" dataKey="x" name="Inversión" unit="$" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                    <YAxis type="number" dataKey="y" name="Retención" unit="%" domain={[50, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                                    <Tooltip 
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ payload }) => {
                                            if (payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-gray-900 text-white p-2.5 rounded border border-gray-800 text-xs space-y-1">
                                                        <p className="font-semibold text-gray-200">Opción #{data.index + 1}</p>
                                                        <p className="font-mono">Inversión: {formatMoney(data.x)}</p>
                                                        <p className="font-mono">Retención: {data.y}%</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="Opciones" data={scatterData} onClick={(node) => setSelectedPointIndex(node.index)}>
                                        {scatterData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={index === selectedPointIndex ? '#2563eb' : '#9ca3af'} 
                                                r={index === selectedPointIndex ? 7 : 4} 
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desglose de Medidas de la Opción Seleccionada */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiPieChart className="text-blue-600" />
                        Medidas Sugeridas para esta Alternativa (Opción #{selectedPointIndex + 1})
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Cantidad de colaboradores que recibirían cada tipo de beneficio según su perfil de desempeño y riesgo.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center text-xs">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <span className="text-lg font-semibold font-mono tabular-nums text-gray-900">{actionBreakdown.NO_ACTION || 0}</span>
                        <p className="text-[10px] text-gray-500">Sin Intervención</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <span className="text-lg font-semibold font-mono tabular-nums text-gray-900">{actionBreakdown.TRAINING_GRANT || 0}</span>
                        <p className="text-[10px] text-gray-500">Capacitación</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <span className="text-lg font-semibold font-mono tabular-nums text-gray-900">{actionBreakdown.REMOTE_WORK_2D || 0}</span>
                        <p className="text-[10px] text-gray-500">Teletrabajo 2d</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <span className="text-lg font-semibold font-mono tabular-nums text-gray-900">{actionBreakdown.SALARY_BUMP_5 || 0}</span>
                        <p className="text-[10px] text-gray-500">Aumento 5%</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <span className="text-lg font-semibold font-mono tabular-nums text-gray-900">{actionBreakdown.SALARY_BUMP_10 || 0}</span>
                        <p className="text-[10px] text-gray-500">Aumento 10%</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <span className="text-lg font-semibold font-mono tabular-nums text-gray-900">{actionBreakdown.PROMOTION_BONUS || 0}</span>
                        <p className="text-[10px] text-gray-500">Ascenso + Bono</p>
                    </div>
                </div>
            </div>

            {/* Historial de Planes */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiLayers className="text-blue-600" />
                        Historial de Planes Optimizados
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Título del Plan</th>
                                <th className="py-2.5 px-4">Departamento</th>
                                <th className="py-2.5 px-4">Presupuesto Límite</th>
                                <th className="py-2.5 px-4">Colaboradores</th>
                                <th className="py-2.5 px-4">Opciones Generadas</th>
                                <th className="py-2.5 px-4">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-4 px-4 text-center text-gray-400 italic">No hay planes registrados.</td>
                                </tr>
                            ) : (
                                history.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                                        <td className="py-2.5 px-4 font-semibold text-gray-900">{item.title}</td>
                                        <td className="py-2.5 px-4">
                                            <span className="bg-gray-100 border border-gray-200 text-gray-700 font-mono text-[10px] px-2 py-0.5 rounded">
                                                {item.targetDepartment}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 font-mono tabular-nums">{formatMoney(item.budgetLimit)}</td>
                                        <td className="py-2.5 px-4 font-mono tabular-nums">{item.sampleSize} personas</td>
                                        <td className="py-2.5 px-4 font-semibold font-mono tabular-nums text-gray-900">{item.paretoPointsCount} opciones</td>
                                        <td className="py-2.5 px-4 text-gray-400 font-mono text-[11px]">{new Date(item.createdAt).toLocaleDateString()}</td>
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
