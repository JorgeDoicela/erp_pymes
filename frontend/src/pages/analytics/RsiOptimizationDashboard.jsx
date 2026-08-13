import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    getRsiMetrics, 
    calibrateRsiModel, 
    simulateRsiOutcome, 
    exportAcademicDataset 
} from '../../services/intelligenceService';
import { 
    FiActivity, 
    FiZap, 
    FiTrendingDown, 
    FiCheckCircle, 
    FiRefreshCw, 
    FiPlay, 
    FiDownload, 
    FiSliders, 
    FiCpu, 
    FiLayers, 
    FiArrowUpRight,
    FiUserX,
    FiUserCheck
} from 'react-icons/fi';
import { 
    LineChart, 
    Line, 
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
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <FiRefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm font-medium text-slate-400">Cargando Motor de Automejora Recursiva (RSI Engine)...</p>
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

    return (
        <div className="space-y-6 pb-12">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-lg shadow-2xl animate-fade-in text-xs font-mono">
                    <FiZap className="w-4 h-4 text-amber-400 animate-bounce" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header ERP con Badges Científicos */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded uppercase tracking-wider">
                            RSI Engine v2.4
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Closed-Loop Calibration Active
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <FiCpu className="text-indigo-600 dark:text-indigo-400" />
                        Motor de Automejora Recursiva (RSI Engine)
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Bucle dinámico de auto-calibración y optimización estocástica de modelos de riesgo laboral en tiempo real.
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
                    <button
                        onClick={handleCalibrate}
                        disabled={actionLoading}
                        className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                        Ejecutar Época RSI
                    </button>
                </div>
            </div>

            {/* KPI Cards Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>Época de Calibración</span>
                        <FiLayers className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">Época {currentEpoch}</span>
                        <span className="text-[11px] text-emerald-600 font-semibold">Reciente</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Modelo auto-calibrado dinámicamente</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>Pérdida Brier (MSE)</span>
                        <FiTrendingDown className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{currentBrierScore}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded">
                            {currentBrierScore < 0.10 ? 'Excelente' : 'Aceptable'}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Log-Loss actual: {currentLogLoss}</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>Mejora Acumulada</span>
                        <FiArrowUpRight className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{improvementPercentage}%</span>
                        <span className="text-[11px] text-slate-500">vs Época 1</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Reducción continua de margen de error</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>Muestras Auditadas</span>
                        <FiCheckCircle className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalAuditedPredictions}</span>
                        <span className="text-[11px] text-slate-500">({resolvedOutcomeCount} resueltas)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Predicciones en registro inmutable</p>
                </div>
            </div>

            {/* Learning Curve Chart & Workbench Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left (2 cols): Learning Curve (Brier Reduction Chart) */}
                <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FiActivity className="text-indigo-500" />
                                Curva de Aprendizaje de Automejora (Reducción de Brier Loss)
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Demostración de la minimización estocástica del error a lo largo de las épocas RSI.
                            </p>
                        </div>
                    </div>

                    <div className="h-[280px] w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="brierGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 0.25]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="brierScore" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#brierGrad)" name="Brier Score (MSE)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right (1 col): Live Simulation Workbench */}
                <div className="p-5 bg-slate-900 text-white border border-slate-800 rounded-xl shadow-xl space-y-4">
                    <div>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
                            Congreso Demo Workbench
                        </span>
                        <h2 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                            <FiZap className="text-amber-400 animate-pulse" />
                            Banco de Simulación en Vivo
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Simula desenlaces reales de empleados y observa la automejora del modelo en tiempo real.
                        </p>
                    </div>

                    <div className="space-y-2 pt-2">
                        <button
                            onClick={() => handleSimulate(1)}
                            disabled={actionLoading}
                            className="w-full py-2.5 px-3 bg-red-600/30 hover:bg-red-600/40 border border-red-500/40 text-red-200 text-xs font-semibold rounded-lg transition-all flex items-center justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <FiUserX className="text-red-400" />
                                Simular Renuncia / Fuga (Outcome = 1)
                            </span>
                            <FiPlay className="w-3.5 h-3.5 text-red-400" />
                        </button>

                        <button
                            onClick={() => handleSimulate(0)}
                            disabled={actionLoading}
                            className="w-full py-2.5 px-3 bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 text-xs font-semibold rounded-lg transition-all flex items-center justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <FiUserCheck className="text-emerald-400" />
                                Simular Permanencia Exitosa (Outcome = 0)
                            </span>
                            <FiPlay className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                        <p className="text-[11px] font-mono text-slate-400 mb-2">Logs de Automejora en Tiempo Real:</p>
                        <div className="h-[120px] overflow-y-auto space-y-1.5 font-mono text-[10px] text-slate-300 pr-1">
                            {simulationLog.length === 0 ? (
                                <p className="text-slate-500 italic text-[11px]">Listo para simulaciones en vivo...</p>
                            ) : (
                                simulationLog.map((log, idx) => (
                                    <div key={idx} className="p-1.5 bg-slate-950/80 rounded border border-slate-800 text-[10px]">
                                        <span className="text-slate-500">[{log.time}]</span>{' '}
                                        <span className={log.type === 'RESIGNATION' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                                            {log.message}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Calibrated Hyperparameters Matrix */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FiSliders className="text-indigo-500" />
                            Matriz de Hiperparámetros Calibrados (Vector β & Parámetros Weibull)
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Pesos re-calculados automáticamente por el optimizador estocástico en la última época.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="text-[10px] font-mono text-slate-400">β_salary (Salario)</span>
                        <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">{activeParameters.beta_salary ?? -0.85}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="text-[10px] font-mono text-slate-400">β_absence (Ausencia)</span>
                        <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">{activeParameters.beta_absence ?? 0.35}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="text-[10px] font-mono text-slate-400">β_perf (Desempeño)</span>
                        <p className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">{activeParameters.beta_perf ?? 1.10}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="text-[10px] font-mono text-slate-400">β_no_promo (Ascenso)</span>
                        <p className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400">{activeParameters.beta_no_promo ?? 0.25}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="text-[10px] font-mono text-slate-400">k_weibull (Forma)</span>
                        <p className="text-base font-bold font-mono text-purple-600 dark:text-purple-400">{activeParameters.k_weibull ?? 1.25}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="text-[10px] font-mono text-slate-400">λ_weibull (Escala)</span>
                        <p className="text-base font-bold font-mono text-pink-600 dark:text-pink-400">{activeParameters.lambda_weibull ?? 48}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RsiOptimizationDashboard;
