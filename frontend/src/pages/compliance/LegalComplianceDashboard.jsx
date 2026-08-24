import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    getComplianceAlerts,
    getStatutoryProvisions
} from '../../services/compliance/compliance.service';
import ExportButtons from '../../components/common/ExportButtons';
import useAutoSync from '../../hooks/useAutoSync.js';
import {
    ShieldExclamationIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    BanknotesIcon,
    ArrowPathIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

const LegalComplianceDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('ALERTS'); // ALERTS | PROVISIONS
    const [loading, setLoading] = useState(true);

    // Data states
    const [alertsData, setAlertsData] = useState({ summary: {}, alerts: [] });
    const [provisionsData, setProvisionsData] = useState({ summary: {}, byDepartment: [], provisionsList: [] });

    // Filter for provisions
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const loadData = async (isSilent = false) => {
        if (!isSilent && !alertsData.alerts.length) setLoading(true);
        try {
            const [resAlerts, resProvisions] = await Promise.all([
                getComplianceAlerts().catch(() => ({ data: { summary: {}, alerts: [] } })),
                getStatutoryProvisions(selectedMonth, selectedYear).catch(() => ({ data: { summary: {}, byDepartment: [], provisionsList: [] } }))
            ]);

            if (resAlerts.success) setAlertsData(resAlerts.data);
            if (resProvisions.success) setProvisionsData(resProvisions.data);
        } catch (error) {
            console.error('Error al cargar panel de cumplimiento:', error);
        } finally {
            setLoading(false);
        }
    };

    const { lastSynced, isSyncing, triggerSync } = useAutoSync(
        () => loadData(true),
        { intervalMs: 20000 }
    );

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear]);

    const getUrgencyBadge = (urgency, daysRemaining) => {
        switch (urgency) {
            case 'CRITICAL':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"><ExclamationTriangleIcon className="w-4 h-4" /> Vence en {daysRemaining} días (CRÍTICO)</span>;
            case 'HIGH':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"><ClockIcon className="w-4 h-4" /> Vence en {daysRemaining} días</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">En monitoreo ({daysRemaining} días)</span>;
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'PROBATION_PERIOD':
                return <UserGroupIcon className="w-6 h-6 text-amber-600" />;
            case 'CONTRACT_EXPIRATION':
                return <DocumentTextIcon className="w-6 h-6 text-rose-600" />;
            default:
                return <ShieldExclamationIcon className="w-6 h-6 text-blue-600" />;
        }
    };

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Recursos Humanos · Cumplimiento Legal</p>
                    <h1 className="text-xl font-semibold text-gray-900">Cumplimiento Legal y Provisiones de Ley</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Monitoreo de vencimientos laborales y matriz de provisiones patronales.
                    </p>
                </div>
            </div>

            {/* Navegación por Pestañas ERP */}
            <div className="flex border-b border-gray-200 overflow-x-auto gap-6 text-xs">
                <button
                    onClick={() => setActiveTab('ALERTS')}
                    className={`pb-2.5 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        activeTab === 'ALERTS'
                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    Centro de Alertas ({alertsData.summary?.totalAlerts || 0})
                </button>
                <button
                    onClick={() => setActiveTab('PROVISIONS')}
                    className={`pb-2.5 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        activeTab === 'PROVISIONS'
                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    Provisiones Sociales
                </button>
            </div>

            {/* TAB 1: ALERTAS PREVENTIVAS */}
            {activeTab === 'ALERTS' && (
                <div className="space-y-4">
                    {/* Barra de Estado Rápido de Alertas */}
                    <div className="bg-white p-3 rounded border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Críticas (&lt;10 días)</span>
                                <span className={`font-semibold tabular-nums ${(alertsData.summary?.criticalCount || 0) > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                                    {alertsData.summary?.criticalCount || 0}
                                </span>
                            </div>
                            <div className="w-px h-6 bg-gray-200" />
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Períodos de Prueba</span>
                                <span className="font-semibold text-gray-900 tabular-nums">
                                    {alertsData.summary?.probationCount || 0}
                                </span>
                            </div>
                            <div className="w-px h-6 bg-gray-200" />
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Contratos por Vencer</span>
                                <span className="font-semibold text-gray-900 tabular-nums">
                                    {alertsData.summary?.contractCount || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="bg-white p-12 text-center text-gray-400 rounded border border-gray-200 text-xs font-mono">Cargando alertas...</div>
                        ) : alertsData.alerts.length === 0 ? (
                            <div className="bg-white p-12 text-center text-gray-500 rounded border border-gray-200 space-y-2">
                                <CheckCircleIcon className="w-8 h-8 text-emerald-600 mx-auto" />
                                <p className="font-semibold text-sm text-gray-900">Sin alertas pendientes</p>
                                <p className="text-xs text-gray-500">No se detectaron contratos vencidos ni períodos de prueba urgentes.</p>
                            </div>
                        ) : (
                            alertsData.alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={`p-4 rounded border bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${alert.urgency === 'CRITICAL' ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 bg-gray-100 rounded border border-gray-200 shrink-0">
                                            {getTypeIcon(alert.type)}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900 text-xs">{alert.title}</h4>
                                                {getUrgencyBadge(alert.urgency, alert.daysRemaining)}
                                            </div>
                                            <p className="text-xs text-gray-600">{alert.description}</p>
                                            <p className="text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                                                Acción: {alert.actionRequired}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 self-end md:self-auto shrink-0">
                                        {alert.type === 'PROBATION_PERIOD' && (
                                            <button
                                                onClick={() => navigate('/admin/contracts/expiring')}
                                                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                                            >
                                                Evaluar / Renovar
                                            </button>
                                        )}
                                        {alert.type === 'CONTRACT_EXPIRATION' && (
                                            <button
                                                onClick={() => navigate('/admin/offboarding')}
                                                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                                            >
                                                Gestionar Salida
                                            </button>
                                        )}
                                        {alert.type === 'DOCUMENT_EXPIRATION' && (
                                            <button
                                                onClick={() => navigate(`/admin/expedientes/${alert.employee?.id}`)}
                                                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium transition-colors"
                                            >
                                                Ver Expediente
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: MATRIZ DE PROVISIONES SOCIALES */}
            {activeTab === 'PROVISIONS' && (
                <div className="space-y-5">
                    {/* Period Selector & Export */}
                    <div className="bg-white p-4 rounded border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-medium text-gray-700">Período de Provisión:</label>
                            <select
                                className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 font-medium focus:outline-none"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es-EC', { month: 'long' })}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 font-medium w-20 focus:outline-none"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right font-mono text-xs hidden sm:block">
                                <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-sans">Total Provisiones Mes</span>
                                <span className="font-semibold text-gray-900 tabular-nums">
                                    ${(provisionsData.summary?.totalCompanyProvisions || 0).toFixed(2)} USD
                                </span>
                            </div>
                            <ExportButtons type="statutory_provisions" fileName={`Provisiones_Sociales_${selectedMonth}_${selectedYear}`} />
                        </div>
                    </div>

                    {/* Department Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {provisionsData.byDepartment.map((dept, idx) => (
                            <div key={idx} className="bg-white p-4 rounded border border-gray-200 space-y-2.5">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <h4 className="font-semibold text-gray-800 text-xs flex items-center gap-1.5">
                                        <BuildingOfficeIcon className="w-3.5 h-3.5 text-blue-600" />
                                        {dept.department}
                                    </h4>
                                    <span className="text-[11px] font-mono text-gray-400">{dept.employeeCount} emp.</span>
                                </div>
                                <div className="space-y-1 text-xs text-gray-600 font-mono">
                                    <div className="flex justify-between"><span>Sueldo Base Total:</span><span className="font-semibold text-gray-900 tabular-nums">${dept.totalBaseSalary.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>13er Sueldo (8.33%):</span><span className="tabular-nums">${dept.thirteenth.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>14to Sueldo (SBU/12):</span><span className="tabular-nums">${dept.fourteenth.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Fondos de Reserva:</span><span className="tabular-nums">${dept.reserveFund.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-1"><span>Provisión Total:</span><span className="tabular-nums text-blue-600">${dept.totalProvisions.toFixed(2)}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Employee Provisions Table */}
                    <div className="bg-white rounded border border-gray-200 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-200">
                            <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Detalle Individual por Colaborador</h4>
                        </div>

                        {/* VISTA MÓVIL: Tarjetas Apiladas (Cero scroll horizontal) */}
                        <div className="block md:hidden divide-y divide-gray-100">
                            {provisionsData.provisionsList.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-xs italic">
                                    Sin datos de provisiones para el período seleccionado.
                                </div>
                            ) : (
                                provisionsData.provisionsList.map(prov => (
                                    <div key={prov.employee.id} className="p-4 space-y-2 bg-white">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-xs">
                                                    {prov.employee.firstName} {prov.employee.lastName}
                                                </p>
                                                <p className="text-[11px] text-gray-400">{prov.employee.department || 'General'}</p>
                                            </div>
                                            <span className="font-mono font-semibold text-gray-900 text-xs tabular-nums">
                                                ${prov.totalEmpProvision.toFixed(2)} USD
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded border border-gray-100 font-mono">
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-sans font-medium uppercase block">Sueldo Base</span>
                                                <span className="text-gray-800 font-medium">${prov.baseSalary.toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-sans font-medium uppercase block">13er Sueldo</span>
                                                <span className="text-gray-800">${prov.thirteenthProvision.toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-sans font-medium uppercase block">14to Sueldo</span>
                                                <span className="text-gray-800">${prov.fourteenthProvision.toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-400 font-sans font-medium uppercase block">Fondos Reserva</span>
                                                <span className="text-gray-800">
                                                    {prov.hasReserveFund ? `$${prov.reserveFundProvision.toFixed(2)}` : '<1 Año'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* VISTA ESCRITORIO: Tabla Completa */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-xs text-left text-gray-700">
                                <thead className="bg-gray-50/80 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200">
                                    <tr>
                                        <th className="p-3.5">Empleado</th>
                                        <th className="p-3.5 text-right">Sueldo Base</th>
                                        <th className="p-3.5 text-right">13er Sueldo</th>
                                        <th className="p-3.5 text-right">14to Sueldo</th>
                                        <th className="p-3.5 text-right">Fondos Reserva</th>
                                        <th className="p-3.5 text-right">Vacaciones</th>
                                        <th className="p-3.5 text-right font-semibold text-gray-900">Total Provisión Mes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {provisionsData.provisionsList.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-400">Sin datos de provisiones para el período seleccionado.</td></tr>
                                    ) : (
                                        provisionsData.provisionsList.map(prov => (
                                            <tr key={prov.employee.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="p-3.5 font-semibold text-gray-900">
                                                    {prov.employee.firstName} {prov.employee.lastName}
                                                    <p className="text-[11px] font-normal text-gray-400">{prov.employee.department || 'General'}</p>
                                                </td>
                                                <td className="p-3.5 text-right font-mono tabular-nums">${prov.baseSalary.toFixed(2)}</td>
                                                <td className="p-3.5 text-right font-mono tabular-nums">${prov.thirteenthProvision.toFixed(2)}</td>
                                                <td className="p-3.5 text-right font-mono tabular-nums">${prov.fourteenthProvision.toFixed(2)}</td>
                                                <td className="p-3.5 text-right font-mono tabular-nums">
                                                    {prov.hasReserveFund ? `$${prov.reserveFundProvision.toFixed(2)}` : <span className="text-gray-400 text-[11px]">&lt;1 Año</span>}
                                                </td>
                                                <td className="p-3.5 text-right font-mono tabular-nums">${prov.vacationProvision.toFixed(2)}</td>
                                                <td className="p-3.5 text-right font-mono font-semibold text-gray-900 tabular-nums">
                                                    ${prov.totalEmpProvision.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LegalComplianceDashboard;
