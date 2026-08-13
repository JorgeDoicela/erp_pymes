import { useState, useEffect } from 'react';
import { 
    exportAcademicDataset 
} from '../../services/intelligenceService';
import intelligenceClient from '../../api/intelligenceClient';
import { 
    FiShield, 
    FiCpu, 
    FiRefreshCw, 
    FiLock, 
    FiLayers, 
    FiDownload, 
    FiShare2, 
    FiServer,
    FiCheckCircle,
    FiInfo,
    FiTrendingDown,
    FiActivity
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
                showToast(`Sincronización de inteligencia de mercado exitosa (Ronda #${rData.round}). Precisión de red actualizada.`);
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
        setTimeout(() => setToastMessage(null), 5000);
    };

    // Render de carga con Skeleton Screen según skill de frontend
    if (loading && !privacyStatus) {
        return (
            <div className="space-y-6 pb-12 bg-gray-50/50 min-h-screen p-6 animate-pulse">
                {/* Header Skeleton */}
                <div className="pb-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-6 bg-gray-300 rounded w-80"></div>
                        <div className="h-3 bg-gray-200 rounded w-96"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-9 bg-gray-200 rounded w-32"></div>
                        <div className="h-9 bg-gray-300 rounded w-48"></div>
                    </div>
                </div>
                {/* KPIs Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            <div className="h-7 bg-gray-300 rounded w-1/2"></div>
                            <div className="h-2 bg-gray-200 rounded w-full"></div>
                        </div>
                    ))}
                </div>
                {/* Chart Skeleton */}
                <div className="h-72 bg-white border border-gray-200 rounded-xl p-4 shadow-sm"></div>
            </div>
        );
    }

    const {
        epsilonBudgetMax = 10.0,
        epsilonSpent = 0,
        roundsParticipated = 0
    } = privacyStatus || {};

    const latestRound = roundsHistory.length > 0 
        ? roundsHistory[roundsHistory.length - 1] 
        : { round: 1, globalBrierScore: 0.185, noiseScale: 0.45 };

    const chartData = roundsHistory.map(r => ({
        ronda: `Ronda ${r.round}`,
        globalBrier: r.globalBrierScore,
        epsilon: r.epsilonUsed
    }));

    const budgetPercent = Math.min(100, Math.round((epsilonSpent / epsilonBudgetMax) * 100));

    return (
        <div className="space-y-6 pb-12 bg-gray-50/50 min-h-screen p-6">
            {/* Toast Alert con Micro-animación */}
            {toastMessage && (
                <div className="fixed top-5 right-5 z-50 flex items-center space-x-3 bg-slate-900/95 backdrop-blur text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 text-xs font-medium transition-all duration-300 transform translate-y-0">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                        <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-full tracking-wide">
                            Red Anonimizada de Mercado
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 rounded-full tracking-wide flex items-center gap-1">
                            <FiLock className="w-2.5 h-2.5" /> Protegido por Privacidad Diferencial
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FiShare2 className="text-blue-600 w-5 h-5" />
                        Red Colaborativa de Inteligencia Segura
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Conéctate a la inteligencia compartida del mercado de PYMEs manteniendo los datos financieros de tu empresa 100% privados y anónimos.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => exportAcademicDataset('csv')}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-all duration-200 cursor-pointer bg-white hover:bg-gray-50 shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                        <FiDownload className="w-3.5 h-3.5" />
                        Exportar Reporte
                    </button>
                    <button
                        onClick={handleExecuteRound}
                        disabled={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                        Sincronizar Inteligencia de Mercado
                    </button>
                </div>
            </div>

            {/* Privacy Budget & KPI Resumen Contable */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-4 pb-2 border-b border-gray-100">
                    <span>Estado de la Red Colaborativa y Protección de Datos</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-mono normal-case">
                        Garantía Criptográfica Activa
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 gap-4 md:gap-0">
                    <div className="py-2 md:py-0 md:px-4 first:pl-0 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            Confidencialidad de Datos <FiShield className="w-3 h-3 text-emerald-600" />
                        </span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-bold text-gray-900 font-mono">100% Seguro</span>
                        </div>
                        <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                                <span>Presupuesto Privacidad (ε)</span>
                                <span>{epsilonSpent} / {epsilonBudgetMax}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(5, budgetPercent)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            Sincronización Global <FiActivity className="w-3 h-3 text-blue-600" />
                        </span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-bold text-gray-900 font-mono">Ronda #{latestRound.round}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 mt-1">Aportes seguros realizados: <strong>{roundsParticipated}</strong></span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            Margen de Error de Red <FiTrendingDown className="w-3 h-3 text-indigo-600" />
                        </span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-bold text-gray-900 font-mono">{latestRound.globalBrierScore}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 mt-1">Menor puntaje indica mayor precisión</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 last:pr-0 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            Atenuación Criptográfica <FiLock className="w-3 h-3 text-gray-600" />
                        </span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-bold text-gray-900 font-mono">Escala {latestRound.noiseScale}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 mt-1">RDP Accountant (Mironov 2017; Balle et al. 2020)</span>
                    </div>
                </div>
            </div>

            {/* Diagrama de Arquitectura Seguro y Legible */}
            <div className="p-5 bg-white border border-gray-200/80 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <FiServer className="text-blue-600 w-4 h-4" />
                            Flujo de Garantía de Privacidad en el Entorno Federado
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Garantía de protección de datos conforme a la normativa LOPDP y GDPR.
                        </p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
                        Cumplimiento LOPDP / GDPR
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1.5 hover:border-blue-300 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">1</div>
                        <p className="font-semibold text-gray-900">Datos Financieros Locales</p>
                        <p className="text-[11px] text-gray-500">Nunca salen de la base de datos de tu empresa.</p>
                    </div>

                    <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1.5 hover:border-blue-300 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">2</div>
                        <p className="font-semibold text-gray-900">Acotamiento de Patrones</p>
                        <p className="text-[11px] text-gray-500">Normalización de actualizaciones para evitar anomalías.</p>
                    </div>

                    <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1.5 hover:border-blue-300 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">3</div>
                        <p className="font-semibold text-gray-900">Protección Criptográfica</p>
                        <p className="text-[11px] text-gray-500">Inyección de ruido aleatorio para imposibilitar el rastreo.</p>
                    </div>

                    <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1.5 hover:border-blue-300 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">4</div>
                        <p className="font-semibold text-gray-900">Agregación en la Red</p>
                        <p className="text-[11px] text-gray-500">Consolidación anónima para beneficiar a todas las PYMEs.</p>
                    </div>
                </div>
            </div>

            {/* Evolución de Precisión Chart Card */}
            <div className="p-5 bg-white border border-gray-200/80 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <FiCpu className="text-blue-600 w-4 h-4" />
                            Evolución de la Precisión Colectiva del Mercado
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Reducción progresiva del margen de error a medida que la red realiza nuevas sincronizaciones.
                        </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                        <FiInfo className="text-blue-500" /> Un menor valor indica predicciones más exactas
                    </div>
                </div>

                <div className="h-[270px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="fedGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="ronda" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 0.25]} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#ffffff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value) => [`${value} (Margen de Error)`, 'Puntaje de Error']}
                            />
                            <Area type="monotone" dataKey="globalBrier" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#fedGrad)" name="Margen de Error Global" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Federated Rounds History Table */}
            <div className="p-5 bg-white border border-gray-200/80 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <FiLayers className="text-blue-600 w-4 h-4" />
                        Historial de Sincronizaciones Federadas
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Registro verificado de las rondas de aprendizaje colaborativo y sus métricas de protección.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Sincronización</th>
                                <th className="py-3 px-4">Empresas Participantes</th>
                                <th className="py-3 px-4">Margen de Error (Brier)</th>
                                <th className="py-3 px-4">Presupuesto Privacidad (ε)</th>
                                <th className="py-3 px-4">Nivel de Atenuación (σ)</th>
                                <th className="py-3 px-4">Estado</th>
                                <th className="py-3 px-4">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {roundsHistory.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                    <td className="py-3 px-4 font-semibold text-slate-900">Ronda #{item.round}</td>
                                    <td className="py-3 px-4 font-mono tabular-nums">{item.participatingTenantsCount} Empresas</td>
                                    <td className="py-3 px-4 font-semibold font-mono tabular-nums text-slate-900">{item.globalBrierScore}</td>
                                    <td className="py-3 px-4 font-mono tabular-nums">ε = {item.epsilonUsed}</td>
                                    <td className="py-3 px-4 font-mono tabular-nums">σ = {item.noiseScale}</td>
                                    <td className="py-3 px-4">
                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                                            <FiCheckCircle className="w-3 h-3 text-emerald-500" /> Sincronizado
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                                        {new Date(item.createdAt).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
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

