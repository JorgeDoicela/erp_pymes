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
    FiServer
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
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 bg-gray-50">
                <FiLock className="w-6 h-6 text-gray-500 animate-spin" />
                <p className="text-xs font-medium text-gray-500">Verificando Presupuesto de Privacidad Diferencial (DP-SGD)...</p>
            </div>
        );
    }

    const {
        epsilonBudgetMax = 10.0,
        epsilonSpent = 0,
        roundsParticipated = 0
    } = privacyStatus || {};

    const latestRound = roundsHistory.length > 0 ? roundsHistory[roundsHistory.length - 1] : { round: 1, globalBrierScore: 0.185, noiseScale: 0.45 };

    const chartData = roundsHistory.map(r => ({
        ronda: `Ronda ${r.round}`,
        globalBrier: r.globalBrierScore,
        epsilon: r.epsilonUsed
    }));

    const budgetPercent = Math.min(100, Math.round((epsilonSpent / epsilonBudgetMax) * 100));

    return (
        <div className="space-y-6 pb-12 bg-gray-50 min-h-screen p-6">
            {/* Toast Alert */}
            {toastMessage && (
                <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 bg-gray-900 text-white px-4 py-2.5 rounded text-xs font-mono border border-gray-800">
                    <FiShield className="w-4 h-4 text-blue-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded uppercase tracking-wider font-mono">
                            FedAvg + DP-SGD v3.1
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded uppercase tracking-wider font-mono">
                            LOPDP & GDPR Compliant
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FiShare2 className="text-blue-600" />
                        Aprendizaje Federado con Privacidad Diferencial
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Colaboración inter-empresarial en entrenamiento de meta-modelos de IA sin exponer datos privados de empleados.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportAcademicDataset('csv')}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer bg-white flex items-center gap-1.5"
                    >
                        <FiDownload className="w-3.5 h-3.5" />
                        Exportar Dataset
                    </button>
                    <button
                        onClick={handleExecuteRound}
                        disabled={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                        Ejecutar Ronda Federada
                    </button>
                </div>
            </div>

            {/* Privacy Budget & KPI Resumen Contable */}
            <div className="bg-white border border-gray-200 rounded p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">
                    Estado de Red Federada y Presupuesto de Privacidad
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    <div className="py-2 md:py-0 md:px-4 first:pl-0 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Presupuesto Privacidad (ε)</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">ε = {epsilonSpent}</span>
                            <span className="text-xs text-gray-400 font-mono">/ {epsilonBudgetMax}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mt-1.5">
                            <div className="bg-gray-800 h-1.5 rounded-full" style={{ width: `${budgetPercent}%` }}></div>
                        </div>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Ronda Global Activa</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">Ronda #{latestRound.round}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">Participación: {roundsParticipated} aportes</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Pérdida Global Brier</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">{latestRound.globalBrierScore}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">Error global meta-modelo</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 last:pr-0 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Escala de Ruido (σ)</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">σ = {latestRound.noiseScale}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">Inyección Gaussiana DP-SGD</span>
                    </div>
                </div>
            </div>

            {/* Privacy-Preserving Architecture Diagram Card */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                <div className="border-b border-gray-100 pb-3">
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-200 rounded uppercase">
                        Flujo de Datos LOPDP / GDPR
                    </span>
                    <h2 className="text-sm font-semibold text-gray-900 mt-2 flex items-center gap-2">
                        <FiServer className="text-blue-600" />
                        Arquitectura de Entrenamiento Federado con Inyección de Ruido
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <div className="w-6 h-6 mx-auto rounded bg-gray-200 text-gray-800 flex items-center justify-center font-mono font-semibold text-xs">1</div>
                        <p className="font-semibold text-gray-900">Datos Locales Tenant</p>
                        <p className="text-[11px] text-gray-500">Aislados en base local</p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <div className="w-6 h-6 mx-auto rounded bg-gray-200 text-gray-800 flex items-center justify-center font-mono font-semibold text-xs">2</div>
                        <p className="font-semibold text-gray-900">Clipping Gradiente L2</p>
                        <p className="text-[11px] text-gray-500">Acotamiento ||g|| ≤ 1.0</p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <div className="w-6 h-6 mx-auto rounded bg-gray-200 text-gray-800 flex items-center justify-center font-mono font-semibold text-xs">3</div>
                        <p className="font-semibold text-gray-900">Inyección Ruido DP-SGD</p>
                        <p className="text-[11px] text-gray-500">Adición N(0, σ² C²)</p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <div className="w-6 h-6 mx-auto rounded bg-gray-200 text-gray-800 flex items-center justify-center font-mono font-semibold text-xs">4</div>
                        <p className="font-semibold text-gray-900">FedAvg Hub Central</p>
                        <p className="text-[11px] text-gray-500">Agregación θ global</p>
                    </div>
                </div>
            </div>

            {/* Global Meta-Model Learning Curve Chart */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiCpu className="text-blue-600" />
                        Evolución de Precisión del Meta-Modelo Global (FedAvg Brier Loss)
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Mejora progresiva de precisión del modelo global a medida que se agregan rondas.
                    </p>
                </div>

                <div className="h-[260px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="fedGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="ronda" tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 0.25]} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="globalBrier" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#fedGrad)" name="Brier Loss Global" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Federated Rounds History Table */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiLayers className="text-blue-600" />
                        Historial de Rondas Globales de Entrenamiento Federado
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Registro inmutable de rondas de agregación FedAvg con parámetros DP.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Ronda #</th>
                                <th className="py-2.5 px-4">Empresas Participantes</th>
                                <th className="py-2.5 px-4">Brier Loss Global</th>
                                <th className="py-2.5 px-4">Épsilon Usado (ε)</th>
                                <th className="py-2.5 px-4">Escala Ruido (σ)</th>
                                <th className="py-2.5 px-4">Estado</th>
                                <th className="py-2.5 px-4">Fecha Ronda</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {roundsHistory.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                                    <td className="py-2.5 px-4 font-semibold text-gray-900">Ronda #{item.round}</td>
                                    <td className="py-2.5 px-4 font-mono tabular-nums">{item.participatingTenantsCount} Tenants</td>
                                    <td className="py-2.5 px-4 font-semibold font-mono tabular-nums text-gray-900">{item.globalBrierScore}</td>
                                    <td className="py-2.5 px-4 font-mono tabular-nums">ε = {item.epsilonUsed}</td>
                                    <td className="py-2.5 px-4 font-mono tabular-nums">σ = {item.noiseScale}</td>
                                    <td className="py-2.5 px-4">
                                        <span className="bg-gray-100 border border-gray-200 text-gray-700 font-mono text-[10px] px-2 py-0.5 rounded">
                                            COMPLETED
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-gray-400 font-mono text-[11px]">{new Date(item.createdAt).toLocaleDateString()}</td>
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
