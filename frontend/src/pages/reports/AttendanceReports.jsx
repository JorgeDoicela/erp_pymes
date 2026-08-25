import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as reportService from '../../services/reports/reportService';
import { getEmployees, getDepartments } from '../../services/employees/employee.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiArrowLeft } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AttendanceReports = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [expandedRow, setExpandedRow] = useState(null);

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [filters, setFilters] = useState({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        department: '',
        employeeId: ''
    });

    useEffect(() => {
        window.scrollTo(0, 0);
        loadEmployees();
        loadDepartments();
        loadReport();
    }, []);

    const loadEmployees = async () => {
        try {
            const res = await getEmployees();
            if (res.success) setEmployees(res.data);
        } catch (error) {
            console.error("Error loading employees", error);
        }
    }

    const loadDepartments = async () => {
        try {
            const res = await getDepartments();
            if (res.success) setDepartments(res.data);
        } catch (error) {
            console.error("Error loading departments", error);
        }
    }

    const loadReport = async () => {
        setLoading(true);
        try {
            const res = await reportService.getAttendanceReport(
                filters.startDate,
                filters.endDate,
                filters.department,
                filters.employeeId
            );
            if (res.success) {
                setStats(res.data);
            }
        } catch (error) {
            console.error("Error loading report", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!stats || !stats.details) return;

        let csv = "ID,Nombre,Departamento,Presente(Días),Atrasos(Días),Ausencias,Justificadas,Horas Trabajadas,Horas Extra,Tasa Asistencia%\n";
        stats.details.forEach(row => {
            const attRate = Number(row.attendanceRate ?? 0).toFixed(2);
            csv += `"${row.id}","${row.name || ''}","${row.department || ''}",${row.present || 0},${row.late || 0},${row.absent || 0},${row.excused || 0},${Number(row.workedHours ?? 0).toFixed(2)},${Number(row.overtime ?? 0).toFixed(2)},${attRate}%\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_asistencia_${filters.startDate}_${filters.endDate}.csv`;
        a.click();
    };

    const handleExportPDF = () => {
        if (!stats || !stats.details) return;

        try {
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(16);
            doc.text("Reporte Consolidado de Asistencia", 14, 20);
            doc.setFontSize(10);
            doc.text(`Rango: ${filters.startDate} al ${filters.endDate}`, 14, 28);
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString()}`, 14, 34);

            // Resumen Métricas
            doc.setFontSize(12);
            doc.text("Resumen General", 14, 44);
            
            const summaryData = [
                ["Empleados Evaluados", String(stats.summary?.totalEmployees ?? 0)],
                ["Tasa General de Asistencia", `${stats.summary?.attendanceRate ?? 0}%`],
                ["Total Atrasos", String(stats.summary?.late ?? 0)],
                ["Total Faltas", String(stats.summary?.absent ?? 0)],
                ["Horas Extra Total", `${stats.summary?.totalOvertime ?? 0} hrs`]
            ];

            autoTable(doc, {
                startY: 48,
                head: [["Métrica", "Valor"]],
                body: summaryData,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235] }
            });

            // Tabla por Empleado
            const finalY = doc.lastAutoTable?.finalY || 100;
            doc.text("Detalle por Empleado", 14, finalY + 10);

            const employeeRows = stats.details.map(row => [
                row.name || 'N/A',
                row.department || 'N/A',
                String(row.present ?? 0),
                String(row.late ?? 0),
                String(row.excused ?? 0),
                String(row.absent ?? 0),
                `${Number(row.attendanceRate ?? 0).toFixed(0)}%`,
                `${Number(row.workedHours ?? 0).toFixed(1)} hrs`,
                `${Number(row.overtime ?? 0).toFixed(1)} hrs`
            ]);

            autoTable(doc, {
                startY: finalY + 15,
                head: [["Empleado", "Depto", "Asist.", "Atrasos", "Justif.", "Faltas", "Tasa %", "Hrs Trab.", "Hrs Extra"]],
                body: employeeRows,
                theme: 'plain',
                headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], fontStyle: 'bold' }
            });

            doc.save(`reporte_asistencia_${filters.startDate}_${filters.endDate}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Error al generar PDF: " + error.message);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
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
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider font-mono">Control de Jornada</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Reporte de Asistencia Laboral</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Informe consolidado de marcaciones, atrasos, faltas y horas laboradas.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        to="/analytics"
                        className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a Analíticas</span>
                    </Link>
                </div>
            </div>

            {/* Barra de Filtros Form System ERP */}
            <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end text-xs">
                    <div>
                        <label className="block font-medium text-gray-600 mb-1">Desde</label>
                        <input
                            type="date"
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-600 mb-1">Hasta</label>
                        <input
                            type="date"
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-600 mb-1">Departamento</label>
                        <select
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={filters.department}
                            onChange={e => setFilters({ ...filters, department: e.target.value })}
                        >
                            <option value="">Todos los departamentos</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-600 mb-1">Empleado</label>
                        <select
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={filters.employeeId}
                            onChange={e => setFilters({ ...filters, employeeId: e.target.value })}
                        >
                            <option value="">Todos los empleados</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={loadReport}
                        disabled={loading}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer w-full"
                    >
                        {loading ? 'Generando...' : 'Generar Informe'}
                    </button>
                </div>

                {stats && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 justify-end">
                        <button
                            onClick={handleExportCSV}
                            className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                        >
                            Exportar CSV
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                        >
                            Exportar PDF
                        </button>
                    </div>
                )}
            </div>

            {/* Resultados y Métricas ERP */}
            {stats && (
                <div className="space-y-5">
                    {/* Resumen Estilo Informe Contable / Balance */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Resumen Consolidado de Asistencia</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 text-xs">
                            <div className="p-3.5 flex flex-col justify-between">
                                <span className="text-gray-500">Empleados evaluados</span>
                                <span className="text-sm font-semibold text-gray-900 font-mono mt-1" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                    {stats.summary.totalEmployees}
                                </span>
                            </div>
                            <div className="p-3.5 flex flex-col justify-between">
                                <span className="text-gray-500">Tasa general asistencia</span>
                                <span className="text-sm font-semibold text-green-700 font-mono mt-1" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                    {stats.summary.attendanceRate}%
                                </span>
                            </div>
                            <div className="p-3.5 flex flex-col justify-between">
                                <span className="text-gray-500">Total atrasos</span>
                                <span className="text-sm font-semibold text-amber-700 font-mono mt-1" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                    {stats.summary.late}
                                </span>
                            </div>
                            <div className="p-3.5 flex flex-col justify-between">
                                <span className="text-gray-500">Total faltas</span>
                                <span className="text-sm font-semibold text-red-700 font-mono mt-1" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                    {stats.summary.absent}
                                </span>
                            </div>
                            <div className="p-3.5 flex flex-col justify-between">
                                <span className="text-gray-500">Horas extra total</span>
                                <span className="text-sm font-semibold text-gray-900 font-mono mt-1" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                    {stats.summary.totalOvertime} hrs
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Gráfico de Tendencias Sobrio */}
                    <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Tendencias de Marcación</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.details}
                                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickFormatter={(val) => val.split(' ')[0]} />
                                    <YAxis stroke="#6b7280" fontSize={11} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Bar dataKey="present" name="Asistencias" fill="#2563eb" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="late" name="Atrasos" fill="#d97706" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="absent" name="Faltas" fill="#dc2626" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Tabla Principal Detallada */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Detalle por Empleado</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Depto</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Asist.</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Atrasos</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Justif.</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Faltas</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Tasa %</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Hrs Trab.</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Hrs Extra</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stats.details.map(row => (
                                        <React.Fragment key={row.id}>
                                            <tr className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-2.5 px-4 font-medium text-gray-900">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                                                            className="text-gray-400 hover:text-gray-700 text-[10px] font-mono cursor-pointer"
                                                        >
                                                            {expandedRow === row.id ? '▼' : '▶'}
                                                        </button>
                                                        {row.name}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-4 text-gray-600">{row.department}</td>
                                                <td className="py-2.5 px-4 text-center font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{row.present}</td>
                                                <td className="py-2.5 px-4 text-center font-mono text-amber-700 font-semibold" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{row.late > 0 ? row.late : '-'}</td>
                                                <td className="py-2.5 px-4 text-center font-mono text-gray-500" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{row.excused}</td>
                                                <td className="py-2.5 px-4 text-center font-mono text-red-700 font-semibold" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{row.absent > 0 ? row.absent : '-'}</td>
                                                <td className="py-2.5 px-4 text-center font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                                        row.attendanceRate >= 95 ? 'bg-green-50 text-green-800 border border-green-200' :
                                                        row.attendanceRate >= 85 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                                        'bg-red-50 text-red-800 border border-red-200'
                                                    }`}>
                                                        {(row.attendanceRate || 0).toFixed(0)}%
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono text-gray-800" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{(row.workedHours || 0).toFixed(1)}</td>
                                                <td className="py-2.5 px-4 text-right font-mono text-gray-800 font-medium" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{row.overtime > 0 ? (row.overtime || 0).toFixed(1) : '-'}</td>
                                            </tr>
                                            {expandedRow === row.id && (
                                                <tr className="bg-gray-50/50">
                                                    <td colSpan="9" className="p-3">
                                                        <div className="bg-white p-3 rounded border border-gray-200 space-y-2">
                                                            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Registros Detallados de Marcación</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                {row.records && row.records.length > 0 ? (
                                                                    row.records.map((rec) => (
                                                                        <div key={rec.id} className="bg-gray-50/70 p-2.5 rounded border border-gray-100 text-xs space-y-1">
                                                                            <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono">
                                                                                <span>{new Date(rec.date).toLocaleDateString('es-EC')}</span>
                                                                                <span className="font-semibold text-gray-700">{rec.status}</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-xs font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                                                <span className="text-gray-500">Entrada:</span>
                                                                                <span className="font-medium text-gray-900">{new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-xs font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                                                <span className="text-gray-500">Salida:</span>
                                                                                <span className="font-medium text-gray-900">{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="col-span-full py-4 text-center text-gray-400 text-xs">
                                                                        No hay registros detallados en este periodo.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceReports;
