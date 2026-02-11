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

    if (loading) return <div className="p-8 text-slate-800 bg-slate-50 min-h-screen">Generando reporte...</div>;
    if (!data) return <div className="p-8 text-slate-800 bg-slate-50 min-h-screen">No hay datos disponibles.</div>;

    const COLORS = ['#f97316', '#eab308', '#10b981', '#3b82f6'];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <h1 className="text-3xl font-bold flex items-center text-slate-800">
                    <FiUserMinus className="mr-3 text-slate-800" /> Reporte de Rotación
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
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-md transition-all active:scale-95">
                        <FiFilter className="mr-2" /> Filtrar
                    </button>
                </form>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Tasa de Rotación (Periodo)</p>
                    <p className="text-4xl font-bold text-red-600">{data.turnoverRate}%</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Total Bajas</p>
                    <p className="text-4xl font-bold text-slate-800">{data.totalExits}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold mb-4 text-slate-800">Bajas por Tipo</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.exitsByType} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {data.exitsByType.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold mb-4 text-slate-800">Motivos de Salida</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.exitsByReason} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" stroke="#64748b" fontSize={12} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#64748b" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill="#f97316" barSize={20} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">Detalle de Bajas</h3>
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
                        className="text-sm text-blue-600 font-medium flex items-center hover:text-blue-700 transition-colors"
                    >
                        <FiDownload className="mr-1" /> Exportar Excel
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                            <tr>
                                <th className="p-4">Empleado</th>
                                <th className="p-4">Depto</th>
                                <th className="p-4">Fecha Baja</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Motivo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.exitsList.map(emp => (
                                <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 font-bold text-slate-800">{emp.name}</td>
                                    <td className="p-4 text-slate-600">{emp.department}</td>
                                    <td className="p-4 text-slate-600">{new Date(emp.exitDate).toLocaleDateString()}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium ${emp.type === 'Involuntario' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{emp.type}</span></td>
                                    <td className="p-4 text-slate-500 italic">{emp.reason}</td>
                                </tr>
                            ))}
                            {data.exitsList.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400">No se encontraron registros en este periodo.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TurnoverReport;
