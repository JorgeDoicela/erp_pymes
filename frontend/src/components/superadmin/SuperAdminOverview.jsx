import { useNavigate } from 'react-router-dom';
import { 
    FiShield, FiTrendingUp, FiUsers, FiClock, FiAlertTriangle, 
    FiCheckCircle, FiDollarSign, FiPlusCircle, FiBarChart2, FiArrowRight, FiActivity
} from 'react-icons/fi';

export default function SuperAdminOverview({ metrics, loading }) {
    const navigate = useNavigate();

    if (loading || !metrics) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Banner de Bienvenida Backoffice */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
                        <FiShield className="w-4 h-4" /> Plano de Control SaaS · Backoffice General
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Panel de Administración SaaS
                    </h2>
                    <p className="text-sm text-slate-300 mt-1 max-w-xl">
                        Visión ejecutiva de clientes multitenant, ingresos recurrentes (MRR), licenciamiento y estado operativo global del sistema.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => navigate('/register-company')}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-xs transition-all flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <FiPlusCircle className="w-4 h-4" /> Nueva Empresa
                    </button>
                    <button
                        onClick={() => navigate('/superadmin/tenants')}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all flex items-center gap-2 text-sm backdrop-blur-xs cursor-pointer"
                    >
                        Ver Empresas <FiArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* KPIs Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MRR Estimado</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                            ${metrics.estimatedMRR?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                            <FiTrendingUp className="w-3.5 h-3.5" /> ARPU: ${metrics.arpu || '0.00'}/empresa
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <FiDollarSign className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresas Contratantes</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                            {metrics.totalTenants}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            <span className="text-indigo-600 font-semibold">{metrics.activeTenants} activas</span> · {metrics.trialTenants} en prueba
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <FiUsers className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Licencias Activas</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                            {metrics.totalEmployees}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Empleados en la plataforma</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <FiActivity className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pruebas por Vencer</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">
                            {metrics.expiringTrialsCount}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Vencimiento en &lt; 7 días</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <FiClock className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Grid Secciones de Información */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Alertas de Pruebas por Vencer */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FiAlertTriangle className="w-5 h-5 text-amber-500" />
                            <h3 className="text-base font-bold text-slate-900">Empresas con Trial Próximo a Vencer</h3>
                        </div>
                        <button
                            onClick={() => navigate('/superadmin/tenants')}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                        >
                            Ver todas
                        </button>
                    </div>

                    {metrics.expiringTrials && metrics.expiringTrials.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {metrics.expiringTrials.map((t) => (
                                <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{t.name}</p>
                                        <p className="text-xs text-slate-500">Plan {t.plan} · {t.employeeCount} empleados</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                            Vence: {new Date(t.trialEndsAt).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={() => navigate('/superadmin/tenants')}
                                            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                                        >
                                            Gestionar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-400 text-sm">
                            <FiCheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            No hay trials con vencimiento próximo en este momento.
                        </div>
                    )}
                </div>

                {/* Distribución por Plan SaaS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <FiBarChart2 className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-base font-bold text-slate-900">Distribución por Plan</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-600">Plan Essential ($1.50/emp)</span>
                                    <span className="text-slate-900">{metrics.planDistribution?.ESSENTIAL || 0} empresas</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-blue-500 h-full rounded-full" 
                                        style={{ width: `${metrics.totalTenants > 0 ? ((metrics.planDistribution?.ESSENTIAL || 0) / metrics.totalTenants) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-600">Plan Growth ($3.00/emp)</span>
                                    <span className="text-slate-900">{metrics.planDistribution?.GROWTH || 0} empresas</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-indigo-600 h-full rounded-full" 
                                        style={{ width: `${metrics.totalTenants > 0 ? ((metrics.planDistribution?.GROWTH || 0) / metrics.totalTenants) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-600">Plan Enterprise ($5.00/emp)</span>
                                    <span className="text-slate-900">{metrics.planDistribution?.ENTERPRISE || 0} empresas</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-purple-600 h-full rounded-full" 
                                        style={{ width: `${metrics.totalTenants > 0 ? ((metrics.planDistribution?.ENTERPRISE || 0) / metrics.totalTenants) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Salud del Sistema</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {metrics.systemHealth}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
