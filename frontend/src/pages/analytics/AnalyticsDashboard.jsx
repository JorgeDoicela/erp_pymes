import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardData } from '../../services/analytics.service';
import {
    FiUsers, FiUserPlus, FiBriefcase, FiDollarSign, FiPieChart, FiBarChart2,
    FiUserMinus, FiActivity, FiHeart, FiDatabase, FiFileText, FiCpu, FiGitPullRequest, FiShare2, FiTarget
} from 'react-icons/fi';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        getDashboardData()
            .then(result => {
                if (isMounted) setData(result);
            })
            .catch(error => {
                console.error(error);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500 text-sm font-semibold">Cargando Analíticas...</div>;
    if (!data) return <div className="p-8 text-center text-slate-500 text-sm font-semibold">Error al cargar datos.</div>;

    const { kpis, charts } = data;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Analítica · Indicadores de Gestión</p>
                    <h1 className="text-xl font-semibold text-gray-900">Dashboard de Indicadores RRHH</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Visión estratégica global y métricas clave de talento humano.</p>
                </div>
            </div>

            {/* Navegación por pestañas/reportes ERP */}
            <div className="flex border-b border-gray-200 overflow-x-auto gap-2 text-xs pb-2">
                <Link to="/admin/reports" className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded transition-colors shrink-0">
                    Reportes Asistencia
                </Link>
                <Link to="/analytics/turnover" className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded transition-colors shrink-0">
                    Rotación
                </Link>
                <Link to="/analytics/performance" className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded transition-colors shrink-0">
                    Desempeño
                </Link>
                <Link to="/analytics/payroll-costs" className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded transition-colors shrink-0">
                    Costo Nómina
                </Link>
                <Link to="/analytics/satisfaction" className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded transition-colors shrink-0">
                    Clima Laboral
                </Link>
                <Link to="/analytics/rsi-optimization" className="px-3 py-1.5 border border-emerald-300 hover:border-emerald-500 text-emerald-700 bg-emerald-50 font-medium rounded transition-colors flex items-center gap-1 shrink-0">
                    <FiCpu className="w-3.5 h-3.5 text-emerald-600" /> Calibración RSI
                </Link>
                <Link to="/analytics/causal-inference" className="px-3 py-1.5 border border-blue-300 hover:border-blue-500 text-blue-700 bg-blue-50 font-medium rounded transition-colors flex items-center gap-1 shrink-0">
                    <FiGitPullRequest className="w-3.5 h-3.5 text-blue-600" /> Inferencia Causal
                </Link>
                <Link to="/analytics/federated-learning" className="px-3 py-1.5 border border-emerald-300 hover:border-emerald-500 text-emerald-700 bg-emerald-50 font-medium rounded transition-colors flex items-center gap-1 shrink-0">
                    <FiShare2 className="w-3.5 h-3.5 text-emerald-600" /> Benchmarking
                </Link>
                <Link to="/analytics/morl-pareto" className="px-3 py-1.5 border border-amber-300 hover:border-amber-500 text-amber-700 bg-amber-50 font-medium rounded transition-colors flex items-center gap-1 shrink-0">
                    <FiTarget className="w-3.5 h-3.5 text-amber-600" /> Optimización MORL
                </Link>
                <Link to="/analytics/temporal-attention" className="px-3 py-1.5 border border-purple-300 hover:border-purple-500 text-purple-700 bg-purple-50 font-medium rounded transition-colors flex items-center gap-1 shrink-0">
                    <FiActivity className="w-3.5 h-3.5 text-purple-600" /> Temporal Attention
                </Link>
                <Link to="/analytics/ft-transformer" className="px-3 py-1.5 border border-emerald-300 hover:border-emerald-500 text-emerald-700 bg-emerald-50 font-medium rounded transition-colors flex items-center gap-1 shrink-0">
                    <FiActivity className="w-3.5 h-3.5 text-emerald-600" /> FT-Transformer
                </Link>
                <Link to="/analytics/custom" className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded transition-colors flex items-center gap-1 shrink-0">
                    <FiDatabase className="w-3.5 h-3.5 text-cyan-600" /> Exportación Personalizada
                </Link>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="app-card flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Total Empleados</p>
                        <p className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1 font-mono tracking-tight" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {kpis.totalEmployees}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center text-sm shrink-0">
                        <FiUsers size={18} />
                    </div>
                </div>

                <div className="app-card flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Nuevos (Mes)</p>
                        <p className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1 font-mono tracking-tight" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {kpis.newHires}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center text-sm shrink-0">
                        <FiUserPlus size={18} />
                    </div>
                </div>

                <div className="app-card flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Vacantes Abiertas</p>
                        <p className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1 font-mono tracking-tight" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {kpis.openVacancies}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center text-sm shrink-0">
                        <FiBriefcase size={18} />
                    </div>
                </div>

                <div className="app-card flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Nómina Estimada</p>
                        <p className="text-xl sm:text-2xl font-semibold text-emerald-700 mt-1 font-mono tracking-tight" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            ${kpis.payrollTotal ? kpis.payrollTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center text-sm shrink-0">
                        <FiDollarSign size={18} />
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Employees by Department */}
                <div className="app-card border border-gray-200">
                    <h3 className="text-sm font-semibold mb-4 flex items-center text-gray-900">
                        <FiPieChart className="mr-2 text-blue-600" /> Empleados por Departamento
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={charts.deptChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {charts.deptChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#111827', fontSize: '12px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vacancies by Department */}
                <div className="app-card border border-gray-200">
                    <h3 className="text-sm font-semibold mb-4 flex items-center text-gray-900">
                        <FiBarChart2 className="mr-2 text-blue-600" /> Vacantes Abiertas por Dept.
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.vacancyChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#111827', fontSize: '12px' }} cursor={{ fill: '#f9fafb' }} />
                                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]}>
                                    {charts.vacancyChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
