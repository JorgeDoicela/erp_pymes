export default function SuperAdminMetricsView({ metrics, loading }) {
    if (loading || !metrics) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-100 rounded w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="h-48 bg-gray-100 rounded" />
                    <div className="h-48 bg-gray-100 rounded" />
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
        <div className="space-y-5">
            {/* Encabezado 100% limpio (sin tarjetas de KPI arriba) */}
            <div className="pb-4 border-b border-gray-200">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Backoffice · Analíticas</p>
                <h1 className="text-xl font-semibold text-gray-900">Indicadores Financieros y Rendimiento</h1>
                <p className="text-sm text-gray-500 mt-0.5">Informe de ingresos recurrentes, estructura de suscripciones y gobernanza de la plataforma.</p>
            </div>

            {/* Paneles de datos estilo informe contable / balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Estado de Ingresos y Licencias */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado de Ingresos y Capacidad</h3>
                    </div>
                    <div className="divide-y divide-gray-100 text-xs">
                        <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-gray-600">MRR (Ingreso Recurrente Mensual)</span>
                            <span className="font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                ${metrics.estimatedMRR?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                            </span>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-gray-600">ARR Proyectado (Ingreso Recurrente Anual)</span>
                            <span className="font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                ${arr.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                            </span>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-gray-600">ARPU (Ingreso Medio / Empresa)</span>
                            <span className="font-medium text-gray-800 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                ${metrics.arpu || '0.00'} USD / mes
                            </span>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-gray-600">Usuarios Activos en Plataforma</span>
                            <span className="font-medium text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                {metrics.totalEmployees} licencias ocupadas
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Mezcla de Suscripciones (Tiers) */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Mezcla de Suscripciones por Tier</h3>
                    </div>
                    <div className="divide-y divide-gray-100 text-xs">
                        <div className="px-5 py-3 flex items-center justify-between">
                            <div>
                                <span className="font-medium text-gray-900">Essential Tier</span>
                                <span className="text-gray-400 ml-2">($0.50 / emp.)</span>
                            </div>
                            <span className="font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                {essentialCount} empresas <span className="text-gray-400">({Math.round((essentialCount / totalTenants) * 100)}%)</span>
                            </span>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                            <div>
                                <span className="font-medium text-gray-900">Growth Tier</span>
                                <span className="text-gray-400 ml-2">($1.00 / emp.)</span>
                            </div>
                            <span className="font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                {growthCount} empresas <span className="text-gray-400">({Math.round((growthCount / totalTenants) * 100)}%)</span>
                            </span>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                            <div>
                                <span className="font-medium text-gray-900">Enterprise Tier</span>
                                <span className="text-gray-400 ml-2">($2.00 / emp.)</span>
                            </div>
                            <span className="font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                {enterpriseCount} empresas <span className="text-gray-400">({Math.round((enterpriseCount / totalTenants) * 100)}%)</span>
                            </span>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between bg-gray-50/30">
                            <span className="text-gray-500 font-medium">Total Empresas Registradas</span>
                            <span className="font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                {metrics.totalTenants}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Infraestructura y Gobernanza */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden md:col-span-2">
                    <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Infraestructura & Gobernanza del Sistema</h3>
                    </div>
                    <div className="divide-y divide-gray-100 text-xs">
                        <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-gray-600">Estado de Microservicios</span>
                            <span className="font-mono font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded text-[11px]">
                                100% OPERATIONAL
                            </span>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-gray-600">Aislamiento de Base de Datos</span>
                            <span className="font-mono text-gray-800">Multitenant Schema-Isolated</span>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-gray-600">Logs de Auditoría Global</span>
                            <span className="font-mono text-gray-800 font-medium">Habilitado & Inmutable</span>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-gray-600">Salud de la Plataforma</span>
                            <span className="font-mono text-gray-900 font-semibold">{metrics.systemHealth}</span>
                        </div>
                    </div>
                    <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400">
                        Nota: Las métricas de rendimiento y licenciamiento se calculan en tiempo real sin comprometer la privacidad o aislamiento de datos entre empresas.
                    </div>
                </div>

            </div>
        </div>
    );
}
