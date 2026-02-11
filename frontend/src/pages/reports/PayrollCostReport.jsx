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

    if (loading) return <div className="min-h-screen bg-slate-50 text-slate-800 p-8">Calculando costos...</div>;
    if (!data) return <div className="min-h-screen bg-slate-50 text-slate-800 p-8">No hay registros de nómina.</div>;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f97316'];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <h1 className="text-3xl font-bold flex items-center text-slate-800">
                    <FiDollarSign className="mr-3 text-slate-800" /> Costos de Nómina
                </h1>

                <form onSubmit={handleFilter} className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
                        <input type="date" className="bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={dates.startDate} onChange={e => setDates({ ...dates, startDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
                        <input type="date" className="bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={dates.endDate} onChange={e => setDates({ ...dates, endDate: e.target.value })} />
                    </div>
                    <button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-md transition-all active:scale-95">
                        <FiFilter className="mr-2" /> Filtrar
                    </button>
                </form>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Costo Total (Periodo)</p>
                    <p className="text-4xl font-bold text-green-600">${data.metrics?.totalCost?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Promedio Mensual</p>
                    <p className="text-4xl font-bold text-yellow-600">${data.metrics?.avgMonthlyCost?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Registros Procesados</p>
                    <p className="text-4xl font-bold text-slate-800">{data.metrics.headcount}</p>
                </div>
            </div>

            {/* Main Trend Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                <h3 className="font-bold mb-4 flex items-center text-slate-800"><FiTrendingUp className="mr-2" /> Tendencia de Costos</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.charts.trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                            <Area type="monotone" dataKey="salary" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Salario Base" />
                            <Area type="monotone" dataKey="overtime" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Horas Extra" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Breakdown Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold mb-4 text-slate-800">Composición del Costo</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.charts.breakdown} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {data.charts.breakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold mb-4 text-slate-800">Costos por Departamento</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.charts.byDepartment} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" stroke="#64748b" fontSize={12} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#64748b" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                    {data.charts.byDepartment.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => {
                        if (!data) return;
                        // Basic CSV Generation
                        const headers = ["Periodo,CostoTotal,SalarioBase,HorasExtra\n"];
                        const rows = data.charts.trend.map(d => `${d.name},${d.total},${d.salary},${d.overtime}`);
                        const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "reporte_costos_nomina.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 transition-colors"
                >
                    <FiDownload /> Descargar Reporte Completo (CSV)
                </button>
            </div>
        </div>
    );
};

export default PayrollCostReport;
