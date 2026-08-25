import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    FiActivity,
    FiArrowLeft,
    FiBookOpen
} from 'react-icons/fi';
import AnalyticsMethodologyModal from '../../components/analytics/AnalyticsMethodologyModal';
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
    const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

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
            console.error('Error al cargar benchmarking federado:', error);
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
                showToast(`Sincronización con el mercado exitosa (Ronda #${rData.round}). Tendencias actualizadas.`);
                await loadData();
            }
        } catch (error) {
            console.error('Error al sincronizar tendencias:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 5000);
    };

    if (loading && !privacyStatus) {
        return (
            <div className="p-12 text-center text-gray-400 text-xs font-mono">
                Cargando tendencias y benchmarking de mercado...
            </div>
        );
    }

    if (!privacyStatus) {
        return (
            <div className="p-12 text-center space-y-3 bg-white rounded border border-gray-200">
                <p className="text-sm font-semibold text-gray-700">Sin datos de sincronización disponibles</p>
                <p className="text-xs text-gray-500">Ejecuta la primera sincronización con el mercado para activar el benchmarking federado.</p>
                <button
                    onClick={handleExecuteRound}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded transition-colors cursor-pointer shadow-xs"
                >
                    Sincronizar con el Mercado
                </button>
            </div>
        );
    }

    const {
        epsilonSpent = 0,
        epsilonBudgetMax = 10,
        roundsParticipated = 0,
        latestRound = null
    } = privacyStatus || {};

    const chartData = roundsHistory.map(r => ({
        ronda: `Ronda ${r.round}`,
        globalBrier: r.globalBrierScore,
        epsilon: r.epsilonUsed
    }));

    const budgetPercent = Math.min(100, Math.round((epsilonSpent / epsilonBudgetMax) * 100));

    return (
        <div className="space-y-6">
            {/* Toast Alert */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded shadow-xl text-xs font-mono flex items-center gap-2 border border-gray-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{toastMessage}</span>
                </div>
            )}

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
                            Comparativa de Mercado
                        </span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Benchmarking & Aprendizaje Federado (Differential Privacy)
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Compara métricas salariales y de retención contra tendencias del sector PYME de forma anónima y segura.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
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
                        <span>Ficha Técnica</span>
                    </button>
                    <button
                        onClick={() => exportAcademicDataset('csv')}
                        className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                        <FiDownload className="w-3.5 h-3.5" />
                        <span>Exportar Reporte</span>
                    </button>
                    <button
                        onClick={handleExecuteRound}
                        disabled={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                        <span>Sincronizar Mercado</span>
                    </button>
                </div>
            </div>

            {/* Modal de Ficha Técnica Contextual */}
            <AnalyticsMethodologyModal
                isOpen={isMethodologyOpen}
                onClose={() => setIsMethodologyOpen(false)}
                defaultSection="federated"
            />

            {/* Resumen de Estado de la Red Estilo Informe Contable */}
            <div className="bg-white border border-gray-200 rounded p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">
                    Estado de la Red Colaborativa y Protección de Datos
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    <div className="py-2 md:py-0 md:px-4 first:pl-0 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Privacidad de Salarios</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono">100% Protegido</span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">Ninguna empresa ve tus nóminas</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Última Sincronización</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono">
                                {latestRound ? `Ronda #${latestRound.round}` : '—'}
                            </span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">Aportes seguros: {roundsParticipated}</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Margen de Error del Mercado</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">
                                {latestRound ? latestRound.globalBrierScore : '—'}
                            </span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1">A menor valor, mayor exactitud</span>
                    </div>

                    <div className="py-2 md:py-0 md:px-4 last:pr-0 flex flex-col justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Normativa y Cumplimiento</span>
                        <div className="mt-1 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-emerald-700 font-mono">LOPDP / GDPR</span>
                        </div>
                        <span className="text-[11px] text-emerald-600 mt-1">Criptográficamente certificado</span>
                    </div>
                </div>
            </div>

            {/* Explicación de Privacidad y Negocio */}
            <div className="bg-white border border-gray-200 rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            ¿Cómo funciona la privacidad colaborativa?
                        </span>
                        <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Cero Riesgo de Filtración
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-4xl">
                        Tus datos contables y nombres de colaboradores <strong>nunca salen de tu servidor</strong>. El sistema solo comparte promedios estadísticos matemáticamente anonimizados para que puedas saber si tus salarios y tasas de retención son competitivos frente al resto del mercado.
                    </p>
                </div>
                <div className="bg-gray-50 rounded p-2.5 border border-gray-200 font-mono text-xs whitespace-nowrap text-right shrink-0">
                    <div className="text-gray-500 text-[10px] uppercase font-semibold">Garantía Activa</div>
                    <div className="text-emerald-700 font-bold text-sm">Protegido</div>
                </div>
            </div>

            {/* Diagrama de 4 Pasos Sencillo */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                <div className="border-b border-gray-100 pb-2">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiServer className="text-blue-600" />
                        Garantía de Protección de Datos en 4 Pasos
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <div className="w-5 h-5 rounded bg-gray-200 text-gray-800 flex items-center justify-center font-bold text-xs font-mono">1</div>
                        <p className="font-semibold text-gray-900">Datos Financieros Locales</p>
                        <p className="text-[11px] text-gray-500">Permanecen únicamente en la base de datos de tu empresa.</p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <div className="w-5 h-5 rounded bg-gray-200 text-gray-800 flex items-center justify-center font-bold text-xs font-mono">2</div>
                        <p className="font-semibold text-gray-900">Anonimización Estadística</p>
                        <p className="text-[11px] text-gray-500">Se extraen únicamente patrones numéricos sin nombres ni montos individuales.</p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <div className="w-5 h-5 rounded bg-gray-200 text-gray-800 flex items-center justify-center font-bold text-xs font-mono">3</div>
                        <p className="font-semibold text-gray-900">Blindaje de Privacidad</p>
                        <p className="text-[11px] text-gray-500">Se aplica protección criptográfica para imposibilitar cualquier rastreo.</p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                        <div className="w-5 h-5 rounded bg-gray-200 text-gray-800 flex items-center justify-center font-bold text-xs font-mono">4</div>
                        <p className="font-semibold text-gray-900">Beneficio Colectivo</p>
                        <p className="text-[11px] text-gray-500">Todas las empresas asociadas acceden a métricas reales del mercado.</p>
                    </div>
                </div>
            </div>

            {/* Evolución de la Precisión Colectiva */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <FiCpu className="text-blue-600" />
                            Evolución de la Precisión Colectiva del Mercado
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Muestra cómo el margen de error disminuye conforme se incorporan más empresas a la red colaborativa.
                        </p>
                    </div>
                </div>

                <div className="h-[240px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="fedGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="ronda" tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 0.25]} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="globalBrier" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#fedGrad)" name="Margen de Error Global" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Historial de Sincronizaciones */}
            <div className="p-4 bg-white border border-gray-200 rounded space-y-4">
                <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FiLayers className="text-blue-600" />
                        Historial de Sincronizaciones de Mercado
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Registro de rondas de actualización estadística completadas con éxito.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Sincronización</th>
                                <th className="py-2.5 px-4">Empresas Participantes</th>
                                <th className="py-2.5 px-4">Margen de Error Residual</th>
                                <th className="py-2.5 px-4">Protección de Datos</th>
                                <th className="py-2.5 px-4">Estado</th>
                                <th className="py-2.5 px-4">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {roundsHistory.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                                    <td className="py-2.5 px-4 font-semibold text-gray-900">Ronda #{item.round}</td>
                                    <td className="py-2.5 px-4 font-mono tabular-nums">{item.participatingTenantsCount} Empresas</td>
                                    <td className="py-2.5 px-4 font-semibold font-mono tabular-nums text-gray-900">{item.globalBrierScore}</td>
                                    <td className="py-2.5 px-4 font-mono text-[11px] text-gray-600">100% Protegido</td>
                                    <td className="py-2.5 px-4">
                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[10px] px-2 py-0.5 rounded">
                                            Sincronizado
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-gray-400 font-mono text-[11px]">
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
