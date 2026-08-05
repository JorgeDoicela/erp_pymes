import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    getComplianceAlerts, 
    getStatutoryProvisions 
} from '../../services/compliance/compliance.service';
import ExportButtons from '../../components/common/ExportButtons';
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

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear]);

    const loadData = async () => {
        setLoading(true);
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <ShieldExclamationIcon className="w-8 h-8 text-blue-600" />
                        Cumplimiento Legal y Provisiones de Ley
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Monitoreo preventivo de vencimientos laborales y matriz de provisiones sociales patronales
                    </p>
                </div>

                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('ALERTS')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'ALERTS'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        🚨 Centro de Alertas ({alertsData.summary?.totalAlerts || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('PROVISIONS')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === 'PROVISIONS'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <BanknotesIcon className="w-4 h-4" />
                        Provisiones Sociales
                    </button>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-gradient-to-br from-rose-600 to-red-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <p className="text-rose-100 text-xs font-bold uppercase tracking-wider">Alertas Críticas (&lt;10 días)</p>
                    <h3 className="text-3xl font-black mt-2">{alertsData.summary?.criticalCount || 0}</h3>
                    <p className="text-xs text-rose-100/90 mt-1">Vencimientos inmediatos</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">Períodos de Prueba (90d)</p>
                    <h3 className="text-3xl font-black mt-2">{alertsData.summary?.probationCount || 0}</h3>
                    <p className="text-xs text-amber-100/90 mt-1">Por evaluar en el mes</p>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Contratos a Vencer</p>
                    <h3 className="text-3xl font-black mt-2">{alertsData.summary?.contractCount || 0}</h3>
                    <p className="text-xs text-blue-100/90 mt-1">Plazo fijo / por obra</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Provisión Patronal Mes</p>
                    <h3 className="text-3xl font-black mt-2">${(provisionsData.summary?.totalCompanyProvisions || 0).toFixed(2)}</h3>
                    <p className="text-xs text-emerald-100/90 mt-1">13er, 14to, Reserva y Vacaciones</p>
                </div>
            </div>

            {/* TAB 1: ALERTAS PREVENTIVAS */}
            {activeTab === 'ALERTS' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-sm">Alertas y Notificaciones de Cumplimiento</h3>
                        <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700">
                            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                        </button>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border">Cargando alertas...</div>
                        ) : alertsData.alerts.length === 0 ? (
                            <div className="bg-white p-12 text-center text-slate-500 rounded-2xl border space-y-2">
                                <CheckCircleIcon className="w-12 h-12 text-emerald-500 mx-auto" />
                                <p className="font-bold">¡Todo al día en cumplimiento legal!</p>
                                <p className="text-xs text-slate-400">No se detectaron contratos vencidos ni períodos de prueba urgentes.</p>
                            </div>
                        ) : (
                            alertsData.alerts.map(alert => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                                        alert.urgency === 'CRITICAL' ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200/80'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-slate-100 rounded-2xl shrink-0">
                                            {getTypeIcon(alert.type)}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                                                {getUrgencyBadge(alert.urgency, alert.daysRemaining)}
                                            </div>
                                            <p className="text-xs text-slate-600">{alert.description}</p>
                                            <p className="text-[11px] text-blue-700 font-semibold bg-blue-50/80 px-2.5 py-1 rounded-lg inline-block">
                                                Acción sugerida: {alert.actionRequired}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 self-end md:self-auto shrink-0">
                                        {alert.type === 'PROBATION_PERIOD' && (
                                            <button
                                                onClick={() => navigate('/admin/contracts/expiring')}
                                                className="px-3.5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold shadow-sm transition-all"
                                            >
                                                Evaluar / Renovar
                                            </button>
                                        )}
                                        {alert.type === 'CONTRACT_EXPIRATION' && (
                                            <button
                                                onClick={() => navigate('/admin/offboarding')}
                                                className="px-3.5 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-xs font-bold shadow-sm transition-all"
                                            >
                                                Gestionar Salida
                                            </button>
                                        )}
                                        {alert.type === 'DOCUMENT_EXPIRATION' && (
                                            <button
                                                onClick={() => navigate(`/admin/expedientes/${alert.employee?.id}`)}
                                                className="px-3.5 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl text-xs font-bold shadow-sm transition-all"
                                            >
                                                Ver Expediente
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: MATRIZ DE PROVISIONES SOCIALES */}
            {activeTab === 'PROVISIONS' && (
                <div className="space-y-6">
                    {/* Period Selector & Export */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-bold text-slate-700">Período de Provisión:</label>
                            <select
                                className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold outline-none"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es-EC', { month: 'long' })}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold w-24 outline-none"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            />
                        </div>

                        <div className="flex gap-2">
                            {/* Export CSV/Excel */}
                            <ExportButtons type="statutory_provisions" fileName={`Provisiones_Sociales_${selectedMonth}_${selectedYear}`} />
                        </div>
                    </div>

                    {/* Department Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {provisionsData.byDepartment.map((dept, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        <BuildingOfficeIcon className="w-4 h-4 text-blue-600" />
                                        {dept.department}
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">{dept.employeeCount} Empleados</span>
                                </div>
                                <div className="space-y-1.5 text-xs text-slate-600">
                                    <div className="flex justify-between"><span>Sueldo Base Total:</span><span className="font-mono font-semibold">${dept.totalBaseSalary.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>13er Sueldo (8.33%):</span><span className="font-mono">${dept.thirteenth.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>14to Sueldo (SBU/12):</span><span className="font-mono">${dept.fourteenth.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Fondos de Reserva:</span><span className="font-mono">${dept.reserveFund.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1"><span>Provisión Total Dept:</span><span className="font-mono text-emerald-700">${dept.totalProvisions.toFixed(2)}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Employee Provisions Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200">
                            <h4 className="font-bold text-slate-800 text-sm">Detalle de Provisiones Individuales por Empleado</h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-200/80">
                                    <tr>
                                        <th className="p-4">Empleado</th>
                                        <th className="p-4 text-right">Sueldo Base</th>
                                        <th className="p-4 text-right">13er Sueldo</th>
                                        <th className="p-4 text-right">14to Sueldo</th>
                                        <th className="p-4 text-right">Fondos Reserva</th>
                                        <th className="p-4 text-right">Vacaciones</th>
                                        <th className="p-4 text-right font-bold text-slate-800">Total Provisión Mes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {provisionsData.provisionsList.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-slate-400">Sin datos de provisiones para el período seleccionado.</td></tr>
                                    ) : (
                                        provisionsData.provisionsList.map(prov => (
                                            <tr key={prov.employee.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-4 font-bold text-slate-900">
                                                    {prov.employee.firstName} {prov.employee.lastName}
                                                    <p className="text-xs font-normal text-slate-400">{prov.employee.department || 'General'}</p>
                                                </td>
                                                <td className="p-4 text-right font-mono font-medium">${prov.baseSalary.toFixed(2)}</td>
                                                <td className="p-4 text-right font-mono">${prov.thirteenthProvision.toFixed(2)}</td>
                                                <td className="p-4 text-right font-mono">${prov.fourteenthProvision.toFixed(2)}</td>
                                                <td className="p-4 text-right font-mono">
                                                    {prov.hasReserveFund ? `$${prov.reserveFundProvision.toFixed(2)}` : <span className="text-slate-400 text-xs">&lt;1 Año</span>}
                                                </td>
                                                <td className="p-4 text-right font-mono">${prov.vacationProvision.toFixed(2)}</td>
                                                <td className="p-4 text-right font-mono font-bold text-emerald-700 text-base">
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
