import { useState, useEffect } from 'react';
import { 
    getRsiMetrics, 
    exportAcademicDataset 
} from '../../services/intelligenceService';
import intelligenceClient from '../../api/intelligenceClient';
import { 
    FiShield, 
    FiCpu, 
    FiTrendingDown, 
    FiCheckCircle, 
    FiRefreshCw, 
    FiLock, 
    FiLayers, 
    FiDownload, 
    FiZap, 
    FiShare2, 
    FiServer, 
    FiKey,
    FiArrowRight
} from 'react-icons/fi';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

const FederatedLearningDashboard = () => {
    const [privacyStatus, setPrivacyStatus] = useState(null);
    const [roundsHistory, setRoundsHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [resStatus, resHistory] = await Promise.all([
                intelligenceClient.get('/federated/status'),
                intelligenceClient.get('/federated/rounds-history')
            ]);

            if (resStatus.data?.success) setPrivacyStatus(resStatus.data.data);
            if (resHistory.data?.success) setRoundsHistory(resHistory.data.data);
        } catch (error) {
            console.error('Error al cargar aprendizaje federado:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteRound = async () => {
        try {
            setActionLoading(true);
            const res = await intelligenceClient.post('/federated/round');
            if (res.data?.success) {
                const rData = res.data.data;
                showToast(`Ronda Federada #${rData.round} ejecutada con éxito. FedAvg Brier Loss: ${rData.globalBrierScore} (Ruido σ=${rData.noiseScale})`);
                await loadData();
            }
        } catch (error) {
            console.error('Error al ejecutar ronda federada:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4500);
    };

    if (loading && !privacyStatus) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <FiLock className="w-8 h-8 text-emerald-500 animate-pulse" />
                <p className="text-sm font-medium text-slate-400">Verificando Presupuesto de Privacidad Diferencial (DP-SGD)...</p>
            </div>
        );
    }

    const {
        epsilonBudgetMax = 10.0,
        epsilonSpent = 0,
        epsilonRemaining = 10.0,
        delta = 1e-5,
        roundsParticipated = 0,
        privacyGuarantee = ''
    } = privacyStatus || {};

    const latestRound = roundsHistory.length > 0 ? roundsHistory[roundsHistory.length - 1] : { round: 1, globalBrierScore: 0.185, noiseScale: 0.45 };

    const chartData = roundsHistory.map(r => ({
        ronda: `Ronda ${r.round}`,
        globalBrier: r.globalBrierScore,
        epsilon: r.epsilonUsed
    }));

    const budgetPercent = Math.min(100, Math.round((epsilonSpent / epsilonBudgetMax) * 100));

    return (
        <div className="space-y-6 pb-12">
            {/* Toast Alert */}
            {toastMessage && (
                <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 bg-emerald-950 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-lg shadow-2xl animate-fade-in text-xs font-mono">
                    <FiShield className="w-4 h-4 text-emerald-400 animate-bounce" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header ERP */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded uppercase tracking-wider">
                            FedAvg + DP-SGD v3.1
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded uppercase tracking-wider flex items-center gap-1">
                            <FiLock className="w-3 h-3 text-indigo-400" />
                            LOPDP & GDPR Compliant
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <FiShare2 className="text-emerald-600 dark:text-emerald-400" />
                        Aprendizaje Federado con Privacidad Diferencial
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Colaboración inter-empresarial en entrenamiento de meta-modelos de IA sin exponer datos privados de empleados.
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
                        onClick={handleExecuteRound}
                        disabled={actionLoading}
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                        Ejecutar Ronda Federada
                    </button>
                </div>
            </div>

            {/* Privacy Budget & KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>Presupuesto Privacidad (ε)</span>
                        <FiLock className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">ε = {epsilonSpent}</span>
                        <span className="text-xs text-slate-500">/ {epsilonBudgetMax}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${budgetPercent}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400">Garantía δ = {delta} (Strict Zero-Leak)</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>Ronda Global Activa</span>
                        <FiLayers className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">Ronda #{latestRound.round}</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 font-semibold">FedAvg Aggregate</p>
                    <p className="text-[10px] text-slate-400">Participación: {roundsParticipated} aportes</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>Pérdida Global Brier</span>
                        <FiTrendingDown className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{latestRound.globalBrierScore}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded">
                            Meta-Model
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Error global reducido inter-empresas</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>Escala de Ruido (σ)</span>
                        <FiShield className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">σ = {latestRound.noiseScale}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Inyección Gaussiana en Gradiente</p>
                </div>
            </div>

            {/* Privacy-Preserving Architecture Diagram Card */}
            <div className="p-5 bg-slate-950 text-white border border-slate-800 rounded-xl shadow-xl space-y-4">
                <div>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded uppercase">
                        Flujo de Datos Seguro LOPDP / GDPR
                    </span>
                    <h2 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                        <FiServer className="text-emerald-400" />
                        Arquitectura de Entrenamiento Federado con Inyección de Ruido
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-center text-xs">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                        <div className="w-7 h-7 mx-auto rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">1</div>
                        <p className="font-semibold text-slate-200">Datos Locales Tenant</p>
                        <p className="text-[10px] text-slate-400">Salarios y PII 100% aislados en PostgreSQL</p>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                        <div className="w-7 h-7 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">2</div>
                        <p className="font-semibold text-slate-200">Clipping de Gradiente L2</p>
                        <p className="text-[10px] text-slate-400">Acotamiento de sensibilidad (||g|| ≤ 1.0)</p>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                        <div className="w-7 h-7 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">3</div>
                        <p className="font-semibold text-slate-200">Inyección Ruido DP-SGD</p>
                        <p className="text-[10px] text-slate-400">Adición Gaussiana N(0, σ² C²)</p>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                        <div className="w-7 h-7 mx-auto rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">4</div>
                        <p className="font-semibold text-slate-200">FedAvg Hub Central</p>
                        <p className="text-[10px] text-slate-400">Agregación θ global sin ver salarios</p>
                    </div>
                </div>
            </div>

            {/* Global Meta-Model Learning Curve Chart */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FiCpu className="text-emerald-500" />
                            Evolución de Precisión del Meta-Modelo Global (FedAvg Brier Loss)
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Mejora progresiva de precisión del modelo global a medida que las empresas colaboran sin compartir datos.
                        </p>
                    </div>
                </div>

                <div className="h-[260px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="fedGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="ronda" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 0.25]} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="globalBrier" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#fedGrad)" name="Brier Loss Global" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Federated Rounds History Table */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FiLayers className="text-emerald-500" />
                            Historial de Rondas Globale de Entrenamiento Federado
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Registro inmutable de rondas de agregación FedAvg con parámetros DP ($\epsilon, \sigma$).
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold">
                                <th className="p-3">Ronda #</th>
                                <th className="p-3">Empresas Participantes</th>
                                <th className="p-3">Brier Loss Global</th>
                                <th className="p-3">Épsilon Usado (ε)</th>
                                <th className="p-3">Escala Ruido (σ)</th>
                                <th className="p-3">Estado</th>
                                <th className="p-3">Fecha Ronda</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {roundsHistory.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                                    <td className="p-3 font-bold text-slate-900 dark:text-white">Ronda #{item.round}</td>
                                    <td className="p-3 font-mono">{item.participatingTenantsCount} Tenants</td>
                                    <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">{item.globalBrierScore}</td>
                                    <td className="p-3 font-mono">ε = {item.epsilonUsed}</td>
                                    <td className="p-3 font-mono text-amber-600">σ = {item.noiseScale}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-mono text-[10px]">
                                            COMPLETED
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-400 font-mono text-[11px]">{new Date(item.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FederatedLearningDashboard;
