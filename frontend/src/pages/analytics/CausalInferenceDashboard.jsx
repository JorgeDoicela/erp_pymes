import { useState, useEffect } from 'react';
import { 
    runCausalSimulation, 
    getCausalHistory, 
    exportAcademicDataset 
} from '../../services/intelligenceService';
import { 
    FiGitPullRequest, 
    FiPlay, 
    FiDownload, 
    FiLayers, 
    FiSliders, 
    FiBarChart2
} from 'react-icons/fi';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer
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
                // Cargar la simulación más reciente del historial (no ejecutar una nueva)
                setActiveSimulation(resHistory.data[0]);
            }
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 bg-gray-50">
                <FiGitPullRequest className="w-6 h-6 text-gray-500 animate-spin" />
                <p className="text-xs font-medium text-gray-500">Cargando historial de análisis causales...</p>
            </div>
        );
    }

    const {
        impact = {},
        financials = {},
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

    return (
        <div className="space-y-6 pb-12 bg-gray-50 min-h-screen p-6">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded uppercase tracking-wider font-mono">
                            Evaluación Contrafactual do(T)
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded uppercase tracking-wider font-mono">
                            Análisis Causal de Impacto
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FiGitPullRequest className="text-blue-600" />
                        Centro de Inferencia Causal y Evaluación de Políticas (Do-Calculus)
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Evalúa causalmente sobre los datos reales del personal el impacto económico y de retención antes de implementar una política.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportAcademicDataset('csv')}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer bg-white flex items-center gap-1.5"
                    >
                        <FiDownload className="w-3.5 h-3.5" />
                        Exportar Reporte
                    </button>
                </div>
            </div>

            {/* Policy Workbench & Active Simulation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Form: Intervention Builder */}
                <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <FiSliders className="text-blue-600" />
                            Configuración de la Medida a Evaluar
                        </h2>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Medida Propuesta
                            </label>
                            <select
                                value={treatmentType}
                                onChange={(e) => setTreatmentType(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                            >
                                <option value="SALARY_INCREASE">Aumento Salarial (%)</option>
                                <option value="REMOTE_WORK">Teletrabajo (Días/semana)</option>
                                <option value="CAREER_PROMOTION">Ascenso de Carrera / Plan Formación</option>
                                <option value="TRAINING_PROGRAM">Programa de Capacitación Intensiva</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Valor o Incremento
                            </label>
                            <input
                                type="number"
                                value={treatmentValue}
                                onChange={(e) => setTreatmentValue(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                placeholder="Ej. 10 para 10%"
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
                                <option value="ALL">Todos los Departamentos (Global)</option>
                                <option value="Tecnología">Tecnología / IT</option>
                                <option value="Ventas">Ventas y Comercial</option>
                                <option value="Operaciones">Operaciones</option>
                                <option value="Finanzas">Finanzas y Contabilidad</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Nombre de la Propuesta (Opcional)
                            </label>
                            <input
                                type="text"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                placeholder="Ej. Plan de Retención Clave Q3"
                            />
                        </div>

                        <button
                            onClick={() => handleRunSimulation()}
                            disabled={simulating}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
                        >
                            <FiPlay className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                            {simulating ? 'Calculando Impacto Causal...' : 'Calcular Impacto Causal de la Política'}
                        </button>
                    </div>
                </div>

                {/* Right (2 cols): Active Causal Impact Results */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Resumen KPI Estilo Estado Financiero */}
                    <div className="bg-white border border-gray-200 rounded p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">
                            Proyección de Impacto y Retorno de Inversión (ROI)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                            <div className="py-2 sm:py-0 sm:px-4 first:pl-0 flex flex-col justify-between">
                                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Impacto en Retención</span>
                                <div className="mt-1 flex items-baseline space-x-2">
                                    <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                        -{impact.turnoverReductionPercent}%
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-400 mt-1">Reducción estimada en rotación</span>
                            </div>

                            <div className="py-2 sm:py-0 sm:px-4 flex flex-col justify-between">
                                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Beneficio Neto Estimado</span>
                                <div className="mt-1 flex items-baseline space-x-2">
                                    <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                        {formatMoney(financials.netRoi)}
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-400 mt-1">ROI Est.: +{financials.roiPercentage}% retorno</span>
                            </div>

                            <div className="py-2 sm:py-0 sm:px-4 last:pr-0 flex flex-col justify-between">
                                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Retención Estimada</span>
                                <div className="mt-1 flex items-baseline space-x-2">
                                    <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                        {impact.preventedTurnoverCount} Empleados
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-400 mt-1">Muestra: {sampleSize} casos</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart: Baseline vs Counterfactual Comparison */}
                    <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <FiBarChart2 className="text-blue-600" />
                                Comparativa Contrafactual: Tasa de Fuga (%) Basal vs. Tras Intervención
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Eliminación del sesgo mediante Inverse Probability Weighting (IPW).
                            </p>
                        </div>

                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 40]} unit="%" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="TasaFuga" fill="#2563eb" radius={[2, 2, 0, 0]} name="Tasa de Rotación (%)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulated Policies History Table */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiLayers className="text-blue-600" />
                        Historial de Políticas Contrafactuales Evaluadas
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Ranking de intervenciones organizacionales según impacto causal (ATE) y retorno financiero neto.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Política Intervención</th>
                                <th className="py-2.5 px-4">Dept. Objetivo</th>
                                <th className="py-2.5 px-4">Muestra</th>
                                <th className="py-2.5 px-4">Efecto Causal (ATE)</th>
                                <th className="py-2.5 px-4">Costo Intervención</th>
                                <th className="py-2.5 px-4">Ahorro Retención</th>
                                <th className="py-2.5 px-4">ROI Neto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-4 px-4 text-center text-gray-400 italic">No hay evaluaciones causales registradas aún.</td>
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
                                        <td className="py-2.5 px-4 font-mono tabular-nums">{item.sampleSize} emp.</td>
                                        <td className="py-2.5 px-4 font-semibold text-gray-900 font-mono tabular-nums">
                                            {(item.ate * 100).toFixed(1)}%
                                        </td>
                                        <td className="py-2.5 px-4 font-mono tabular-nums">{formatMoney(item.costEstimate)}</td>
                                        <td className="py-2.5 px-4 font-mono tabular-nums text-gray-900">{formatMoney(item.savingsEstimate)}</td>
                                        <td className="py-2.5 px-4 font-semibold font-mono tabular-nums text-blue-600">
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
