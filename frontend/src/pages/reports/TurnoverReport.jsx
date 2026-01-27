import { useState, useEffect } from 'react';
import { getTurnoverReport } from '../../services/analytics.service';
import { FiFilter, FiDownload, FiUserMinus } from 'react-icons/fi';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const TurnoverReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dates, setDates] = useState({ startDate: '', endDate: '' });

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        setLoading(true);
        try {
            const result = await getTurnoverReport(dates.startDate, dates.endDate);
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

    if (loading) return <div className="p-8 text-white">Generando reporte...</div>;
    if (!data) return <div className="p-8 text-white">No hay datos disponibles.</div>;

    const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE'];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <FiUserMinus className="mr-3 text-white" /> Reporte de Rotación
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
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold flex items-center">
                        <FiFilter className="mr-2" /> Filtrar
                    </button>
                </form>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-sm">Tasa de Rotación (Periodo)</p>
                    <p className="text-4xl font-bold text-red-400">{data.turnoverRate}%</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-sm">Total Bajas</p>
                    <p className="text-4xl font-bold text-white">{data.totalExits}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="font-bold mb-4">Bajas por Tipo</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.exitsByType} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {data.exitsByType.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="font-bold mb-4">Motivos de Salida</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.exitsByReason} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} cursor={{ fill: '#374151' }} />
                                <Bar dataKey="value" fill="#FF8042" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex justify-between">
                    <h3 className="font-bold text-lg">Detalle de Bajas</h3>
                    <button
                        onClick={() => {
                            if (!data || !data.exitsList) return;
                            const headers = ["Empleado,Departamento,FechaBaja,Tipo,Motivo\n"];
                            const rows = data.exitsList.map(emp => `${emp.name},${emp.department},${new Date(emp.exitDate).toISOString().split('T')[0]},${emp.type},"${emp.reason}"`);
                            const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "reporte_rotacion.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="text-sm text-blue-400 flex items-center hover:text-white"
                    >
                        <FiDownload className="mr-1" /> Exportar Excel
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Empleado</th>
                                <th className="p-4">Depto</th>
                                <th className="p-4">Fecha Baja</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Motivo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {data.exitsList.map(emp => (
                                <tr key={emp.id} className="hover:bg-gray-700/50">
                                    <td className="p-4 font-bold">{emp.name}</td>
                                    <td className="p-4">{emp.department}</td>
                                    <td className="p-4">{new Date(emp.exitDate).toLocaleDateString()}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${emp.type === 'Involuntario' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>{emp.type}</span></td>
                                    <td className="p-4 text-gray-300 italic">{emp.reason}</td>
                                </tr>
                            ))}
                            {data.exitsList.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No se encontraron registros en este periodo.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TurnoverReport;
