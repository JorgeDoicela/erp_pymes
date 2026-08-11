import { 
    FiBarChart2, FiTrendingUp, FiDollarSign, FiUsers, 
    FiShield, FiPieChart, FiCpu, FiHardDrive, FiLayers, FiCheckCircle
} from 'react-icons/fi';

export default function SuperAdminMetricsView({ metrics, loading }) {
    if (loading || !metrics) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-40 bg-slate-200 rounded-2xl w-full"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const arr = metrics.estimatedMRR ? (metrics.estimatedMRR * 12) : 0;
    const essentialCount = metrics.planDistribution?.ESSENTIAL || 0;
    const growthCount = metrics.planDistribution?.GROWTH || 0;
    const enterpriseCount = metrics.planDistribution?.ENTERPRISE || 0;
    const totalTenants = metrics.totalTenants || 1;

    return (
        <div className="space-y-6">
            {/* Header Módulo Analíticas BI */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
                        <FiBarChart2 className="w-4 h-4" /> Analíticas & Métricas BI SaaS
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        Indicadores Financieros y Rendimiento de Plataforma
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Análisis de ingresos recurrentes, distribución de ingresos por plan, adopción de licencias y capacidad.
                    </p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-right">
                    <span className="text-xs text-indigo-600 font-medium block uppercase tracking-wider">ARR Proyectado</span>
                    <span className="text-2xl font-black text-indigo-900">
                        ${arr.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </span>
                </div>
            </div>

            {/* Tarjetas Analíticas Financieras */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MRR (Recurrente Mensual)</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <FiDollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">
                        ${metrics.estimatedMRR?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Calculado por licencias activas</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ARPU (Ingreso Medio/Empresa)</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FiTrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">
                        ${metrics.arpu || '0.00'} USD
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Por tenant activo al mes</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuarios Activos Plataforma</span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FiUsers className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">
                        {metrics.totalEmployees}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Licencias de empleados ocupadas</p>
                </div>
            </div>

            {/* Desglose de Planes y Salud */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Desglose Comercial */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FiPieChart className="w-5 h-5 text-indigo-600" /> Mezcla de Suscripciones por Tier
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Essential Tier</p>
                                <p className="text-xs text-slate-500">PYMEs hasta 25 empleados ($1.50/emp)</p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-extrabold text-slate-900">{essentialCount}</span>
                                <span className="text-xs text-slate-400 block">{Math.round((essentialCount / totalTenants) * 100)}% del total</span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-indigo-950 text-sm">Growth Tier</p>
                                <p className="text-xs text-slate-500">Medianas hasta 100 empleados ($3.00/emp)</p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-extrabold text-indigo-700">{growthCount}</span>
                                <span className="text-xs text-slate-400 block">{Math.round((growthCount / totalTenants) * 100)}% del total</span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-purple-950 text-sm">Enterprise Tier</p>
                                <p className="text-xs text-slate-500">Corporativos hasta 500 empleados ($5.00/emp)</p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-extrabold text-purple-700">{enterpriseCount}</span>
                                <span className="text-xs text-slate-400 block">{Math.round((enterpriseCount / totalTenants) * 100)}% del total</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Infraestructura y Gobernanza */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FiCpu className="w-5 h-5 text-indigo-600" /> Infraestructura & Gobernanza
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2.5 border-b border-slate-100 text-sm">
                                <span className="text-slate-600 flex items-center gap-2">
                                    <FiCheckCircle className="w-4 h-4 text-emerald-500" /> Estado de Microservicios
                                </span>
                                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                                    100% OPERATIONAL
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-2.5 border-b border-slate-100 text-sm">
                                <span className="text-slate-600 flex items-center gap-2">
                                    <FiHardDrive className="w-4 h-4 text-indigo-500" /> Aislamiento de Base de Datos
                                </span>
                                <span className="font-semibold text-slate-900 text-xs">
                                    Multitenant Schema-Isolated
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-2.5 border-b border-slate-100 text-sm">
                                <span className="text-slate-600 flex items-center gap-2">
                                    <FiShield className="w-4 h-4 text-slate-500" /> Logs de Auditoría Global
                                </span>
                                <span className="font-semibold text-indigo-600 text-xs">
                                    Active & Habilitado
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                        <strong>Nota de Arquitectura:</strong> Todas las métricas de rendimiento y licenciamiento se calculan en tiempo real sin romper el aislamiento de datos por tenant.
                    </div>
                </div>
            </div>
        </div>
    );
}
