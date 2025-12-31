import React, { useState, useEffect } from 'react';
import * as reportService from '../../services/reports/reportService';
import { getEmployees } from '../../services/employees/employee.service'; // Need to import this
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AttendanceReports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]); // List for dropdown

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
        <div className={`p-6 rounded-xl border ${color} bg-slate-800/50`}>
            <p className="text-slate-400 text-sm mb-1">{title}</p>
            <p className={`text-3xl font-bold ${text}`}>{value}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8">
                Reportes de Asistencia
            </h1>

            {/* Filters */}
            <div className="bg-slate-800 p-6 rounded-xl border border-white/5 mb-8 flex flex-col lg:flex-row gap-4 items-end flex-wrap">
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Desde</label>
                    <input
                        type="date"
                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Hasta</label>
                    <input
                        type="date"
                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Departamento</label>
                    <select
                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white w-40"
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
                    <label className="block text-sm text-slate-400 mb-1">Empleado</label>
                    <select
                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white w-48"
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
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold h-10 transition-colors"
                >
                    {loading ? 'Generando...' : 'Generar'}
                </button>

                {stats && (
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={handleExportCSV}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold h-10 transition-colors flex items-center gap-2 text-sm"
                        >
                            📊 Excel
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold h-10 transition-colors flex items-center gap-2 text-sm"
                        >
                            📄 PDF
                        </button>
                    </div>
                )}
            </div>

            {/* Results */}
            {stats && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                        <StatusCard title="Empleados" value={stats.summary.totalEmployees} color="border-slate-700" text="text-white" />
                        <StatusCard title="Tasa Asistencia" value={`${stats.summary.attendanceRate}%`} color="border-blue-500/30" text="text-blue-400" />
                        <StatusCard title="Atrasos" value={stats.summary.late} color="border-yellow-500/30" text="text-yellow-400" />
                        <StatusCard title="Faltas" value={stats.summary.absent} color="border-red-500/30" text="text-red-400" />
                        <StatusCard title="Horas Extra Total" value={stats.summary.totalOvertime} color="border-purple-500/30" text="text-purple-400" />
                    </div>

                    {/* Chart Section */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-white/5 mb-8">
                        <h3 className="font-bold mb-4">Tendencias de Asistencia</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.details}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickFormatter={(val) => val.split(' ')[0]} />
                                    <YAxis stroke="#cbd5e1" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        cursor={{ fill: '#33415550' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="present" name="Asistencias" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="late" name="Atrasos" fill="#facc15" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="absent" name="Faltas" fill="#f87171" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-slate-800/80 backdrop-blur-sm">
                            <h3 className="font-bold">Detalle por Empleado</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-slate-400 bg-slate-900/50">
                                    <tr>
                                        <th className="p-4 font-medium">Empleado</th>
                                        <th className="p-4 font-medium">Depto</th>
                                        <th className="p-4 font-medium text-center">Asist.</th>
                                        <th className="p-4 font-medium text-center">Atrasos</th>
                                        <th className="p-4 font-medium text-center">Justif.</th>
                                        <th className="p-4 font-medium text-center">Faltas</th>
                                        <th className="p-4 font-medium text-center">Tasa %</th>
                                        <th className="p-4 font-medium text-right">Hrs Trab.</th>
                                        <th className="p-4 font-medium text-right text-purple-400">Hrs Extra</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stats.details.map(row => (
                                        <tr key={row.id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4 font-medium text-white">{row.name}</td>
                                            <td className="p-4 text-slate-400">{row.department}</td>
                                            <td className="p-4 text-center text-blue-200">{row.present}</td>
                                            <td className="p-4 text-center text-yellow-500 font-bold">{row.late > 0 ? row.late : '-'}</td>
                                            <td className="p-4 text-center text-slate-400">{row.excused}</td>
                                            <td className="p-4 text-center text-red-400 font-bold">{row.absent > 0 ? row.absent : '-'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${row.attendanceRate >= 95 ? 'bg-green-500/20 text-green-400' :
                                                    row.attendanceRate >= 85 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {row.attendanceRate.toFixed(0)}%
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-mono text-slate-300">{row.workedHours.toFixed(1)}</td>
                                            <td className="p-4 text-right font-mono text-purple-400 font-bold">{row.overtime > 0 ? row.overtime.toFixed(1) : '-'}</td>
                                        </tr>
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
