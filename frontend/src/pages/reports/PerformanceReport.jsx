import { useState, useEffect } from 'react';
import { getPerformanceReport } from '../../services/analytics.service';
import { FiFilter, FiDownload, FiAward, FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const PerformanceReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', department: '' });

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        setLoading(true);
        try {
            const result = await getPerformanceReport(filters.startDate, filters.endDate, filters.department);
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

    if (loading) return <div className="min-h-screen bg-slate-50 text-slate-800 p-8">Generando análisis de desempeño...</div>;
    if (!data) return <div className="min-h-screen bg-slate-50 text-slate-800 p-8">No hay datos disponibles.</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <h1 className="text-3xl font-bold flex items-center text-slate-800">
                    <FiActivity className="mr-3 text-slate-800" /> Desempeño Organizacional
                </h1>

                <form onSubmit={handleFilter} className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
                        <input type="date" className="bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
                        <input type="date" className="bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Departamento</label>
                        <select className="bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}>
                            <option value="">Todos</option>
                            <option value="IT">IT</option>
                            <option value="HR">HR</option>
                            <option value="Sales">Ventas</option>
                            <option value="Marketing">Marketing</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-md transition-all active:scale-95">
                        <FiFilter className="mr-2" /> Filtrar
                    </button>
                </form>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Top Performers */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold flex items-center text-slate-800"><FiAward className="mr-2" /> Top Performers</h3>
                        <span className="text-xs text-slate-500">Mejores Puntuaciones</span>
                    </div>
                    <div className="space-y-3">
                        {data.topPerformers.map(p => (
                            <div key={p.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                <div>
                                    <p className="font-semibold text-slate-800">{p.name}</p>
                                    <p className="text-xs text-slate-500">{p.department}</p>
                                </div>
                                <div className="text-xl font-bold text-green-600">{p.score}</div>
                            </div>
                        ))}
                        {data.topPerformers.length === 0 && <p className="text-sm text-slate-400 italic">Sin datos.</p>}
                    </div>
                </div>

                {/* Training Needs */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold flex items-center text-slate-800"><FiTrendingDown className="mr-2" /> Requieren Atención</h3>
                        <span className="text-xs text-slate-500">Puntuaciones Bajas</span>
                    </div>
                    <div className="space-y-3">
                        {data.lowPerformers.map(p => (
                            <div key={p.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                <div>
                                    <p className="font-semibold text-slate-800">{p.name}</p>
                                    <p className="text-xs text-slate-500">{p.department}</p>
                                </div>
                                <div className="text-xl font-bold text-red-600">{p.score}</div>
                            </div>
                        ))}
                        {data.lowPerformers.length === 0 && <p className="text-sm text-slate-400 italic">Sin datos.</p>}
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Department Averages */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center text-slate-800"><FiActivity className="mr-2" /> Promedio por Departamento</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.avgScoreByDept} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[0, 5]} stroke="#64748b" fontSize={12} />
                                <YAxis dataKey="department" type="category" width={100} stroke="#64748b" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="average" fill="#8884d8" name="Promedio" radius={[0, 4, 4, 0]} >
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Score Distribution */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center text-slate-800"><FiTrendingUp className="mr-2" /> Distribución de Calificaciones</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.distributionChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="count" fill="#82ca9d" name="Empleados" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">Resultados Detallados</h3>
                    <button
                        onClick={() => {
                            if (!data || !data.detailedList) return;
                            const headers = ["Empleado,Departamento,Cargo,Score,Recomendacion\n"];
                            const rows = data.detailedList.map(item => `${item.employeeName},${item.department},${item.position},${item.score},"${item.recommendation}"`);
                            const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "reporte_desempeno.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="text-sm text-blue-600 font-medium flex items-center hover:text-blue-700 transition-colors"
                    >
                        <FiDownload className="mr-1" /> Exportar
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                            <tr>
                                <th className="p-4">Empleado</th>
                                <th className="p-4">Departamento</th>
                                <th className="p-4">Cargo</th>
                                <th className="p-4 text-center">Score Final</th>
                                <th className="p-4">Recomendación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.detailedList.map(item => (
                                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 font-bold text-slate-800">{item.employeeName}</td>
                                    <td className="p-4 text-slate-600">{item.department}</td>
                                    <td className="p-4 text-slate-500">{item.position}</td>
                                    <td className="p-4 text-center font-bold text-lg">
                                        <span className={item.score >= 4 ? 'text-green-600' : item.score >= 3 ? 'text-yellow-600' : 'text-red-600'}>
                                            {item.score}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.score >= 4 ? 'bg-green-100 text-green-700' :
                                            item.score >= 3 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {item.recommendation}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {data.detailedList.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400 italic">No hay evaluaciones completadas en este periodo.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PerformanceReport;
