import { useState, useEffect } from 'react';
import { getPayrollCostReport } from '../../services/analytics.service';
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

    if (loading) return <div className="p-8 text-center text-gray-400 text-xs">Calculando costos de nómina...</div>;
    if (!data) return <div className="p-8 text-center text-gray-400 text-xs">No hay registros de nómina disponibles.</div>;

    const COLORS = ['#2563eb', '#166534', '#d97706', '#4b5563'];

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-gray-200">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Analíticas · Finanzas</p>
                    <h1 className="text-xl font-semibold text-gray-900">Reporte de Costos de Nómina</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Análisis financiero de sueldos base, horas extra, aportes e impositivos.</p>
                </div>

                <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-2 bg-white p-3 rounded border border-gray-200 w-full lg:w-auto text-xs">
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
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado Financiero de Nómina</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 text-xs">
                    <div className="p-4 flex flex-col justify-between">
                        <span className="text-gray-500">Costo Total del Periodo</span>
                        <span className="text-base font-semibold text-gray-900 font-mono mt-1" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            ${data.metrics?.totalCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} USD
                        </span>
                    </div>
                    <div className="p-4 flex flex-col justify-between">
                        <span className="text-gray-500">Promedio Mensual</span>
                        <span className="text-base font-semibold text-gray-900 font-mono mt-1" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            ${data.metrics?.avgMonthlyCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} USD
                        </span>
                    </div>
                    <div className="p-4 flex flex-col justify-between">
                        <span className="text-gray-500">Registros Procesados</span>
                        <span className="text-base font-semibold text-gray-900 font-mono mt-1" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {data.metrics.headcount} nóminas
                        </span>
                    </div>
                </div>
            </div>

            {/* Gráfico Principal de Tendencia */}
            <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Tendencia de Costos de Nómina</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.charts.trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                            <YAxis stroke="#6b7280" fontSize={11} />
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                            <Area type="monotone" dataKey="total" stroke="#166534" fill="#f0fdf4" fillOpacity={0.8} name="Total" />
                            <Area type="monotone" dataKey="salary" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} name="Salario Base" />
                            <Area type="monotone" dataKey="overtime" stackId="1" stroke="#d97706" fill="#d97706" fillOpacity={0.2} name="Horas Extra" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Desglose de Composición y Departamentos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Composición Estructurada del Costo</h3>
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.charts.breakdown} cx="50%" cy="50%" outerRadius={70} fill="#2563eb" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {data.charts.breakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Distribución por Departamento</h3>
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.charts.byDepartment} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                                <XAxis type="number" stroke="#6b7280" fontSize={11} />
                                <YAxis dataKey="name" type="category" width={90} stroke="#6b7280" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                                <Bar dataKey="value" fill="#2563eb" barSize={16} radius={[0, 2, 2, 0]}>
                                    {data.charts.byDepartment.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Acción de Exportar */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={() => {
                        if (!data) return;
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
                    className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                    Descargar Reporte Financiero CSV
                </button>
            </div>
        </div>
    );
};

export default PayrollCostReport;
