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

    if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Generando análisis de desempeño...</div>;
    if (!data) return <div className="min-h-screen bg-gray-900 text-white p-8">No hay datos disponibles.</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <FiActivity className="mr-3 text-purple-500" /> Desempeño Organizacional
                </h1>

                <form onSubmit={handleFilter} className="flex gap-4 items-end bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Desde</label>
                        <input type="date" className="bg-gray-700 border-gray-600 rounded p-2 text-sm text-white"
                            value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Hasta</label>
                        <input type="date" className="bg-gray-700 border-gray-600 rounded p-2 text-sm text-white"
                            value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Departamento</label>
                        <select className="bg-gray-700 border-gray-600 rounded p-2 text-sm text-white"
                            value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}>
                            <option value="">Todos</option>
                            <option value="IT">IT</option>
                            <option value="HR">HR</option>
                            <option value="Sales">Ventas</option>
                            <option value="Marketing">Marketing</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold flex items-center">
                        <FiFilter className="mr-2" /> Filtrar
                    </button>
                </form>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Top Performers */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold flex items-center text-green-400"><FiAward className="mr-2" /> Top Performers</h3>
                        <span className="text-xs text-gray-400">Mejores Puntuaciones</span>
                    </div>
                    <div className="space-y-3">
                        {data.topPerformers.map(p => (
                            <div key={p.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded">
                                <div>
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-xs text-gray-400">{p.department}</p>
                                </div>
                                <div className="text-xl font-bold text-green-400">{p.score}</div>
                            </div>
                        ))}
                        {data.topPerformers.length === 0 && <p className="text-sm text-gray-500">Sin datos.</p>}
                    </div>
                </div>

                {/* Training Needs */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold flex items-center text-red-400"><FiTrendingDown className="mr-2" /> Requieren Atención</h3>
                        <span className="text-xs text-gray-400">Puntuaciones Bajas</span>
                    </div>
                    <div className="space-y-3">
                        {data.lowPerformers.map(p => (
                            <div key={p.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded">
                                <div>
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-xs text-gray-400">{p.department}</p>
                                </div>
                                <div className="text-xl font-bold text-red-400">{p.score}</div>
                            </div>
                        ))}
                        {data.lowPerformers.length === 0 && <p className="text-sm text-gray-500">Sin datos.</p>}
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Department Averages */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="font-bold mb-4 flex items-center"><FiActivity className="mr-2" /> Promedio por Departamento</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.avgScoreByDept} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                                <XAxis type="number" domain={[0, 5]} stroke="#9ca3af" />
                                <YAxis dataKey="department" type="category" width={100} stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} cursor={{ fill: '#374151' }} />
                                <Bar dataKey="average" fill="#8884d8" name="Promedio" radius={[0, 4, 4, 0]} >
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Score Distribution */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="font-bold mb-4 flex items-center"><FiTrendingUp className="mr-2" /> Distribución de Calificaciones</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.distributionChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                <XAxis dataKey="range" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} cursor={{ fill: '#374151' }} />
                                <Bar dataKey="count" fill="#82ca9d" name="Empleados" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Resultados Detallados</h3>
                    <button className="text-sm text-blue-400 flex items-center hover:text-white"><FiDownload className="mr-1" /> Exportar</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Empleado</th>
                                <th className="p-4">Departamento</th>
                                <th className="p-4">Cargo</th>
                                <th className="p-4 text-center">Score Final</th>
                                <th className="p-4">Recomendación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {data.detailedList.map(item => (
                                <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 font-bold">{item.employeeName}</td>
                                    <td className="p-4">{item.department}</td>
                                    <td className="p-4 text-gray-400">{item.position}</td>
                                    <td className="p-4 text-center font-bold text-lg">
                                        <span className={item.score >= 4 ? 'text-green-400' : item.score >= 3 ? 'text-yellow-400' : 'text-red-400'}>
                                            {item.score}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.score >= 4 ? 'bg-green-900 text-green-200' :
                                                item.score >= 3 ? 'bg-yellow-900 text-yellow-200' :
                                                    'bg-red-900 text-red-200'
                                            }`}>
                                            {item.recommendation}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {data.detailedList.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No hay evaluaciones completadas en este periodo.</td>
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
