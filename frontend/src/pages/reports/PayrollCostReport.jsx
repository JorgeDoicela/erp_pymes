import { useState, useEffect } from 'react';
import { getPayrollCostReport } from '../../services/analytics.service';
import { FiFilter, FiDownload, FiDollarSign, FiTrendingUp, FiPieChart } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const PayrollCostReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dates, setDates] = useState({ startDate: '', endDate: '' });

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        setLoading(true);
        try {
            const result = await getPayrollCostReport(dates.startDate, dates.endDate);
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (e) => {
        e.preventDefault();
        loadReport();
    };

    if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Calculando costos...</div>;
    if (!data) return <div className="min-h-screen bg-gray-900 text-white p-8">No hay registros de nómina.</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <FiDollarSign className="mr-3 text-yellow-500" /> Costos de Nómina
                </h1>

                <form onSubmit={handleFilter} className="flex gap-4 items-end bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Desde</label>
                        <input type="date" className="bg-gray-700 border-gray-600 rounded p-2 text-sm text-white"
                            value={dates.startDate} onChange={e => setDates({ ...dates, startDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Hasta</label>
                        <input type="date" className="bg-gray-700 border-gray-600 rounded p-2 text-sm text-white"
                            value={dates.endDate} onChange={e => setDates({ ...dates, endDate: e.target.value })} />
                    </div>
                    <button type="submit" className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-bold flex items-center">
                        <FiFilter className="mr-2" /> Filtrar
                    </button>
                </form>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-sm">Costo Total (Periodo)</p>
                    <p className="text-4xl font-bold text-green-400">${data.metrics.totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-sm">Promedio Mensual</p>
                    <p className="text-4xl font-bold text-yellow-400">${data.metrics.avgMonthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-sm">Registros Procesados</p>
                    <p className="text-4xl font-bold text-white">{data.metrics.headcount}</p>
                </div>
            </div>

            {/* Main Trend Chart */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
                <h3 className="font-bold mb-4 flex items-center"><FiTrendingUp className="mr-2" /> Tendencia de Costos</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.charts.trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                            <Area type="monotone" dataKey="total" stroke="#82ca9d" fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                            <Area type="monotone" dataKey="salary" stackId="1" stroke="#8884d8" fill="#8884d8" name="Salario Base" />
                            <Area type="monotone" dataKey="overtime" stackId="1" stroke="#ffc658" fill="#ffc658" name="Horas Extra" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Breakdown Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="font-bold mb-4">Composición del Costo</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.charts.breakdown} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {data.charts.breakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="font-bold mb-4">Costos por Departamento</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.charts.byDepartment} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} cursor={{ fill: '#374151' }} />
                                <Bar dataKey="value" fill="#8884d8">
                                    {data.charts.byDepartment.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button className="text-blue-400 hover:text-white flex items-center gap-2">
                    <FiDownload /> Descargar Reporte Completo (CSV)
                </button>
            </div>
        </div>
    );
};

export default PayrollCostReport;
