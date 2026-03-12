import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPeriods, getJournalEntries, getTrialBalance } from '../../services/accounting.service';
import { FiTrendingUp, FiActivity, FiBriefcase, FiAlertCircle, FiFolder, FiFileText, FiPieChart, FiCalendar, FiCheckCircle } from 'react-icons/fi';

const AccountingDashboard = () => {
    const [stats, setStats] = useState({ periods: 0, entries: 0, balanceCount: 0 });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const periodsData = await getPeriods();
                const latestPeriod = periodsData.find(p => p.status === 'OPEN') || periodsData[0];

                const [j, b] = await Promise.all([
                    getJournalEntries(),
                    getTrialBalance(latestPeriod?.id)
                ]);

                // Filtrar asientos del último periodo para las estadísticas rápidas si es posible
                const recentEntries = latestPeriod
                    ? j.filter(e => {
                        const d = new Date(e.date);
                        return d.getFullYear() === latestPeriod.year && (d.getMonth() + 1) === latestPeriod.month;
                    })
                    : j;

                setStats({
                    periods: periodsData.length,
                    entries: recentEntries.length,
                    balanceCount: b.length
                });
            } catch (err) { }
        };
        fetchDashboard();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-900/20">
                <h1 className="text-3xl font-bold mb-2">Contabilidad Financiera RRHH</h1>
                <p className="text-indigo-100 max-w-2xl text-lg">
                    Gestión contable aislada y profesional orientada al registro de gastos de personal,
                    liquidaciones, aportes y nómina generados en el sistema.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex gap-4 items-center mb-4">
                        <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                            <FiActivity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Comprobantes</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.entries}</h3>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">Total de comprobantes generados históricamente en todos los periodos.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex gap-4 items-center mb-4">
                        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                            <FiTrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cuentas con Saldo</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.balanceCount}</h3>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">Cuentas del catálogo impactadas económicamente por la nómina actual.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex gap-4 items-center mb-4">
                        <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
                            <FiBriefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Periodos Fiscales</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.periods}</h3>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">Años y meses fiscales registrados en el sistema financiero paralelo.</p>
                </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200 flex items-start gap-4">
                <FiCheckCircle className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                <div>
                    <h4 className="text-indigo-800 font-bold mb-1">Nexus de Generación Automática Activo</h4>
                    <p className="text-indigo-700/80 text-sm leading-relaxed">
                        El sistema ahora cuenta con integración directa. El contador puede importar
                        automáticamente los diarios de pagos desde el Módulo de Nómina, asegurando que los gastos de
                        personal se reflejen en la contabilidad sin errores manuales y con total trazabilidad.
                    </p>
                </div>
            </div>

            <div className="pt-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Accesos Rápidos Contables</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/admin/accounting/chart" className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex justify-center items-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <FiFolder className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">Catálogo de Cuentas</h3>
                            <p className="text-slate-500 text-sm mt-1">Configura la jerarquía financiera (Activo, Pasivo, Gastos, etc) usando estándares NIIF.</p>
                        </div>
                    </Link>

                    <Link to="/admin/accounting/journals" className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:blue-200 transition-all flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex justify-center items-center text-blue-600 group-hover:scale-110 transition-transform">
                            <FiFileText className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Libro Diario</h3>
                            <p className="text-slate-500 text-sm mt-1">Registra y mayoriza comprobantes contables con validación de partida doble.</p>
                        </div>
                    </Link>

                    <Link to="/admin/accounting/reports/trial-balance" className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:emerald-200 transition-all flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex justify-center items-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <FiActivity className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Balance de Comprobación</h3>
                            <p className="text-slate-500 text-sm mt-1">Resumen de saldos débitos y créditos acumulados en el periodo actual.</p>
                        </div>
                    </Link>

                    <Link to="/admin/accounting/periods" className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:amber-200 transition-all flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex justify-center items-center text-amber-600 group-hover:scale-110 transition-transform">
                            <FiCalendar className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Periodos Fiscales</h3>
                            <p className="text-slate-500 text-sm mt-1">Configura y cierra los periodos mensuales para bloqueo de asientos.</p>
                        </div>
                    </Link>

                    <Link to="/admin/accounting/cost-centers" className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:rose-200 transition-all flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex justify-center items-center text-rose-600 group-hover:scale-110 transition-transform">
                            <FiPieChart className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-700 transition-colors">Centros de Costo</h3>
                            <p className="text-slate-500 text-sm mt-1">Organiza tus gastos por departamentos (Administración, Operaciones, etc).</p>
                        </div>
                    </Link>
                </div>
            </div>

        </div>
    );
};

export default AccountingDashboard;
