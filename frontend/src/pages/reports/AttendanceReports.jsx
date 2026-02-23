import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as reportService from '../../services/reports/reportService';
import { getEmployees } from '../../services/employees/employee.service'; // Need to import this
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AttendanceReports = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]); // List for dropdown
    const [expandedRow, setExpandedRow] = useState(null);

    // Default: Last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [filters, setFilters] = useState({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        department: '',
        employeeId: ''
    });

    const departments = ['IT', 'RRHH', 'Ventas', 'Contabilidad', 'Operaciones'];

    useEffect(() => {
        window.scrollTo(0, 0);
        loadEmployees();
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

    const loadReport = async () => {
        setLoading(true);
        try {
            const res = await reportService.getAttendanceReport(
                filters.startDate,
                filters.endDate,
                filters.department,
                filters.employeeId
            );
            if (res.success) setStats(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!stats) return;
        let csv = "ID,Nombre,Departamento,Presente(Días),Atrasos(Días),Ausencias,Justificadas,Horas Trabajadas,Horas Extra,Tasa Asistencia%\n";
        stats.details.forEach(row => {
            csv += `"${row.id}","${row.name}","${row.department}",${row.present},${row.late},${row.absent},${row.excused},${row.workedHours},${row.overtime},${row.attendanceRate.toFixed(2)}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${filters.startDate}_${filters.endDate}.csv`;
        a.click();
    };

    const handleExportPDF = () => {
        try {
            if (!stats) return;
            const doc = new jsPDF();

            // Title
            doc.setFontSize(18);
            doc.text('Reporte de Asistencia', 14, 20);

            doc.setFontSize(10);
            doc.text(`Desde: ${filters.startDate}  Hasta: ${filters.endDate}`, 14, 30);
            doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 35);

            // Stats Summary
            doc.text(`Asistencia Global: ${stats.summary.attendanceRate}%`, 14, 45);
            doc.text(`Total Atrasos: ${stats.summary.late}`, 80, 45);
            doc.text(`Total Faltas: ${stats.summary.absent}`, 140, 45);

            // Table
            const tableColumn = ["Nombre", "Depto", "Asist.", "Atrasos", "Justif.", "Faltas", "Hrs Trab.", "Hrs Extra", "%"];
            const tableRows = [];

            stats.details.forEach(row => {
                const rowData = [
                    row.name,
                    row.department,
                    row.present,
                    row.late,
                    row.excused,
                    row.absent,
                    row.workedHours,
                    row.overtime,
                    row.attendanceRate.toFixed(0) + '%'
                ];
                tableRows.push(rowData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 55,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] }
            });

            doc.save(`reporte_${filters.startDate}_${filters.endDate}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Error al generar PDF: " + error.message);
        }
    };

    const StatusCard = ({ title, value, color, text }) => (
        <div className={`p-6 rounded-xl border ${color} bg-white shadow-sm hover:shadow-md transition-shadow`}>
            <p className="text-slate-500 text-sm mb-1">{title}</p>
            <p className={`text-3xl font-bold ${text}`}>{value}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    Reportes de Asistencia
                </h1>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm"
                >
                    ← Volver
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm text-slate-500 mb-1 font-medium">Desde</label>
                        <input
                            type="date"
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-500 mb-1 font-medium">Hasta</label>
                        <input
                            type="date"
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-500 mb-1 font-medium">Departamento</label>
                        <select
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={filters.department}
                            onChange={e => setFilters({ ...filters, department: e.target.value })}
                        >
                            <option value="">Todos</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-500 mb-1 font-medium">Empleado</label>
                        <select
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={filters.employeeId}
                            onChange={e => setFilters({ ...filters, employeeId: e.target.value })}
                        >
                            <option value="">Todos</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={loadReport}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold h-10 transition-all shadow-md active:scale-95"
                    >
                        {loading ? 'Generando...' : 'Generar'}
                    </button>
                </div>

                {stats && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={handleExportCSV}
                            className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold h-10 transition-colors flex items-center gap-2 text-sm"
                        >
                            Excel
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex-1 sm:flex-none justify-center bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold h-10 transition-colors flex items-center gap-2 text-sm"
                        >
                            PDF
                        </button>
                    </div>
                )}
            </div>

            {/* Results */}
            {stats && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                        <StatusCard title="Empleados" value={stats.summary.totalEmployees} color="border-slate-200" text="text-slate-800" />
                        <StatusCard title="Tasa Asistencia" value={`${stats.summary.attendanceRate}%`} color="border-blue-200" text="text-blue-600" />
                        <StatusCard title="Atrasos" value={stats.summary.late} color="border-yellow-200" text="text-yellow-600" />
                        <StatusCard title="Faltas" value={stats.summary.absent} color="border-red-200" text="text-red-600" />
                        <StatusCard title="Horas Extra Total" value={stats.summary.totalOvertime} color="border-purple-200" text="text-purple-600" />
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                        <h3 className="font-bold mb-4 text-slate-800">Tendencias de Asistencia</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.details}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickFormatter={(val) => val.split(' ')[0]} />
                                    <YAxis stroke="#64748b" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }}
                                        cursor={{ fill: '#f1f5f9' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="present" name="Asistencias" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="late" name="Atrasos" fill="#eab308" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="absent" name="Faltas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Detalle por Empleado</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[800px]">
                                <thead className="text-left text-slate-500 bg-slate-50">
                                    <tr>
                                        <th className="p-4 font-semibold">Empleado</th>
                                        <th className="p-4 font-semibold">Depto</th>
                                        <th className="p-4 font-semibold text-center">Asist.</th>
                                        <th className="p-4 font-semibold text-center">Atrasos</th>
                                        <th className="p-4 font-semibold text-center">Justif.</th>
                                        <th className="p-4 font-semibold text-center">Faltas</th>
                                        <th className="p-4 font-semibold text-center">Tasa %</th>
                                        <th className="p-4 font-semibold text-right">Hrs Trab.</th>
                                        <th className="p-4 font-semibold text-right text-purple-600">Hrs Extra</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {stats.details.map(row => (
                                        <React.Fragment key={row.id}>
                                            <tr className="hover:bg-blue-50/30 transition-colors border-b border-slate-50">
                                                <td className="p-4 font-medium text-slate-800">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            {expandedRow === row.id ? '▼' : '▶'}
                                                        </button>
                                                        {row.name}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-600">{row.department}</td>
                                                <td className="p-4 text-center text-blue-600">{row.present}</td>
                                                <td className="p-4 text-center text-yellow-600 font-bold">{row.late > 0 ? row.late : '-'}</td>
                                                <td className="p-4 text-center text-slate-500">{row.excused}</td>
                                                <td className="p-4 text-center text-red-600 font-bold">{row.absent > 0 ? row.absent : '-'}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${row.attendanceRate >= 95 ? 'bg-green-100 text-green-700' :
                                                        row.attendanceRate >= 85 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {(row.attendanceRate || 0).toFixed(0)}%
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-mono text-slate-600">{(row.workedHours || 0).toFixed(1)}</td>
                                                <td className="p-4 text-right font-mono text-purple-600 font-bold">{row.overtime > 0 ? (row.overtime || 0).toFixed(1) : '-'}</td>
                                            </tr>
                                            {expandedRow === row.id && (
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan="9" className="p-0">
                                                        <div className="p-6 border-l-4 border-blue-500 bg-white m-4 rounded-xl shadow-inner overflow-hidden">
                                                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                                                Registros Detallados
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                {row.records && row.records.length > 0 ? (
                                                                    row.records.map((rec) => (
                                                                        <div key={rec.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                                                            <div className="flex justify-between items-center mb-3">
                                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                                                    {new Date(rec.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                                                                                </span>
                                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rec.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                                    {rec.status}
                                                                                </span>
                                                                            </div>
                                                                            <div className="space-y-3">
                                                                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-b border-slate-50 pb-1">
                                                                                    <span>IP de Registro:</span>
                                                                                    <span>{rec.ipAddress || 'Sin registrar'}</span>
                                                                                </div>
                                                                                <div className="flex justify-between items-center text-sm">
                                                                                    <span className="text-slate-500">Entrada:</span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-mono font-bold text-slate-700">
                                                                                            {new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                        </span>
                                                                                        {rec.entryLocation ? (
                                                                                            <a
                                                                                                href={`https://www.google.com/maps?q=${rec.entryLocation.lat},${rec.entryLocation.lng}`}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                                                                title="Ver ubicación de entrada"
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                aria-label="Ver ubicación de entrada en Google Maps"
                                                                                            >
                                                                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                                                                </svg>
                                                                                            </a>
                                                                                        ) : (
                                                                                            <span className="text-[10px] text-slate-300 italic" title="No se capturó ubicación">Sin GPS</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex justify-between items-center text-sm border-t border-slate-50 pt-2">
                                                                                    <span className="text-slate-500">Salida:</span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-mono font-bold text-slate-700">
                                                                                            {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                                                        </span>
                                                                                        {rec.exitLocation ? (
                                                                                            <a
                                                                                                href={`https://www.google.com/maps?q=${rec.exitLocation.lat},${rec.exitLocation.lng}`}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                                                                title="Ver ubicación de salida"
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                aria-label="Ver ubicación de salida en Google Maps"
                                                                                            >
                                                                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                                                                </svg>
                                                                                            </a>
                                                                                        ) : rec.checkOut ? (
                                                                                            <span className="text-[10px] text-slate-300 italic">Sin GPS</span>
                                                                                        ) : null}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="col-span-full py-8 text-center text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                                                        No se encontraron registros individuales en este periodo.
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
                </motion.div>
            )}
        </div>
    );
};

export default AttendanceReports;
