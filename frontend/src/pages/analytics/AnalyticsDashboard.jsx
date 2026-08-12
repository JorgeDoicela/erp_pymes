import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardData } from '../../services/analytics.service';
import { FiUsers, FiUserPlus, FiBriefcase, FiDollarSign, FiPieChart, FiBarChart2, FiUserMinus, FiActivity, FiHeart, FiDatabase, FiFileText } from 'react-icons/fi';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await getDashboardData();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 text-sm font-semibold">Cargando Analíticas...</div>;
    if (!data) return <div className="p-8 text-center text-slate-500 text-sm font-semibold">Error al cargar datos.</div>;

    const { kpis, charts } = data;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <FiBarChart2 className="text-indigo-600" />
                        Dashboard de Indicadores RRHH
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Visión estratégica global y métricas clave de talento.</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
                <Link to="/intelligence" className="app-button-primary text-xs">
                    <FiActivity className="text-white" /> Análisis Predictivo AI
                </Link>
                <Link to="/admin/reports" className="app-button-secondary text-xs">
                    <FiFileText className="text-cyan-600" /> Reportes de Asistencia
                </Link>
                <Link to="/analytics/turnover" className="app-button-secondary text-xs">
                    <FiUserMinus className="text-rose-500" /> Rotación
                </Link>
                <Link to="/analytics/performance" className="app-button-secondary text-xs">
                    <FiActivity className="text-indigo-600" /> Desempeño
                </Link>
                <Link to="/analytics/payroll-costs" className="app-button-secondary text-xs">
                    <FiDollarSign className="text-emerald-600" /> Costo Nómina
                </Link>
                <Link to="/analytics/satisfaction" className="app-button-secondary text-xs">
                    <FiHeart className="text-amber-500" /> Clima Laboral
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
