import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTurnoverReport } from '../../services/analytics.service';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { FiArrowLeft, FiBookOpen } from 'react-icons/fi';
import AnalyticsMethodologyModal from '../../components/analytics/AnalyticsMethodologyModal';

const TurnoverReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dates, setDates] = useState({ startDate: '', endDate: '' });
    const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

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

    if (loading) return <div className="p-8 text-center text-gray-400 text-xs font-mono">Generando reporte de rotación...</div>;
    if (!data) return <div className="p-8 text-center text-gray-400 text-xs font-mono">No hay datos de rotación disponibles.</div>;

    const COLORS = ['#2563eb', '#d97706', '#166534', '#4b5563'];

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-gray-200">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            to="/analytics"
                            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium transition-colors"
                        >
                            <FiArrowLeft className="w-3 h-3" />
                            <span>Analíticas</span>
                        </Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider font-mono">Retención de Talento</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Reporte de Rotación de Personal</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Indicadores de desvinculación, motivos de salida y tasa de rotación por periodo.</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        to="/analytics"
                        className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a Analíticas</span>
                    </Link>
                    <button
                        onClick={() => setIsMethodologyOpen(true)}
                        className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                        <FiBookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ficha Técnica</span>
                    </button>
                </div>
            </div>

            {/* Modal de Ficha Técnica Contextual */}
            <AnalyticsMethodologyModal
                isOpen={isMethodologyOpen}
                onClose={() => setIsMethodologyOpen(false)}
                defaultSection="turnover"
            />

            {/* Filtros de Fecha */}
            <div className="flex justify-end">
                <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-2 bg-white p-3 rounded border border-gray-200 w-full lg:w-auto text-xs shadow-xs">
                    <div>
                        <label className="block font-medium text-gray-600 mb-1">Desde</label>
                        <input
                            type="date"
                            className="bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={dates.startDate}
                            onChange={e => setDates({ ...dates, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-600 mb-1">Hasta</label>
                        <input
                            type="date"
                            className="bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={dates.endDate}
                            onChange={e => setDates({ ...dates, endDate: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shrink-0">
                        Filtrar
                    </button>
                </form>
            </div>

            {/* Resumen Estilo Informe Contable / Balance */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Indicadores de Rotación</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 text-xs">
                    <div className="p-4 flex items-center justify-between">
                        <span className="text-gray-600">Tasa de Rotación en el Periodo</span>
                        <span className="text-sm font-semibold font-mono text-red-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {data.turnoverRate}%
                        </span>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <span className="text-gray-600">Total de Bajas Registradas</span>
                        <span className="text-sm font-semibold font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {data.totalExits} desvinculaciones
                        </span>
                    </div>
                </div>
            </div>

            {/* Gráficos Sobrios ERP */}
            {data.totalExits === 0 ? (
                <div className="bg-white p-8 rounded border border-gray-200 text-center text-xs text-gray-500">
                    <p className="font-semibold text-gray-800 text-sm">Sin desvinculaciones en el período seleccionado</p>
                    <p className="text-gray-400 mt-1 font-mono">La nómina de colaboradores no presenta bajas ni liquidaciones registradas en este rango de fechas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Bajas por Tipo de Salida</h3>
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.exitsByType} cx="50%" cy="50%" outerRadius={70} fill="#2563eb" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {data.exitsByType.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Motivos Principales de Salida</h3>
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.exitsByReason} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                                    <XAxis type="number" stroke="#6b7280" fontSize={11} />
                                    <YAxis dataKey="name" type="category" width={90} stroke="#6b7280" fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                                    <Bar dataKey="value" fill="#d97706" barSize={16} radius={[0, 2, 2, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla Detallada ERP */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Detalle Registro de Bajas</h3>
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
                        className="px-2.5 py-1 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Exportar CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Departamento</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Fecha Baja</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Motivo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.exitsList.map(emp => (
                                <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="py-2.5 px-4 font-medium text-gray-900">{emp.name}</td>
                                    <td className="py-2.5 px-4 text-gray-600">{emp.department}</td>
                                    <td className="py-2.5 px-4 font-mono text-gray-600" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                        {new Date(emp.exitDate).toLocaleDateString('es-EC')}
                                    </td>
                                    <td className="py-2.5 px-4">
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                            emp.type === 'Involuntario' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                        }`}>
                                            {emp.type}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-gray-500">{emp.reason}</td>
                                </tr>
                            ))}
                            {data.exitsList.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 text-xs">No se encontraron registros de bajas en este periodo.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TurnoverReport;
