import { useState, useEffect } from 'react';
import { 
    getRsiMetrics, 
    calibrateRsiModel, 
    simulateRsiOutcome, 
    exportAcademicDataset 
} from '../../services/intelligenceService';
import { 
    FiActivity, 
    FiZap, 
    FiRefreshCw, 
    FiPlay, 
    FiDownload, 
    FiSliders, 
    FiCpu, 
    FiUserX,
    FiUserCheck
} from 'react-icons/fi';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const RsiOptimizationDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [simulationLog, setSimulationLog] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            const res = await getRsiMetrics();
            if (res.success) {
                setMetrics(res.data);
            }
        } catch (error) {
            console.error('Error al cargar métricas de RSI:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCalibrate = async () => {
        try {
            setActionLoading(true);
            const res = await calibrateRsiModel();
            if (res.success) {
                showToast(`Época ${res.data.epoch} completada. Brier Score reducido a ${res.data.brierScore} (+${res.data.improvementPercentage}% mejora)`);
                await loadMetrics();
            }
        } catch (error) {
            console.error('Error en calibración RSI:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSimulate = async (outcome) => {
        try {
            setActionLoading(true);
            const res = await simulateRsiOutcome({ actualOutcome: outcome });
            if (res.success) {
                const outcomeText = outcome === 1 ? 'RENUNCIA' : 'PERMANENCIA';
                const logEntry = {
                    time: new Date().toLocaleTimeString(),
                    type: outcome === 1 ? 'RESIGNATION' : 'RETENTION',
                    message: `Evento: ${outcomeText} procesado. Época ${res.data.calibration.epoch} activada (Brier: ${res.data.calibration.brierScore})`
                };
                setSimulationLog(prev => [logEntry, ...prev.slice(0, 7)]);
                showToast(`Simulación completada: Automejora ejecutada (Nuevo Brier: ${res.data.calibration.brierScore})`);
                await loadMetrics();
            }
        } catch (error) {
            console.error('Error al simular evento:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    if (loading && !metrics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 bg-gray-50">
                <FiRefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
                <p className="text-xs font-medium text-gray-500">Cargando Motor de Automejora Recursiva (RSI Engine)...</p>
            </div>
        );
    }

    const {
        currentEpoch = 1,
        currentBrierScore = 0.185,
        currentLogLoss = 0.420,
        improvementPercentage = 0,
        totalAuditedPredictions = 0,
        resolvedOutcomeCount = 0,
        activeParameters = {},
        calibrationHistory = []
    } = metrics || {};

    const chartData = calibrationHistory.map(c => ({
        epoch: `Época ${c.epoch}`,
        brierScore: c.brierScore,
        logLoss: c.logLoss,
        mejora: c.improvementPercentage
    }));

    // Indicador de tendencia del Brier Score
    const brierTrend = (() => {
        if (calibrationHistory.length < 2) return { label: 'Estable', color: 'gray', symbol: '→' };
        const first = calibrationHistory[0].brierScore;
        const last  = calibrationHistory[calibrationHistory.length - 1].brierScore;
        if (last < first * 0.98) return { label: 'Convergiendo ↓', color: 'emerald', symbol: '↓' };
        if (last > first * 1.02) return { label: 'Divergente ↑', color: 'red', symbol: '↑' };
        return { label: 'Estable (Early Stop activo)', color: 'blue', symbol: '→' };
    })();

    // Comparativa baseline vs. modelo avanzado (valores fijos del experimento calibrado)
    const BASELINE_BRIER = 0.2105;
    const ADVANCED_BRIER = currentBrierScore;
    const brierReductionPct = BASELINE_BRIER > 0
        ? Number((((BASELINE_BRIER - ADVANCED_BRIER) / BASELINE_BRIER) * 100).toFixed(1))
        : 0;

    return (
        <div className="space-y-6 pb-12 bg-gray-50 min-h-screen p-6">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 bg-gray-900 text-white px-4 py-2.5 rounded text-xs font-mono border border-gray-800">
                    <FiZap className="w-4 h-4 text-blue-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded uppercase tracking-wider font-mono">
                            Calibración Continua v2.4
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded uppercase tracking-wider font-mono">
                            Aprendizaje Activo en Vivo
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FiCpu className="text-blue-600" />
                        Centro de Mejora y Calibración Automática
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        El sistema recalibra y perfecciona continuamente la precisión de sus proyecciones basándose en los datos reales de tu empresa.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportAcademicDataset('csv')}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer bg-white flex items-center gap-1.5"
                    >
                        <FiDownload className="w-3.5 h-3.5" />
                        Exportar Datos
                    </button>
                    <button
                        onClick={handleCalibrate}
                        disabled={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                        Actualizar Precisión del Modelo
                    </button>
                </div>
            </div>

            {/* Resumen Métricas Estilo Informe Contable / Estado Financiero */}
            <div className="bg-white border border-gray-200 rounded p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">
                    Resumen de Precisión y Estado de Calibración
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    <div className="py-2 md:py-0 md:px-4 first:pl-0 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Ciclo de Ajuste Actual</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">Ciclo #{currentEpoch}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">Calibración automática en tiempo real</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Margen de Error (Brier Loss)</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">{currentBrierScore}</span>
                            <span className="text-[10px] font-mono font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200" title="Desviación de incertidumbre">
                                Incertidumbre: {currentLogLoss}
                            </span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">Cuanto más bajo, mayor es la certeza</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Mejora de Exactitud</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                {improvementPercentage >= 0 ? '+' : ''}{improvementPercentage}%
                            </span>
                            <span className="text-[11px] text-gray-500 font-mono">vs época 1</span>
                        </div>
                        <span className={`text-[11px] mt-1 font-medium ${
                            brierTrend.color === 'emerald' ? 'text-emerald-600' :
                            brierTrend.color === 'red'     ? 'text-red-600' :
                                                             'text-blue-600'
                        }`}>{brierTrend.symbol} {brierTrend.label}</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 last:pr-0 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Casos Evaluados</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">{totalAuditedPredictions}</span>
                            <span className="text-[11px] text-gray-500 font-mono">({resolvedOutcomeCount} confirmados)</span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">Histórico de predicciones analizadas</span>
                    </div>
                </div>
            </div>

            {/* Learning Curve Chart & Workbench Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left (2 cols): Learning Curve (Brier Reduction Chart) */}
                <div className="lg:col-span-2 p-4 bg-white border border-gray-200 rounded space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <FiActivity className="text-blue-600" />
                                Historial de Precisión (Evolución de Reducción del Margen de Error)
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Gráfica que muestra cómo el error del modelo disminuye a medida que el sistema aprende de las novedades de personal.
                            </p>
                        </div>
                    </div>

                    <div className="h-[280px] w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="brierGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 0.25]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="brierScore" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#brierGrad)" name="Margen de Error (Brier Loss)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right (1 col): Live Simulation Workbench */}
                <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-200 rounded uppercase">
                            Aprendizaje Activo en Vivo
                        </span>
                        <h2 className="text-sm font-semibold text-gray-900 mt-2 flex items-center gap-2">
                            <FiZap className="text-blue-600" />
                            Evaluación de Novedades de Personal
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Procesa la resolución de eventos de permanencia o salida para recalibrar los hiperparámetros del modelo Weibull.
                        </p>
                    </div>

                    <div className="space-y-2 pt-1">
                        <button
                            onClick={() => handleSimulate(1)}
                            disabled={actionLoading}
                            className="w-full py-2 px-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-medium rounded transition-colors flex items-center justify-between cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <FiUserX className="text-gray-600" />
                                Registrar Evento de Desvinculación (Y = 1)
                            </span>
                            <FiPlay className="w-3.5 h-3.5 text-gray-500" />
                        </button>

                        <button
                            onClick={() => handleSimulate(0)}
                            disabled={actionLoading}
                            className="w-full py-2 px-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-medium rounded transition-colors flex items-center justify-between cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <FiUserCheck className="text-gray-600" />
                                Registrar Evento de Permanencia (Y = 0)
                            </span>
                            <FiPlay className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Registro de Eventos en Tiempo Real:</p>
                        <div className="h-[130px] overflow-y-auto space-y-1.5 font-mono text-[10px] bg-gray-50 border border-gray-200 rounded p-2 text-gray-700">
                            {simulationLog.length === 0 ? (
                                <p className="text-gray-400 italic text-[11px]">Esperando eventos para recalibración...</p>
                            ) : (
                                simulationLog.map((log, idx) => (
                                    <div key={idx} className="pb-1 border-b border-gray-100 last:border-0">
                                        <span className="text-gray-400">[{log.time}]</span>{' '}
                                        <span className="text-gray-900 font-semibold">{log.message}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Calibrated Hyperparameters Matrix */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiSliders className="text-blue-600" />
                        Variables de Impacto en la Permanencia del Personal (Ponderaciones Calibradas)
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Importancia de cada factor estimada automáticamente por el motor predictivo para determinar el nivel de retención.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded" title="Impacto del Nivel Salarial">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Impacto Salario</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.beta_salary ?? -0.85}</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded" title="Impacto de Ausencias e Inasistencias">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Impacto Ausencias</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.beta_absence ?? 0.35}</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded" title="Impacto de Evaluaciones de Desempeño">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Impacto Desempeño</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.beta_perf ?? 1.10}</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded" title="Impacto de Tiempo sin Promociones">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Sin Ascensos</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.beta_no_promo ?? 0.25}</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded" title="Factor de Escala Temporal">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Escala Temporal</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.k_weibull ?? 1.25}</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded" title="Tiempo Medio Estimado de Permanencia (Meses)">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Tiempo Medio (Meses)</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.lambda_weibull ?? 48}</p>
                    </div>
                </div>
            </div>

            {/* Comparativa Científica: Baseline Trivial vs. Modelo Weibull IA */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiActivity className="text-blue-600" />
                        Evaluación Rigurosa: Modelo Heurístico Trivial vs. Modelo Weibull IA (Propuesto)
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Comparativa de rendimiento según Brier Score (MSE probabilístico). Modelo Baseline: regla salarial simple. Modelo propuesto: distribución Weibull + RSI.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Baseline Heurístico</span>
                        <p className="text-lg font-semibold font-mono tabular-nums text-gray-900">{BASELINE_BRIER.toFixed(4)}</p>
                        <span className="text-[10px] text-gray-400">Brier Score (trivial)</span>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block mb-1">Modelo Weibull IA (Propuesto)</span>
                        <p className="text-lg font-semibold font-mono tabular-nums text-blue-800">{ADVANCED_BRIER.toFixed(4)}</p>
                        <span className="text-[10px] text-blue-400">Brier Score actual</span>
                    </div>
                    <div className={`p-3 rounded border ${
                        brierReductionPct > 0
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Reducción del Error (MSE)</span>
                        <p className={`text-lg font-semibold font-mono tabular-nums ${
                            brierReductionPct > 0 ? 'text-emerald-700' : 'text-gray-700'
                        }`}>
                            {brierReductionPct > 0 ? '-' : ''}{Math.abs(brierReductionPct)}%
                        </p>
                        <span className="text-[10px] text-gray-400">vs. modelo trivial</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RsiOptimizationDashboard;
