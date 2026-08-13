import { useState, useEffect } from 'react';
import { 
    runCausalSimulation, 
    getCausalHistory, 
    exportAcademicDataset 
} from '../../services/intelligenceService';
import { 
    FiGitPullRequest, 
    FiDollarSign, 
    FiTrendingDown, 
    FiCheckCircle, 
    FiPlay, 
    FiDownload, 
    FiLayers, 
    FiSliders, 
    FiShield, 
    FiPieChart, 
    FiBarChart2, 
    FiHelpCircle,
    FiZap
} from 'react-icons/fi';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area
} from 'recharts';

const CausalInferenceDashboard = () => {
    const [history, setHistory] = useState([]);
    const [activeSimulation, setActiveSimulation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);

    // Formulario de Política Contrafactual
    const [treatmentType, setTreatmentType] = useState('SALARY_INCREASE');
    const [treatmentValue, setTreatmentValue] = useState(10);
    const [targetDepartment, setTargetDepartment] = useState('ALL');
    const [customTitle, setCustomTitle] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const resHistory = await getCausalHistory();
            if (resHistory.success && resHistory.data.length > 0) {
                setHistory(resHistory.data);
            }
            // Ejecutar una simulación inicial por defecto para poblar la vista
            await handleRunSimulation('Aumento Salarial 10% en IT', 'SALARY_INCREASE', 10, 'ALL');
        } catch (error) {
            console.error('Error al cargar datos causales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunSimulation = async (overrideTitle, overrideType, overrideVal, overrideDept) => {
        try {
            setSimulating(true);
            const payload = {
                treatmentType: overrideType || treatmentType,
                treatmentValue: overrideVal !== undefined ? overrideVal : Number(treatmentValue),
                targetDepartment: overrideDept || targetDepartment,
                customTitle: overrideTitle || customTitle || null
            };

            const res = await runCausalSimulation(payload);
            if (res.success) {
                setActiveSimulation(res.data);
                const updatedHist = await getCausalHistory();
                if (updatedHist.success) setHistory(updatedHist.data);
            }
        } catch (error) {
            console.error('Error al ejecutar simulación causal:', error);
        } finally {
            setSimulating(false);
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);
    };

    if (loading && !activeSimulation) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <FiGitPullRequest className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-slate-400">Inicializando Motor de Inferencia Causal (Do-Calculus & PSM)...</p>
            </div>
        );
    }

    const {
        impact = {},
        financials = {},
        propensityBalance = {},
        sampleSize = 0
    } = activeSimulation || {};

    const comparisonData = [
        {
            name: 'Estado Basal',
            TasaFuga: impact.baselineTurnoverRate || 0,
            CostoAnual: (financials.savingsEstimate || 0) + (financials.costEstimate || 0)
        },
        {
            name: 'Contrafactual do(T)',
            TasaFuga: impact.counterfactualTurnoverRate || 0,
            CostoAnual: financials.costEstimate || 0
        }
    ];

    const propensityData = [
        { grupo: 'Control', Propension: (propensityBalance.avgPropensityControl || 0.35) * 100 },
        { grupo: 'Tratado', Propension: (propensityBalance.avgPropensityTreated || 0.68) * 100 }
    ];

    return (
        <div className="space-y-6 pb-12">
            {/* Header ERP */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded uppercase tracking-wider">
                            Causal AI Engine (Judea Pearl Do-Calculus)
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Propensity Score Matching (PSM + IPW)
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <FiGitPullRequest className="text-blue-600 dark:text-blue-400" />
                        Motor de Inferencia Causal Contrafactual
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Evaluación de escenarios contrafactuales P(Y | do(T)) y retorno financiero de políticas organizacionales.
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

            {/* Policy Workbench & Active Simulation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Form: Intervention Builder */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FiSliders className="text-blue-500" />
                            Configurador de Política Contrafactual
                        </h2>
                    </div>

                    <div className="space-y-3 text-xs">
                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tipo de Intervención (Tratamiento T)
                            </label>
                            <select
                                value={treatmentType}
                                onChange={(e) => setTreatmentType(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="SALARY_INCREASE">Aumento Salarial (%)</option>
                                <option value="REMOTE_WORK">Teletrabajo (Días/semana)</option>
                                <option value="CAREER_PROMOTION">Ascenso de Carrera / Plan Formación</option>
                                <option value="TRAINING_PROGRAM">Programa de Capacitación Intensiva</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Magnitud del Tratamiento
                            </label>
                            <input
                                type="number"
                                value={treatmentValue}
                                onChange={(e) => setTreatmentValue(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                                placeholder="Ej. 10 para 10%"
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
                                placeholder="Ej. Plan de Retención Clave Q3"
                            />
                        </div>

                        <button
                            onClick={() => handleRunSimulation()}
                            disabled={simulating}
                            className="w-full py-2.5 px-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                        >
                            <FiPlay className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                            {simulating ? 'Procesando Do-Calculus...' : 'Simular Intervención Causal'}
                        </button>
                    </div>
                </div>

                {/* Right (2 cols): Active Causal Impact Results */}
                <div className="lg:col-span-2 space-y-4">
                    {/* KPI Cards Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span>Efecto Causal (ATE)</span>
                                <FiTrendingDown className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    -{impact.turnoverReductionPercent}%
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded">
                                    P(Y|do(T))
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">Reducción neta en probabilidad de fuga</p>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span>Retorno Financiero Neto</span>
                                <FiDollarSign className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {formatMoney(financials.netRoi)}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">ROI Est.: +{financials.roiPercentage}% retorno</p>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span>Retención Estimada</span>
                                <FiCheckCircle className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {impact.preventedTurnoverCount} Empleados
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">Muestra analizada: {sampleSize} casos</p>
                        </div>
                    </div>

                    {/* Chart: Baseline vs Counterfactual Comparison */}
                    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FiBarChart2 className="text-blue-500" />
                                    Comparativa Contrafactual: Tasa de Fuga (%) Basal vs. Tras Intervención
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Eliminación del sesgo de confusión mediante Inverse Probability Weighting (IPW).
                                </p>
                            </div>
                        </div>

                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 40]} unit="%" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="TasaFuga" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Tasa de Rotación (%)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulated Policies History Table */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FiLayers className="text-blue-500" />
                            Historial de Políticas Contrafactuales Evaluadas
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Ranking de intervenciones organizacionales según impacto causal (ATE) y retorno financiero neto.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold">
                                <th className="p-3">Política Intervención</th>
                                <th className="p-3">Dept. Objetivo</th>
                                <th className="p-3">Muestra</th>
                                <th className="p-3">Efecto Causal (ATE)</th>
                                <th className="p-3">Costo Intervención</th>
                                <th className="p-3">Ahorro Retención</th>
                                <th className="p-3">ROI Neto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-4 text-center text-slate-400 italic">No hay intervenciones simuladas aún.</td>
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
                                        <td className="p-3 font-mono">{item.sampleSize} emp.</td>
                                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                            {(item.ate * 100).toFixed(1)}%
                                        </td>
                                        <td className="p-3 font-mono">{formatMoney(item.costEstimate)}</td>
                                        <td className="p-3 font-mono text-emerald-600">{formatMoney(item.savingsEstimate)}</td>
                                        <td className="p-3 font-bold font-mono text-blue-600 dark:text-blue-400">
                                            {formatMoney(item.netRoi)}
                                        </td>
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

export default CausalInferenceDashboard;
