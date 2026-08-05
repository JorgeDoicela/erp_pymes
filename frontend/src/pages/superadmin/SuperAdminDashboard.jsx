import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { 
    FiShield, FiTrendingUp, FiCheckCircle, FiClock, FiAlertTriangle, 
    FiUsers, FiCalendar, FiPlusCircle, FiSearch, FiRefreshCw, FiEdit3, FiSliders
} from 'react-icons/fi';

export default function SuperAdminDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [metricsRes, tenantsRes] = await Promise.all([
                api.get('/superadmin/metrics'),
                api.get('/superadmin/tenants')
            ]);
            setMetrics(metricsRes.data.data);
            setTenants(tenantsRes.data.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos del Backoffice de SuperAdmin');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateStatus = async (tenantId, newStatus, extendDays = 0) => {
        setUpdatingId(tenantId);
        try {
            const res = await api.patch(`/superadmin/tenants/${tenantId}/status`, {
                subscriptionStatus: newStatus,
                ...(extendDays > 0 ? { extendDays } : {})
            });
            toast.success(res.data.message || 'Empresa actualizada exitosamente');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al actualizar empresa');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdatePlan = async (tenantId, newPlan) => {
        setUpdatingId(tenantId);
        try {
            const res = await api.patch(`/superadmin/tenants/${tenantId}/plan`, {
                plan: newPlan
            });
            toast.success(res.data.message || 'Plan actualizado exitosamente');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al cambiar plan');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredTenants = tenants.filter(t => {
        const matchesSearch = search === '' || 
            t.name.toLowerCase().includes(search.toLowerCase()) || 
            (t.ruc && t.ruc.includes(search)) ||
            (t.admin?.email && t.admin.email.toLowerCase().includes(search.toLowerCase()));
        
        const matchesStatus = filterStatus === '' || t.subscriptionStatus === filterStatus;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-6 rounded-2xl shadow-xl">
                <div>
                    <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs tracking-wider uppercase">
                        <FiShield className="text-lg" /> Backoffice de Plataforma EMPLIFI
                    </div>
                    <h1 className="text-2xl font-bold mt-1">Panel de Control SuperAdmin</h1>
                    <p className="text-sm text-slate-300">Gestión global de empresas, suscripciones y métricas SaaS en tiempo real.</p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm"
                >
                    <FiRefreshCw className={`text-base ${loading ? 'animate-spin' : ''}`} />
                    Actualizar Datos
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl text-2xl">
                        <FiTrendingUp />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MRR Estimado</p>
                        <p className="text-2xl font-bold text-slate-900">${metrics?.estimatedMRR ?? '0.00'}</p>
                        <p className="text-xs text-emerald-600 font-medium">Ingreso Recurrente Mensual</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl text-2xl">
                        <FiCheckCircle />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Empresas Activas</p>
                        <p className="text-2xl font-bold text-slate-900">{metrics?.activeTenants ?? 0} <span className="text-sm font-normal text-slate-500">/ {metrics?.totalTenants ?? 0}</span></p>
                        <p className="text-xs text-blue-600 font-medium">Suscripciones pagadas</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-xl text-2xl">
                        <FiClock />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pruebas Gratis (Trial)</p>
                        <p className="text-2xl font-bold text-slate-900">{metrics?.trialTenants ?? 0}</p>
                        <p className="text-xs text-amber-600 font-medium">En período de 14 días</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl text-2xl">
                        <FiUsers />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Colaboradores</p>
                        <p className="text-2xl font-bold text-slate-900">{metrics?.totalEmployees ?? 0}</p>
                        <p className="text-xs text-purple-600 font-medium">En todas las empresas</p>
                    </div>
                </div>
            </div>

            {/* Filter and Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Directorio Global de Empresas (Tenants)</h2>
                        <p className="text-xs text-slate-500">Administra el estado, plan y vigencia de cada empresa registrada en la plataforma.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar empresa o RUC..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        >
                            <option value="">Todos los Estados</option>
                            <option value="ACTIVE">Activas</option>
                            <option value="TRIAL">En Prueba (Trial)</option>
                            <option value="SUSPENDED">Suspendidas</option>
                            <option value="CANCELLED">Canceladas</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-3">Empresa / RUC</th>
                                <th className="px-6 py-3">Administrador</th>
                                <th className="px-6 py-3">Plan</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3">Empleados</th>
                                <th className="px-6 py-3">Acciones de Gestión (Sin Código)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                        No se encontraron empresas registradas.
                                    </td>
                                </tr>
                            ) : (
                                filteredTenants.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="font-semibold text-slate-900 truncate">{t.name}</p>
                                            <p className="text-xs text-slate-400 truncate" title={`RUC: ${t.ruc || 'N/A'} • Slug: ${t.slug}`}>RUC: {t.ruc || 'N/A'} • Slug: {t.slug}</p>
                                        </td>

                                        <td className="px-6 py-4">
                                            {t.admin ? (
                                                <div>
                                                    <p className="font-medium text-slate-800">{t.admin.firstName} {t.admin.lastName}</p>
                                                    <p className="text-xs text-slate-500">{t.admin.email}</p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">Sin admin registrado</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <select
                                                value={t.plan}
                                                disabled={updatingId === t.id}
                                                onChange={(e) => handleUpdatePlan(t.id, e.target.value)}
                                                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                            >
                                                <option value="ESSENTIAL">ESSENTIAL ($1.50/emp)</option>
                                                <option value="GROWTH">GROWTH ($3.00/emp)</option>
                                                <option value="ENTERPRISE">ENTERPRISE ($5.00/emp)</option>
                                            </select>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                                ${t.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                                  t.subscriptionStatus === 'TRIAL' ? 'bg-amber-100 text-amber-700' :
                                                  t.subscriptionStatus === 'SUSPENDED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}
                                            >
                                                {t.subscriptionStatus === 'ACTIVE' && <FiCheckCircle />}
                                                {t.subscriptionStatus === 'TRIAL' && <FiClock />}
                                                {t.subscriptionStatus === 'SUSPENDED' && <FiAlertTriangle />}
                                                {t.subscriptionStatus}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 font-semibold text-slate-700">
                                            {t.employeeCount} <span className="text-xs font-normal text-slate-400">empleados</span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {t.subscriptionStatus !== 'ACTIVE' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(t.id, 'ACTIVE')}
                                                        disabled={updatingId === t.id}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-all shadow-sm flex items-center gap-1"
                                                        title="Activar Suscripción Paga"
                                                    >
                                                        <FiCheckCircle /> Activar
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleUpdateStatus(t.id, t.subscriptionStatus, 30)}
                                                    disabled={updatingId === t.id}
                                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                                                    title="Regalar 30 Días Adicionales de Servicio"
                                                >
                                                    <FiPlusCircle /> +30 Días
                                                </button>

                                                {t.subscriptionStatus !== 'SUSPENDED' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(t.id, 'SUSPENDED')}
                                                        disabled={updatingId === t.id}
                                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                                                        title="Suspender por Falta de Pago"
                                                    >
                                                        <FiAlertTriangle /> Suspender
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
