import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPeriods, getJournalEntries, getTrialBalance } from '../../services/accounting.service';
import { FiTrendingUp, FiBookOpen, FiBriefcase, FiAlertCircle, FiFolder, FiFileText, FiPieChart, FiCalendar, FiCheckCircle, FiLayers } from 'react-icons/fi';

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
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Contabilidad · Gestión Financiera</p>
                    <h1 className="text-xl font-semibold text-gray-900">Consola Contable y Financiera</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gestión contable orientada al registro de gastos de personal, liquidaciones y nómina.</p>
                </div>
            </div>

            {/* Layout Contable: Módulos a la izquierda, Estado Contable a la derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Columna de Módulos Contables */}
                <div className="lg:col-span-8 space-y-3">
                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Módulos de Gestión Contable</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Link to="/admin/accounting/chart" className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors group flex items-start gap-3">
                            <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
                                <FiFolder size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Plan de Cuentas</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5">Jerarquía financiera (Activo, Pasivo, Gastos) bajo NIIF.</p>
                            </div>
                        </Link>

                        <Link to="/admin/accounting/journals" className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors group flex items-start gap-3">
                            <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
                                <FiFileText size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Libro Diario</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5">Registro y balance de comprobantes de nómina.</p>
                            </div>
                        </Link>

                        <Link to="/admin/accounting/reports/trial-balance" className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors group flex items-start gap-3">
                            <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
                                <FiLayers size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Balance de Comprobación</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5">Saldos débitos y créditos del periodo fiscal.</p>
                            </div>
                        </Link>

                        <Link to="/admin/accounting/periods" className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors group flex items-start gap-3">
                            <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
                                <FiCalendar size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Periodos Fiscales</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5">Apertura y cierre de periodos para bloqueo contable.</p>
                            </div>
                        </Link>

                        <Link to="/admin/accounting/cost-centers" className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors group flex items-start gap-3 sm:col-span-2">
                            <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
                                <FiPieChart size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Centros de Costo</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5">Distribución e imputación de gastos por departamento o sede.</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Columna Lateral (Estado Contable & Integración) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado del Ejercicio</h3>
                            <span className="text-[10px] font-mono text-gray-400">ACTIVO</span>
                        </div>
                        <div className="divide-y divide-gray-100 font-mono text-xs">
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-gray-600">Comprobantes</span>
                                <span className="font-semibold text-gray-900 tabular-nums">{stats.entries} generados</span>
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-gray-600">Cuentas con saldo</span>
                                <span className="font-semibold text-gray-900 tabular-nums">{stats.balanceCount} activas</span>
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-gray-600">Periodos registrados</span>
                                <span className="text-gray-700 tabular-nums">{stats.periods}</span>
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-gray-600">Integración Nómina</span>
                                <span className="text-green-700 font-semibold">Conectada ✓</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-3.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 flex items-start gap-2.5">
                        <FiCheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                            Los asientos de cierre de nómina se validan bajo partida doble automáticamente antes de mayorizar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingDashboard;
