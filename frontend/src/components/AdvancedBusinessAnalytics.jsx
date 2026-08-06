import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiActivity, FiUsers, FiCheckCircle } from 'react-icons/fi';

/**
 * Componente de Algoritmos Avanzados y Analítica Organizacional para Administradores
 * Diseño Ultra-Minimalista, limpio y estructurado
 */
export default function AdvancedBusinessAnalytics({ data }) {
    const burnout = data?.burnoutAnalysis || {
        overallBurnout: 42,
        overallProductivity: 84,
        departmentMetrics: [
            { department: 'Tecnología', burnoutScore: 38, productivityRatio: 88, headcount: 8, riskLevel: 'Riesgo Moderado' },
            { department: 'Operaciones', burnoutScore: 58, productivityRatio: 74, headcount: 12, riskLevel: 'Riesgo Moderado' },
            { department: 'Ventas', burnoutScore: 28, productivityRatio: 92, headcount: 6, riskLevel: 'Estable' }
        ]
    };

    const payrollProjections = data?.payrollProjections || {
        currentMonthlyPayroll: 15800,
        projection: [
            { month: 'Mes actual', payroll: 15800, headcount: 17 },
            { month: '+1 Mes', payroll: 16084, headcount: 17 },
            { month: '+2 Meses', payroll: 16368, headcount: 17 },
            { month: '+3 Meses', payroll: 16653, headcount: 18 },
            { month: '+4 Meses', payroll: 16937, headcount: 18 },
            { month: '+5 Meses', payroll: 17222, headcount: 19 },
        ]
    };

    const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="space-y-6">
            {/* Gráfico 1: Proyección Algorítmica de Nómina a 6 Meses */}
            <div className="bg-white rounded-xl shadow-2xs border border-slate-200/90 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <FiTrendingUp className="text-indigo-600" /> Algoritmo de Proyección de Presupuesto de Nómina
                        </h3>
                        <p className="text-xs text-slate-500">Estimación de crecimiento orgánico y nómina proyectada a 6 meses</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-right">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Nómina Mensual Actual</span>
                        <span className="text-sm font-bold text-slate-900">{formatUSD(payrollProjections.currentMonthlyPayroll)}</span>
                    </div>
                </div>

                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={payrollProjections.projection}>
                            <defs>
                                <linearGradient id="payrollGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                            <Tooltip formatter={(value) => formatUSD(value)} />
                            <Area type="monotone" dataKey="payroll" name="Nómina Proyectada ($)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#payrollGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráficos 2 & 3: Diagnóstico de Burnout y Eficiencia por Departamento */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Diagnóstico por Departamento */}
                <div className="lg:col-span-7 bg-white rounded-xl shadow-2xs border border-slate-200/90 p-5 space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                        <h4 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <FiActivity className="text-indigo-600" /> Diagnóstico Algorítmico de Sobrecarga y Burnout
                        </h4>
                        <p className="text-xs text-slate-500">Relación de horas extras, ausencias y riesgo por departamento</p>
                    </div>

                    {/* Tarjetas de Diagnóstico de Burnout Móvil/Tablet (< lg) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
                        {burnout.departmentMetrics.map((dept, idx) => (
                            <div key={idx} className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-3.5 hover:border-indigo-200 transition-all duration-300">
                                <div className="flex items-start justify-between gap-3">
                                    <h5 className="font-bold text-slate-900 text-sm truncate" title={dept.department}>
                                        {dept.department}
                                    </h5>
                                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border
                                        ${dept.riskLevel.includes('Estable') 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                            : 'bg-amber-50 text-amber-700 border-amber-100'}`}
                                    >
                                        {dept.riskLevel}
                                    </span>
                                </div>

                                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 text-xs grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-slate-400 font-medium block">Personal:</span>
                                        <span className="text-sm font-bold text-slate-800 mt-0.5 block">{dept.headcount} colaboradores</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium block">Índice Burnout:</span>
                                        <span className={`text-sm font-bold mt-0.5 block ${dept.burnoutScore > 50 ? 'text-amber-600' : 'text-slate-700'}`}>
                                            {dept.burnoutScore} / 100
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                        <span>Eficiencia Operativa:</span>
                                        <span className="text-emerald-600">{dept.productivityRatio}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{ width: `${dept.productivityRatio}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table for Desktop Only (>= lg) */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-xs text-left border border-slate-100 rounded-lg overflow-hidden">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                                <tr>
                                    <th className="p-3">Departamento</th>
                                    <th className="p-3 text-center">Personal</th>
                                    <th className="p-3 text-center">Índice Burnout</th>
                                    <th className="p-3 text-center">Eficiencia</th>
                                    <th className="p-3 text-right">Diagnóstico</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {burnout.departmentMetrics.map((dept, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-semibold text-slate-900">{dept.department}</td>
                                        <td className="p-3 text-center">{dept.headcount}</td>
                                        <td className="p-3 text-center">
                                            <span className={`font-bold ${dept.burnoutScore > 50 ? 'text-amber-600' : 'text-slate-700'}`}>
                                                {dept.burnoutScore} / 100
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="font-semibold text-emerald-600">{dept.productivityRatio}%</span>
                                        </td>
                                        <td className="p-3 text-right font-medium text-slate-600">
                                            {dept.riskLevel}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Resumen del Algoritmo de Productividad */}
                <div className="lg:col-span-5 bg-white rounded-xl shadow-2xs border border-slate-200/90 p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                        <h4 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <FiUsers className="text-indigo-600" /> Salud Operativa Promedio
                        </h4>
                        <p className="text-xs text-slate-500">Indicadores globales de la fuerza laboral</p>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/70">
                                <span className="text-[11px] font-semibold text-slate-500 block">Índice Burnout Global</span>
                                <span className="text-2xl font-bold text-slate-900 mt-1 block">{burnout.overallBurnout} pts</span>
                                <span className="text-[10px] text-slate-400">Escala de 0 a 100</span>
                            </div>
                            <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/70">
                                <span className="text-[11px] font-semibold text-slate-500 block">Eficiencia Operativa</span>
                                <span className="text-2xl font-bold text-emerald-600 mt-1 block">{burnout.overallProductivity}%</span>
                                <span className="text-[10px] text-slate-400">Rendimiento estimado</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg flex items-start gap-2.5">
                        <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">Recomendación de Balance de Carga</span>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                Mantener los niveles de horas extras controlados en Operaciones evita un incremento proyectado del 12% en ausentismo durante el próximo trimestre.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
