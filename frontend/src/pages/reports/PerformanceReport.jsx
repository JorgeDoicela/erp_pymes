import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPerformanceReport } from '../../services/analytics.service';
import { getDepartments } from '../../services/employees/employee.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiArrowLeft, FiBookOpen } from 'react-icons/fi';
import AnalyticsMethodologyModal from '../../components/analytics/AnalyticsMethodologyModal';

const PerformanceReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', department: '' });
    const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

    useEffect(() => {
        loadReport();
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            const res = await getDepartments();
            if (res.success) setDepartments(res.data);
        } catch (error) {
            console.error(error);
        }
    };

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

    if (loading) return <div className="p-8 text-center text-gray-400 text-xs font-mono">Generando informe de desempeño...</div>;
    if (!data) return <div className="p-8 text-center text-gray-400 text-xs font-mono">No hay datos de desempeño disponibles.</div>;

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
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider font-mono">Evaluación y Metas</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Evaluación de Desempeño Organizacional</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Métricas de rendimiento por departamento, puntuaciones destacadas y planes de desarrollo.</p>
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
                        <span>Ficha Técnica & Congreso</span>
                    </button>
                </div>
            </div>

            {/* Modal de Ficha Técnica Contextual */}
            <AnalyticsMethodologyModal
                isOpen={isMethodologyOpen}
                onClose={() => setIsMethodologyOpen(false)}
                defaultSection="performance"
            />

            {/* Filtros */}
            <div className="flex justify-end">
                <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-2 bg-white p-3 rounded border border-gray-200 w-full lg:w-auto text-xs shadow-xs">
                    <div>
                        <label className="block font-medium text-gray-600 mb-1">Desde</label>
                        <input
                            type="date"
                            className="bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-600 mb-1">Hasta</label>
                        <input
                            type="date"
                            className="bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-600 mb-1">Departamento</label>
                        <select
                            className="bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={filters.department}
                            onChange={e => setFilters({ ...filters, department: e.target.value })}
                        >
                            <option value="">Todos los departamentos</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shrink-0">
                        Filtrar
                    </button>
                </form>
            </div>

            {/* Listas Destacadas Sobrias ERP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Top Performers */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Puntuaciones Destacadas</h3>
                        <span className="text-[11px] text-gray-400 font-mono">Mejores Resultados</span>
                    </div>
                    <div className="divide-y divide-gray-100 text-xs">
                        {data.topPerformers.map(p => (
                            <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">{p.name}</p>
                                    <p className="text-[11px] text-gray-400">{p.department}</p>
                                </div>
                                <span className="font-mono font-semibold text-green-700 text-sm" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                    {p.score} / {data.maxScale || (p.score > 5 ? 100 : 5.0)}
                                </span>
                            </div>
                        ))}
                        {data.topPerformers.length === 0 && <div className="p-4 text-center text-gray-400 text-xs">Sin evaluaciones destacadas.</div>}
                    </div>
                </div>

                {/* Requieren Atención */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Atención Requerida</h3>
                        <span className="text-[11px] text-gray-400 font-mono">Plan de Mejora</span>
                    </div>
                    <div className="divide-y divide-gray-100 text-xs">
                        {data.lowPerformers.map(p => (
                            <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">{p.name}</p>
                                    <p className="text-[11px] text-gray-400">{p.department}</p>
                                </div>
                                <span className="font-mono font-semibold text-red-700 text-sm" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                    {p.score} / {data.maxScale || (p.score > 5 ? 100 : 5.0)}
                                </span>
                            </div>
                        ))}
                        {data.lowPerformers.length === 0 && <div className="p-4 text-center text-gray-400 text-xs">Sin registros de puntuación baja.</div>}
                    </div>
                </div>
            </div>

            {/* Gráficos ERP */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Promedio por Departamento</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.avgScoreByDept} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" domain={[0, data.maxScale || 100]} stroke="#6b7280" fontSize={11} />
                                <YAxis dataKey="department" type="category" width={90} stroke="#6b7280" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                                <Bar dataKey="average" fill="#2563eb" name="Promedio" radius={[0, 2, 2, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Distribución de Calificaciones</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.distributionChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="range" stroke="#6b7280" fontSize={11} />
                                <YAxis stroke="#6b7280" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                                <Bar dataKey="count" fill="#4b5563" name="Empleados" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Tabla Detallada ERP */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Resultados Detallados</h3>
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
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cargo</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Score</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Recomendación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.detailedList.map(item => {
                                const isHigh = data.isScale100 ? item.score >= 85 : item.score >= 4;
                                const isMid = data.isScale100 ? item.score >= 70 : item.score >= 3;
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-2.5 px-4 font-medium text-gray-900">{item.employeeName}</td>
                                        <td className="py-2.5 px-4 text-gray-600">{item.department}</td>
                                        <td className="py-2.5 px-4 text-gray-500">{item.position}</td>
                                        <td className="py-2.5 px-4 text-center font-mono font-semibold" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                            <span className={isHigh ? 'text-green-700' : isMid ? 'text-amber-700' : 'text-red-700'}>
                                                {item.score}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                                isHigh ? 'bg-green-50 text-green-800 border border-green-200' :
                                                isMid ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                                'bg-red-50 text-red-800 border border-red-200'
                                            }`}>
                                                {item.recommendation}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {data.detailedList.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 text-xs">No hay evaluaciones completadas en este periodo.</td>
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
