import { useNavigate } from 'react-router-dom';

export default function SuperAdminOverview({ metrics, loading }) {
    const navigate = useNavigate();

    if (loading || !metrics) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-16 bg-gray-100 rounded w-full" />
                <div className="h-32 bg-gray-100 rounded w-full" />
            </div>
        );
    }

    const arr = ((metrics.estimatedMRR || 0) * 12);

    return (
        <div className="space-y-5">
            {/* Encabezado limpio */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Backoffice · Control SaaS</p>
                    <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => navigate('/register-company')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Registrar empresa
                    </button>
                    <button
                        onClick={() => navigate('/superadmin/tenants')}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Ver directorio
                    </button>
                </div>
            </div>

            {/* Contenido: alertas + distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Trials próximos a vencer */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-800">Períodos de prueba por vencer</h3>
                        <button
                            onClick={() => navigate('/superadmin/tenants')}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                        >
                            Ver directorio
                        </button>
                    </div>

                    {metrics.expiringTrials && metrics.expiringTrials.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {metrics.expiringTrials.map((t) => (
                                <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{t.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Plan {t.plan} · {t.employeeCount} empleados</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                            {new Date(t.trialEndsAt).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={() => navigate('/superadmin/tenants')}
                                            className="text-xs text-gray-600 hover:text-gray-900 font-medium border border-gray-200 hover:border-gray-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                                        >
                                            Gestionar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-5 py-8 text-center text-gray-400 text-sm">
                            Sin períodos de prueba próximos a vencer.
                        </div>
                    )}
                </div>

                {/* Panel lateral: resumen financiero + distribución de plan */}
                <div className="space-y-px bg-gray-200 border border-gray-200 rounded overflow-hidden">
                    {/* Financiero — filas estilo tabla contable */}
                    {[
                        { label: 'MRR', value: `$${metrics.estimatedMRR?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                        { label: 'ARR proyectado', value: `$${arr.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                        { label: 'ARPU', value: `$${metrics.arpu || '0.00'} / emp.` },
                    ].map(row => (
                        <div key={row.label} className="bg-white px-4 py-2.5 flex items-center justify-between">
                            <span className="text-xs text-gray-500">{row.label}</span>
                            <span className="text-xs font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{row.value}</span>
                        </div>
                    ))}

                    {/* Distribución por plan */}
                    <div className="bg-white px-4 pt-3 pb-4">
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">Distribución por plan</p>
                        <div className="space-y-3">
                            {[
                                { label: 'Essential', key: 'ESSENTIAL', color: 'bg-blue-300' },
                                { label: 'Growth', key: 'GROWTH', color: 'bg-blue-500' },
                                { label: 'Enterprise', key: 'ENTERPRISE', color: 'bg-blue-700' },
                            ].map(plan => {
                                const count = metrics.planDistribution?.[plan.key] || 0;
                                const pct = metrics.totalTenants > 0 ? Math.round((count / metrics.totalTenants) * 100) : 0;
                                return (
                                    <div key={plan.key}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600">{plan.label}</span>
                                            <span className="text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1 rounded-sm overflow-hidden">
                                            <div className={`${plan.color} h-full`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Estado del sistema */}
                    <div className="bg-white px-4 py-2.5 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Estado del sistema</span>
                        <span className="text-xs font-mono text-green-700 font-medium">{metrics.systemHealth}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
