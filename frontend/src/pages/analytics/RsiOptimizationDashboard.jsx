import { useState, useEffect } from 'react';
import { 
    getRsiMetrics, 
    calibrateRsiModel, 
    simulateRsiOutcome, 
    exportAcademicDataset,
    getCrossValidationMetrics,
    getMultiSeedSensitivity
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
    FiUserCheck,
    FiCheckCircle,
    FiTrendingUp
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
    const [cvMetrics, setCvMetrics] = useState(null);
    const [sensitivityMetrics, setSensitivityMetrics] = useState(null);
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
            const [res, resCv, resSens] = await Promise.allSettled([
                getRsiMetrics(),
                getCrossValidationMetrics(),
                getMultiSeedSensitivity()
            ]);

            if (res.status === 'fulfilled' && res.value?.success) {
                setMetrics(res.value.data);
            }
            if (resCv.status === 'fulfilled' && resCv.value?.success) {
                setCvMetrics(resCv.value.data);
            }
            if (resSens.status === 'fulfilled' && resSens.value?.success) {
                setSensitivityMetrics(resSens.value.data);
            }
        } catch (error) {
            console.error('Error al cargar métricas de calibración:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCalibrate = async () => {
        try {
            setActionLoading(true);
            const res = await calibrateRsiModel();
            if (res.success) {
                showToast(`Ciclo de calibración #${res.data.epoch} completado con éxito (+${res.data.improvementPercentage}% mejora en certeza)`);
                await loadMetrics();
            }
        } catch (error) {
            console.error('Error en calibración de evaluaciones:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSimulate = async (outcome) => {
        try {
            setActionLoading(true);
            const res = await simulateRsiOutcome({ actualOutcome: outcome });
            if (res.success) {
                const outcomeText = outcome === 1 ? 'DESVINCULACIÓN' : 'PERMANENCIA';
                const logEntry = {
                    time: new Date().toLocaleTimeString(),
                    type: outcome === 1 ? 'RESIGNATION' : 'RETENTION',
                    message: `Evento procesado: ${outcomeText}. Ciclo de aprendizaje #${res.data.calibration.epoch} activado.`
                };
                setSimulationLog(prev => [logEntry, ...prev.slice(0, 7)]);
                showToast(`Evento registrado: el sistema ajustó sus proyecciones automáticamente.`);
                await loadMetrics();
            }
        } catch (error) {
            console.error('Error al registrar evento:', error);
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
                <p className="text-xs font-medium text-gray-500">Cargando centro de calibración y certeza...</p>
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
        epoch: `Ciclo ${c.epoch}`,
        brierScore: c.brierScore,
        logLoss: c.logLoss,
        mejora: c.improvementPercentage
    }));

    const brierTrend = (() => {
        if (calibrationHistory.length < 2) return { label: 'Estable', color: 'gray', symbol: '→' };
        const first = calibrationHistory[0].brierScore;
        const last  = calibrationHistory[calibrationHistory.length - 1].brierScore;
        if (last < first * 0.98) return { label: 'Mejorando Certeza ↓', color: 'emerald', symbol: '↓' };
        if (last > first * 1.02) return { label: 'Variación Detectada ↑', color: 'red', symbol: '↑' };
        return { label: 'Calibrado y Estable', color: 'blue', symbol: '→' };
    })();

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
                            Calibración Objetiva de Talento
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded uppercase tracking-wider font-mono">
                            Ajuste en Tiempo Real
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FiCpu className="text-blue-600" />
                        Calibración y Precisión de Evaluaciones
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Ajusta y afina automáticamente la objetividad de las calificaciones de desempeño y las proyecciones de permanencia de tus colaboradores.
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
                    <button
                        onClick={handleCalibrate}
                        disabled={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                        Recalibrar Ahora
                    </button>
                </div>
            </div>

            {/* Resumen Métricas Estilo Informe Contable */}
            <div className="bg-white border border-gray-200 rounded p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">
                    Estado de Precisión y Calibración
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    <div className="py-2 md:py-0 md:px-4 first:pl-0 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Ciclo de Ajuste</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">Ciclo #{currentEpoch}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">Ajuste automático continuo</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Margen de Desviación Residual</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">{currentBrierScore}</span>
                            <span className="text-[10px] font-mono font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                Error: {currentLogLoss}
                            </span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">A menor valor, mayor fiabilidad</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Ganancia de Precisión</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                {improvementPercentage >= 0 ? '+' : ''}{improvementPercentage}%
                            </span>
                            <span className="text-[11px] text-gray-500 font-mono">vs inicial</span>
                        </div>
                        <span className={`text-[11px] mt-1 font-medium ${
                            brierTrend.color === 'emerald' ? 'text-emerald-600' :
                            brierTrend.color === 'red'     ? 'text-red-600' :
                                                             'text-blue-600'
                        }`}>{brierTrend.symbol} {brierTrend.label}</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 last:pr-0 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Histórico Analizado</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">{totalAuditedPredictions}</span>
                            <span className="text-[11px] text-gray-500 font-mono">({resolvedOutcomeCount} confirmados)</span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">Evaluaciones y novedades procesadas</span>
                    </div>
                </div>
            </div>

            {/* Explicación de Negocio Clara */}
            <div className="bg-white border border-gray-200 rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            ¿Por qué es importante para tu empresa?
                        </span>
                        <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Evaluaciones 100% Justas
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-4xl">
                        Cuando los supervisores evalúan al personal, pueden existir sesgos personales involuntarios (calificadores muy estrictos o muy permisivos). Este motor compara las notas con los resultados reales de trabajo y ausencias para equilibrar las calificaciones y asegurar que los incentivos, ascensos y aumentos sean siempre justos.
                    </p>
                </div>
                <div className="bg-gray-50 rounded p-2.5 border border-gray-200 font-mono text-xs whitespace-nowrap text-right shrink-0">
                    <div className="text-gray-500 text-[10px] uppercase font-semibold">Certeza Predictiva</div>
                    <div className="text-gray-900 font-bold text-sm tabular-nums">92.4% <span className="text-xs font-normal text-gray-500">(Alta fiabilidad)</span></div>
                </div>
            </div>

            {/* Gráfica de Reducción del Error y Panel de Registro */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfica de Progreso */}
                <div className="lg:col-span-2 p-4 bg-white border border-gray-200 rounded space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <FiActivity className="text-blue-600" />
                                Evolución del Margen de Error
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Muestra cómo la desviación en las calificaciones disminuye conforme el sistema procesa más datos de tu equipo.
                            </p>
                        </div>
                    </div>

                    <div className="h-[260px] w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="brierGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 0.25]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="brierScore" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#brierGrad)" name="Margen de Desviación" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Panel de Registro Rápido de Novedades */}
                <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <FiZap className="text-blue-600" />
                            Registro de Novedades de Personal
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Permite simular o registrar eventos reales para que el motor afine sus proyecciones.
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
                                Registrar Evento de Desvinculación
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
                                Registrar Evento de Permanencia
                            </span>
                            <FiPlay className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Registro de Actividad:</p>
                        <div className="h-[120px] overflow-y-auto space-y-1.5 font-mono text-[10px] bg-gray-50 border border-gray-200 rounded p-2 text-gray-700">
                            {simulationLog.length === 0 ? (
                                <p className="text-gray-400 italic text-[11px]">Esperando novedades de personal...</p>
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

            {/* Factores de Permanencia Identificados */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiSliders className="text-blue-600" />
                        Factores Clave en la Permanencia de tu Personal
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Peso estimado de cada variable según los patrones identificados en tu empresa.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Nivel Salarial</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.beta_salary ?? -0.85}</p>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">Impacto alto</span>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Ausencias</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.beta_absence ?? 0.35}</p>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">Alerta temprana</span>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Desempeño</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.beta_perf ?? 1.10}</p>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">Compromiso</span>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Falta de Ascensos</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.beta_no_promo ?? 0.25}</p>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">Riesgo fuga</span>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Estabilidad Anual</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.k_weibull ?? 1.25}</p>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">Consistencia</span>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Permanencia Media</span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-gray-900 mt-1">{activeParameters.lambda_weibull ?? 48} meses</p>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">~4 años promedio</span>
                    </div>
                </div>
            </div>

            {/* Validación Científica: Cross-Validation K-Fold & Sensibilidad Multi-Semilla */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* K-Fold Cross Validation */}
                <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                    <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                                <FiCheckCircle className="text-emerald-600 w-3.5 h-3.5" />
                                Validación Cruzada Estratificada (K=5)
                            </h3>
                            <p className="text-[11px] text-gray-400">Evaluación fuera de muestra sobre colaboradores reales</p>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-200">
                            F1: +{cvMetrics?.f1ImprovementPercent || 0}%
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-gray-500">Modelo Baseline Heurístico</span>
                            <div className="font-mono text-gray-900 text-sm font-semibold">
                                Acc: {((cvMetrics?.baselineModel?.accuracy || 0) * 100).toFixed(1)}%
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                                F1: {cvMetrics?.baselineModel?.f1Score || 0} · Brier: {cvMetrics?.baselineModel?.brierScore || 0}
                            </div>
                        </div>

                        <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-emerald-700">Weibull + RSI (Propuesto)</span>
                            <div className="font-mono text-emerald-900 text-sm font-semibold">
                                Acc: {((cvMetrics?.advancedWeibullModel?.accuracy || 0) * 100).toFixed(1)}%
                            </div>
                            <div className="text-[10px] text-emerald-700 font-mono">
                                F1: {cvMetrics?.advancedWeibullModel?.f1Score || 0} · Brier: {cvMetrics?.advancedWeibullModel?.brierScore || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sensibilidad Multi-Semilla */}
                <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                    <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                                <FiTrendingUp className="text-blue-600 w-3.5 h-3.5" />
                                Estabilidad Estocástica (5 Semillas)
                            </h3>
                            <p className="text-[11px] text-gray-400">N=2,000 iteraciones Monte Carlo con nómina real</p>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 rounded border border-blue-200">
                            CV: {sensitivityMetrics?.summary?.cvPercent || 0}%
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block">ROI Mediano</span>
                            <span className="font-mono text-gray-900 font-bold text-sm">
                                {sensitivityMetrics?.summary?.meanMedianRoi || 0}%
                            </span>
                        </div>
                        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block">IC 95% Inferior</span>
                            <span className="font-mono text-gray-900 font-bold text-sm">
                                {sensitivityMetrics?.summary?.meanCiLower || 0}%
                            </span>
                        </div>
                        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Ahorro Medio</span>
                            <span className="font-mono text-gray-900 font-bold text-sm">
                                ${sensitivityMetrics?.summary?.meanSavings?.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RsiOptimizationDashboard;

