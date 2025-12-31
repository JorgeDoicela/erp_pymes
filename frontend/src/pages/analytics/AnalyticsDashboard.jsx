import { useState, useEffect } from 'react';
import { getDashboardData } from '../../services/analytics.service';
import { FiUsers, FiUserPlus, FiBriefcase, FiDollarSign, FiPieChart, FiBarChart2, FiUserMinus, FiActivity } from 'react-icons/fi';
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

    if (loading) return <div className="p-8 text-white">Cargando Analíticas...</div>;
    if (!data) return <div className="p-8 text-white">Error al cargar datos.</div>;

    const { kpis, charts } = data;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-8 flex items-center">
                <FiBarChart2 className="mr-3 text-blue-500" />
                Dashboard de Indicadores RRHH
            </h1>

            <div className="flex gap-4 mb-6">
                <a href="/analytics/turnover" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-bold flex items-center">
                    <FiUserMinus className="mr-2" /> Reporte de Rotación
                </a>
                <a href="/analytics/performance" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-bold flex items-center">
                    <FiActivity className="mr-2" /> Reporte de Desempeño
                </a>
                <a href="/analytics/payroll-costs" className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white font-bold flex items-center">
                    <FiDollarSign className="mr-2" /> Reporte de Nómina
                </a>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Total Empleados</p>
                        <p className="text-3xl font-bold">{kpis.totalEmployees}</p>
                    </div>
                    <div className="bg-blue-900/50 p-3 rounded-lg text-blue-400"><FiUsers size={24} /></div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Nuevos (Mes)</p>
                        <p className="text-3xl font-bold">{kpis.newHires}</p>
                    </div>
                    <div className="bg-green-900/50 p-3 rounded-lg text-green-400"><FiUserPlus size={24} /></div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Vacantes Abiertas</p>
                        <p className="text-3xl font-bold">{kpis.openVacancies}</p>
                    </div>
                    <div className="bg-purple-900/50 p-3 rounded-lg text-purple-400"><FiBriefcase size={24} /></div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Nómina Estimada</p>
                        <p className="text-2xl font-bold text-green-400">${kpis.payrollTotal.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-900/50 p-3 rounded-lg text-yellow-500"><FiDollarSign size={24} /></div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Employees by Department */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-bold mb-6 flex items-center"><FiPieChart className="mr-2" /> Empleados por Departamento</h3>
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
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vacancies by Department */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-bold mb-6 flex items-center"><FiBarChart2 className="mr-2" /> Vacantes Abiertas por Dept.</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.vacancyChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} cursor={{ fill: '#374151' }} />
                                <Bar dataKey="value" fill="#8884d8">
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
