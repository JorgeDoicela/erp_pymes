import { useState, useEffect } from 'react';
import { getDashboardData } from '../../services/analytics.service';
import { FiUsers, FiUserPlus, FiBriefcase, FiDollarSign, FiPieChart, FiBarChart2, FiUserMinus, FiActivity, FiHeart, FiDatabase } from 'react-icons/fi';
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

    if (loading) return <div className="min-h-screen bg-slate-50 text-slate-800 p-8 flex items-center justify-center font-bold">Cargando Analíticas...</div>;
    if (!data) return <div className="min-h-screen bg-slate-50 text-slate-800 p-8 flex items-center justify-center font-bold">Error al cargar datos.</div>;

    const { kpis, charts } = data;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#8b5cf6'];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
            <h1 className="text-3xl font-bold mb-8 flex items-center text-slate-800">
                <FiBarChart2 className="mr-3 text-slate-800" />
                Dashboard de Indicadores RRHH
            </h1>

            <div className="flex flex-wrap gap-4 mb-8">
                <a href="/analytics/turnover" className="bg-white hover:bg-slate-50 text-blue-600 px-4 py-2 rounded-lg font-bold flex items-center border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <FiUserMinus className="mr-2" /> Reporte de Rotación
                </a>
                <a href="/analytics/performance" className="bg-white hover:bg-slate-50 text-purple-600 px-4 py-2 rounded-lg font-bold flex items-center border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <FiActivity className="mr-2" /> Reporte de Desempeño
                </a>
                <a href="/analytics/payroll-costs" className="bg-white hover:bg-slate-50 text-yellow-600 px-4 py-2 rounded-lg font-bold flex items-center border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <FiDollarSign className="mr-2" /> Reporte de Nómina
                </a>
                <a href="/analytics/satisfaction" className="bg-white hover:bg-slate-50 text-pink-600 px-4 py-2 rounded-lg font-bold flex items-center border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <FiHeart className="mr-2" /> Clima Laboral
                </a>
                <a href="/analytics/custom" className="bg-white hover:bg-slate-50 text-cyan-600 px-4 py-2 rounded-lg font-bold flex items-center border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <FiDatabase className="mr-2" /> Exportar Datos
                </a>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Empleados</p>
                        <p className="text-3xl font-bold text-slate-800">{kpis.totalEmployees}</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><FiUsers size={24} /></div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Nuevos (Mes)</p>
                        <p className="text-3xl font-bold text-slate-800">{kpis.newHires}</p>
                    </div>
                    <div className="bg-green-50 text-green-600 p-3 rounded-xl"><FiUserPlus size={24} /></div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Vacantes Abiertas</p>
                        <p className="text-3xl font-bold text-slate-800">{kpis.openVacancies}</p>
                    </div>
                    <div className="bg-purple-50 text-purple-600 p-3 rounded-xl"><FiBriefcase size={24} /></div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Nómina Estimada</p>
                        <p className="text-2xl font-bold text-green-600">${kpis.payrollTotal ? kpis.payrollTotal.toLocaleString() : '0'}</p>
                    </div>
                    <div className="bg-yellow-50 text-yellow-600 p-3 rounded-xl"><FiDollarSign size={24} /></div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Employees by Department */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <h3 className="text-xl font-bold mb-6 flex items-center text-slate-800"><FiPieChart className="mr-2" /> Empleados por Departamento</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={charts.deptChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {charts.deptChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vacancies by Department */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <h3 className="text-xl font-bold mb-6 flex items-center text-slate-800"><FiBarChart2 className="mr-2" /> Vacantes Abiertas por Dept.</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.vacancyChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
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
