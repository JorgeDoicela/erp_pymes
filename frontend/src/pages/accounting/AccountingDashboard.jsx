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

            {/* Resumen Contable ERP */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Métricas Financieras</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 text-xs">
                    <div className="p-4">
                        <p className="text-gray-500 mb-1">Comprobantes Contables</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {stats.entries}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Generados históricamente</p>
                    </div>
                    <div className="p-4">
                        <p className="text-gray-500 mb-1">Cuentas con Saldo</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {stats.balanceCount}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Impactadas en el periodo actual</p>
                    </div>
                    <div className="p-4">
                        <p className="text-gray-500 mb-1">Periodos Fiscales</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {stats.periods}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Años y meses fiscales</p>
                    </div>
                </div>
            </div>

            {/* Alerta / Nota Integración ERP */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 flex items-start gap-2.5">
                <FiCheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <span className="font-semibold text-gray-900">Integración Automática de Nómina Activa</span>
                    <p className="text-gray-500 mt-0.5">Los diarios de pagos desde el Módulo de Nómina pueden importarse directamente con validación de doble partida.</p>
                </div>
            </div>

            {/* Accesos Rápidos Contables — Grilla ERP */}
            <div className="space-y-3">
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Módulos de Gestión Contable</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Link to="/admin/accounting/chart" className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors group flex items-start gap-3">
                        <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
                            <FiFolder size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Catálogo de Cuentas</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">Configura la jerarquía financiera (Activo, Pasivo, Gastos) según NIIF.</p>
                        </div>
                    </Link>

                    <Link to="/admin/accounting/journals" className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors group flex items-start gap-3">
                        <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
                            <FiFileText size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Libro Diario</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">Registra y mayoriza comprobantes contables de personal.</p>
                        </div>
                    </Link>

                    <Link to="/admin/accounting/reports/trial-balance" className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors group flex items-start gap-3">
                        <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
                            <FiLayers size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Balance de Comprobación</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">Resumen de saldos débitos y créditos del periodo.</p>
                        </div>
                    </Link>

                    <Link to="/admin/accounting/periods" className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors group flex items-start gap-3">
                        <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
                            <FiCalendar size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Periodos Fiscales</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">Apertura y cierre de periodos para bloqueo de asientos.</p>
                        </div>
                    </Link>

                    <Link to="/admin/accounting/cost-centers" className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors group flex items-start gap-3">
                        <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
                            <FiPieChart size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Centros de Costo</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">Imputación de gastos por departamento u operación.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AccountingDashboard;
