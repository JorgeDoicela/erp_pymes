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
                <div className="app-card flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Empleados</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{kpis.totalEmployees}</p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl"><FiUsers size={22} /></div>
                </div>

                <div className="app-card flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Nuevos (Mes)</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{kpis.newHires}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><FiUserPlus size={22} /></div>
                </div>

                <div className="app-card flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Vacantes Abiertas</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{kpis.openVacancies}</p>
                    </div>
                    <div className="bg-purple-50 text-purple-600 p-3 rounded-xl"><FiBriefcase size={22} /></div>
                </div>

                <div className="app-card flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Nómina Estimada</p>
                        <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1 tracking-tight">${kpis.payrollTotal ? kpis.payrollTotal.toLocaleString() : '0'}</p>
                    </div>
                    <div className="bg-amber-50 text-amber-600 p-3 rounded-xl"><FiDollarSign size={22} /></div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Employees by Department */}
                <div className="app-card">
                    <h3 className="text-base font-bold mb-4 flex items-center text-slate-800"><FiPieChart className="mr-2 text-indigo-600" /> Empleados por Departamento</h3>
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
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vacancies by Department */}
                <div className="app-card">
                    <h3 className="text-base font-bold mb-4 flex items-center text-slate-800"><FiBarChart2 className="mr-2 text-indigo-600" /> Vacantes Abiertas por Dept.</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.vacancyChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]}>
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
