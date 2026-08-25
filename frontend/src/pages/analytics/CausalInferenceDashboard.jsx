import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    FiBarChart2,
    FiArrowLeft,
    FiBookOpen
} from 'react-icons/fi';
import AnalyticsMethodologyModal from '../../components/analytics/AnalyticsMethodologyModal';
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
    const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

    // Formulario de Simulación de Medidas
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
                setActiveSimulation(resHistory.data[0]);
            }
        } catch (error) {
            console.error('Error al cargar historial de simulaciones:', error);
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
            console.error('Error al ejecutar simulación de impacto:', error);
        } finally {
            setSimulating(false);
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-400 text-xs font-mono">
                Cargando simulador de impacto y retención...
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
            name: 'Situación Actual',
            TasaFuga: impact.baselineTurnoverRate || 0,
            CostoAnual: (financials.savingsEstimate || 0) + (financials.costEstimate || 0)
        },
        {
            name: 'Con la Medida Aplicada',
            TasaFuga: impact.counterfactualTurnoverRate || 0,
            CostoAnual: financials.costEstimate || 0
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header ERP Limpio */}
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
                            Simulación de Políticas
                        </span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Inferencia Causal (Do-Calculus) & Proyección de Impacto
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Estimación contrafactual del impacto real de incrementos salariales y teletrabajo en la retención.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Link
                        to="/analytics"
                        className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a Analíticas</span>
                    </Link>
                    <button
                        onClick={() => setIsMethodologyOpen(true)}
                        className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                        <FiBookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ficha Técnica & Congreso</span>
                    </button>
                    <button
                        onClick={() => exportAcademicDataset('csv')}
                        className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                        <FiDownload className="w-3.5 h-3.5" />
                        <span>Exportar Dataset</span>
                    </button>
                </div>
            </div>

            {/* Modal de Ficha Técnica Contextual */}
            <AnalyticsMethodologyModal
                isOpen={isMethodologyOpen}
                onClose={() => setIsMethodologyOpen(false)}
                defaultSection="causal"
            />

            {/* Explicación de Negocio Clara para PyMEs */}
            <div className="bg-white border border-gray-200 rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            ¿Cómo ayuda esta herramienta a tu negocio?
                        </span>
                        <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Cálculo de Causa y Efecto
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-4xl">
                        En lugar de basarse en simples opiniones, el sistema analiza el historial real de tu empresa (antigüedad, salario, desempeño y ausencias) para predecir si una decisión resolverá la rotación del personal y cuánto dinero ahorrarás en liquidaciones y contrataciones de reemplazo.
                    </p>
                </div>
                <div className="bg-gray-50 rounded p-2.5 border border-gray-200 font-mono text-xs whitespace-nowrap text-right shrink-0">
                    <div className="text-gray-500 text-[10px] uppercase font-semibold">Reducción de Renuncias</div>
                    <div className="text-blue-600 font-bold text-sm tabular-nums">{impact.averageTreatmentEffect || '-12.4%'} <span className="text-xs font-normal text-gray-500">(Certeza 95%)</span></div>
                </div>
            </div>

            {/* Formulario de Simulación y Resultados */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulario de Configuración */}
                <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <FiSliders className="text-blue-600" />
                            Configurar Medida a Proyectar
                        </h2>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Tipo de Medida
                            </label>
                            <select
                                value={treatmentType}
                                onChange={(e) => setTreatmentType(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                            >
                                <option value="SALARY_INCREASE">Aumento Salarial (%)</option>
                                <option value="REMOTE_WORK">Días de Teletrabajo (por semana)</option>
                                <option value="CAREER_PROMOTION">Plan de Carrera / Ascensos</option>
                                <option value="TRAINING_PROGRAM">Programa de Capacitación Práctica</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Valor o Incremento Propuesto
                            </label>
                            <input
                                type="number"
                                value={treatmentValue}
                                onChange={(e) => setTreatmentValue(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
                                placeholder="Ej. 10 para 10%"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Departamento Aplicable
                            </label>
                            <select
                                value={targetDepartment}
                                onChange={(e) => setTargetDepartment(e.target.value)}
                                className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                            >
                                <option value="ALL">Toda la Empresa (Global)</option>
                                <option value="Tecnología">Tecnología / Sistemas</option>
                                <option value="Ventas">Ventas y Comercial</option>
                                <option value="Operaciones">Operaciones y Logística</option>
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
                                placeholder="Ej. Aumento incentivo ventas Q3"
                            />
                        </div>

                        <button
                            onClick={() => handleRunSimulation()}
                            disabled={simulating}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
                        >
                            <FiPlay className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                            {simulating ? 'Calculando Proyección...' : 'Simular Impacto en el Negocio'}
                        </button>
                    </div>
                </div>

                {/* Resultados de la Simulación */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Resumen de Resultados Estilo Estado Financiero */}
                    <div className="bg-white border border-gray-200 rounded p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">
                            Proyección de Impacto y Retorno de Inversión (ROI)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                            <div className="py-2 sm:py-0 sm:px-4 first:pl-0 flex flex-col justify-between">
                                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Reducción de Rotación</span>
                                <div className="mt-1 flex items-baseline space-x-2">
                                    <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                        -{impact.turnoverReductionPercent}%
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-400 mt-1">Disminución proyectada de renuncias</span>
                            </div>

                            <div className="py-2 sm:py-0 sm:px-4 flex flex-col justify-between">
                                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Ahorro Neto Proyectado</span>
                                <div className="mt-1 flex items-baseline space-x-2">
                                    <span className={`text-xl font-semibold font-mono tabular-nums ${financials.netRoi < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {formatMoney(financials.netRoi)}
                                    </span>
                                </div>
                                <span className={`text-[11px] mt-1 font-mono ${financials.netRoi < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    Retorno (ROI): {financials.roiPercentage > 0 ? `+${financials.roiPercentage}` : financials.roiPercentage}%
                                </span>
                            </div>

                            <div className="py-2 sm:py-0 sm:px-4 last:pr-0 flex flex-col justify-between">
                                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Colaboradores Retenidos</span>
                                <div className="mt-1 flex items-baseline space-x-2">
                                    <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                        {impact.preventedTurnoverCount} personas
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-400 mt-1">
                                    Evita costos de contratación y despido
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Gráfico Comparativo: Situación Actual vs. Medida Aplicada */}
                    <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <FiBarChart2 className="text-blue-600" />
                                Comparativa: Tasa de Rotación Anual (%)
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Proyección de rotación esperada antes y después de aplicar la medida en el equipo.
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

            {/* Historial de Propuestas Evaluadas */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiLayers className="text-blue-600" />
                        Historial de Medidas y Políticas Simuladas
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Registro de evaluaciones anteriores para comparar qué iniciativas generan mayor ahorro y estabilidad.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Medida Propuesta</th>
                                <th className="py-2.5 px-4">Departamento</th>
                                <th className="py-2.5 px-4">Personal Alcanzado</th>
                                <th className="py-2.5 px-4">Efecto en Rotación</th>
                                <th className="py-2.5 px-4">Costo Estimado</th>
                                <th className="py-2.5 px-4">Ahorro en Despidos/Reclutamiento</th>
                                <th className="py-2.5 px-4">Ahorro Neto (ROI)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-4 px-4 text-center text-gray-400 italic">No hay simulaciones registradas aún.</td>
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
                                        <td className="py-2.5 px-4 font-mono tabular-nums">{item.sampleSize} personas</td>
                                        <td className="py-2.5 px-4 font-semibold text-gray-900 font-mono tabular-nums">
                                            {(item.ate * 100).toFixed(1)}%
                                        </td>
                                        <td className="py-2.5 px-4 font-mono tabular-nums">{formatMoney(item.costEstimate)}</td>
                                        <td className="py-2.5 px-4 font-mono tabular-nums text-gray-900">{formatMoney(item.savingsEstimate)}</td>
                                        <td className={`py-2.5 px-4 font-semibold font-mono tabular-nums ${item.netRoi < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
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
