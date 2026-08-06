import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { 
    FiShield, FiTrendingUp, FiCheckCircle, FiClock, FiAlertTriangle, 
    FiUsers, FiPlusCircle, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight,
    FiEye, FiDollarSign
} from 'react-icons/fi';
import TenantDetailDrawer from '../../components/superadmin/TenantDetailDrawer.jsx';

const PLAN_LIMITS = {
    ESSENTIAL: 25,
    GROWTH: 100,
    ENTERPRISE: 500
};

const getAvatarGradient = (name) => {
    const gradients = [
        'from-slate-700 to-slate-900',
        'from-blue-700 to-indigo-900',
        'from-emerald-700 to-teal-900',
        'from-indigo-800 to-slate-900'
    ];
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
};

export default function SuperAdminDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [updatingId, setUpdatingId] = useState(null);

    // Drawer state
    const [selectedTenantId, setSelectedTenantId] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadData = async (pageToLoad = pagination.page) => {
        setLoading(true);
        try {
            const params = {
                page: pageToLoad,
                limit: pagination.limit
            };
            if (search.trim()) params.q = search.trim();
            if (activeTab !== 'ALL') params.status = activeTab;

            const [metricsRes, tenantsRes] = await Promise.all([
                api.get('/superadmin/metrics'),
                api.get('/superadmin/tenants', { params })
            ]);

            setMetrics(metricsRes.data.data);
            setTenants(tenantsRes.data.data);
            if (tenantsRes.data.pagination) {
                setPagination(tenantsRes.data.pagination);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos del Backoffice SuperAdmin');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, activeTab]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadData(newPage);
        }
    };

    const handleUpdateStatus = async (tenantId, newStatus, extendDays = 0) => {
        setUpdatingId(tenantId);
        try {
            const res = await api.patch(`/superadmin/tenants/${tenantId}/status`, {
                subscriptionStatus: newStatus,
                ...(extendDays > 0 ? { extendDays } : {})
            });
            toast.success(res.data.message || 'Empresa actualizada exitosamente');
            loadData(pagination.page);
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
            loadData(pagination.page);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al cambiar plan');
        } finally {
            setUpdatingId(null);
        }
    };

    const openTenantDrawer = (id) => {
        setSelectedTenantId(id);
        setIsDrawerOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header Clean Corporate */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Panel de Control SuperAdmin
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Gestión global de empresas contratantes, licenciamiento e indicadores de suscripción.
                    </p>
                </div>

                <button
                    onClick={() => loadData(pagination.page)}
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                    <FiRefreshCw className={`text-sm ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* Metrics Cards Clean Corporate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MRR Estimado</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                            ${metrics?.estimatedMRR ?? '0.00'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Ingreso mensual recurrente</p>
                    </div>
                    <div className="p-3 bg-slate-100 text-slate-700 rounded-xl text-xl shrink-0">
                        <FiDollarSign />
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresas Activas</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                            {metrics?.activeTenants ?? 0} <span className="text-xs sm:text-sm font-normal text-slate-400">/ {metrics?.totalTenants ?? 0}</span>
                        </p>
                        <p className="text-xs text-emerald-700 font-medium mt-0.5">Suscripciones pagadas</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xl shrink-0">
                        <FiCheckCircle />
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pruebas Gratis (Trial)</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                            {metrics?.trialTenants ?? 0}
                        </p>
                        <p className="text-xs text-amber-700 font-medium mt-0.5">
                            {metrics?.expiringTrialsCount > 0 ? `${metrics.expiringTrialsCount} por vencer (<7 días)` : 'En período de prueba'}
                        </p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xl shrink-0">
                        <FiClock />
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Colaboradores</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                            {metrics?.totalEmployees ?? 0}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">En todas las empresas</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-xl shrink-0">
                        <FiUsers />
                    </div>
                </div>
            </div>

            {/* Filter Tabs and Directory Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Header Bar with Filters */}
                <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Directorio Global de Empresas (Tenants)
                            </h2>
                            <p className="text-xs text-slate-500">
                                Administra el estado, plan y vigencia de cada cliente registrado.
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-72">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Buscar empresa, RUC o email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800 transition-all"
                            />
                        </div>
                    </div>

                    {/* Filter Tabs Responsive Horizontal Scroll */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                        <button
                            onClick={() => setActiveTab('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Todas ({metrics?.totalTenants ?? 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('ACTIVE')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === 'ACTIVE' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Activas ({metrics?.activeTenants ?? 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('TRIAL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === 'TRIAL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            En Trial ({metrics?.trialTenants ?? 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('EXPIRING')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === 'EXPIRING' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Vencen Pronto ({metrics?.expiringTrialsCount ?? 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('SUSPENDED')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === 'SUSPENDED' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Suspendidas ({metrics?.suspendedTenants ?? 0})
                        </button>
                    </div>
                </div>

                {/* Mobile View: Cards Grid (< md) */}
                <div className="block md:hidden divide-y divide-slate-100">
                    {loading && tenants.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <FiRefreshCw className="animate-spin text-2xl text-slate-600" />
                                <span className="text-xs font-medium">Cargando directorio...</span>
                            </div>
                        </div>
                    ) : tenants.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <FiAlertTriangle className="text-2xl text-slate-400" />
                                <span className="text-xs font-medium">No se encontraron empresas con los filtros aplicados.</span>
                            </div>
                        </div>
                    ) : (
                        tenants.map((t) => {
                            const maxCap = PLAN_LIMITS[t.plan] || t.maxEmployees || 25;
                            const usagePct = Math.min(Math.round(((t.employeeCount || 0) / maxCap) * 100), 100);

                            return (
                                <div key={t.id} className="p-4 space-y-3 hover:bg-slate-50/80 transition-colors">
                                    {/* Company Info Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(t.name)} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs`}>
                                                {t.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">
                                                    {t.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                                    <span className="font-mono text-slate-600">RUC: {t.ruc || 'N/A'}</span> &bull; <span>/{t.slug}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                                            ${t.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                                              t.subscriptionStatus === 'TRIAL' ? 'bg-amber-100 text-amber-800' :
                                              t.subscriptionStatus === 'SUSPENDED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}
                                        >
                                            {t.subscriptionStatus === 'ACTIVE' && <FiCheckCircle className="text-emerald-600" />}
                                            {t.subscriptionStatus === 'TRIAL' && <FiClock className="text-amber-600" />}
                                            {t.subscriptionStatus === 'SUSPENDED' && <FiAlertTriangle className="text-rose-600" />}
                                            {t.subscriptionStatus}
                                        </span>
                                    </div>

                                    {/* Admin Details */}
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                                        <div className="text-slate-500 font-medium">Administrador:</div>
                                        {t.admin ? (
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-800">
                                                <span className="font-semibold">{t.admin.firstName} {t.admin.lastName}</span>
                                                <span className="text-slate-500 text-[11px] truncate">{t.admin.email}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">Sin admin asignado</span>
                                        )}
                                    </div>

                                    {/* Plan Selector and Employee Usage */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Plan</label>
                                            <select
                                                value={t.plan}
                                                disabled={updatingId === t.id}
                                                onChange={(e) => handleUpdatePlan(t.id, e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="ESSENTIAL">ESSENTIAL ($1.50/emp)</option>
                                                <option value="GROWTH">GROWTH ($3.00/emp)</option>
                                                <option value="ENTERPRISE">ENTERPRISE ($5.00/emp)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                                                <span>Capacidad: {t.employeeCount} colab.</span>
                                                <span className="text-slate-400 text-[10px]">{usagePct}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                                                <div
                                                    className={`h-full ${usagePct > 85 ? 'bg-rose-500' : 'bg-slate-700'}`}
                                                    style={{ width: `${usagePct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Bar Mobile */}
                                    <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <button
                                            onClick={() => openTenantDrawer(t.id)}
                                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <FiEye /> Detalles
                                        </button>

                                        {t.subscriptionStatus !== 'ACTIVE' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(t.id, 'ACTIVE')}
                                                disabled={updatingId === t.id}
                                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                            >
                                                <FiCheckCircle /> Activar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUpdateStatus(t.id, t.subscriptionStatus, 30)}
                                                disabled={updatingId === t.id}
                                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                            >
                                                <FiPlusCircle /> +30d
                                            </button>
                                        )}

                                        {t.subscriptionStatus === 'ACTIVE' && (
                                            <button
                                                onClick={() => handleUpdateStatus(t.id, 'SUSPENDED')}
                                                disabled={updatingId === t.id}
                                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 col-span-2 sm:col-span-1"
                                            >
                                                <FiAlertTriangle /> Suspender
                                            </button>
                                        )}

                                        {t.subscriptionStatus !== 'ACTIVE' && (
                                            <button
                                                onClick={() => handleUpdateStatus(t.id, t.subscriptionStatus, 30)}
                                                disabled={updatingId === t.id}
                                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                            >
                                                <FiPlusCircle /> +30d
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop View Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[950px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-3.5 min-w-[260px]">Empresa / RUC</th>
                                <th className="px-6 py-3.5 min-w-[200px]">Administrador</th>
                                <th className="px-6 py-3.5 min-w-[170px]">Plan</th>
                                <th className="px-6 py-3.5 min-w-[130px]">Estado</th>
                                <th className="px-6 py-3.5 min-w-[140px]">Empleados</th>
                                <th className="px-6 py-3.5 min-w-[220px] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && tenants.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FiRefreshCw className="animate-spin text-2xl text-slate-600" />
                                            <span className="text-xs font-medium">Cargando directorio...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : tenants.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FiAlertTriangle className="text-2xl text-slate-400" />
                                            <span className="text-xs font-medium">No se encontraron empresas con los filtros aplicados.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tenants.map((t) => {
                                    const maxCap = PLAN_LIMITS[t.plan] || t.maxEmployees || 25;
                                    const usagePct = Math.min(Math.round(((t.employeeCount || 0) / maxCap) * 100), 100);

                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 min-w-[260px]">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getAvatarGradient(t.name)} flex items-center justify-center font-bold text-white text-xs shrink-0`}>
                                                        {t.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold text-slate-900 leading-snug">
                                                            {t.name}
                                                        </span>
                                                        <span className="text-xs text-slate-500 mt-0.5 truncate">
                                                            <span className="font-mono text-slate-600">RUC: {t.ruc || 'N/A'}</span> &bull; <span>/{t.slug}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 min-w-[200px]">
                                                {t.admin ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-800">{t.admin.firstName} {t.admin.lastName}</span>
                                                        <span className="text-xs text-slate-500 truncate">{t.admin.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Sin admin asignado</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 min-w-[170px]">
                                                <select
                                                    value={t.plan}
                                                    disabled={updatingId === t.id}
                                                    onChange={(e) => handleUpdatePlan(t.id, e.target.value)}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value="ESSENTIAL">ESSENTIAL ($1.50/emp)</option>
                                                    <option value="GROWTH">GROWTH ($3.00/emp)</option>
                                                    <option value="ENTERPRISE">ENTERPRISE ($5.00/emp)</option>
                                                </select>
                                            </td>

                                            <td className="px-6 py-4 min-w-[130px]">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                                    ${t.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                                                      t.subscriptionStatus === 'TRIAL' ? 'bg-amber-100 text-amber-800' :
                                                      t.subscriptionStatus === 'SUSPENDED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}
                                                >
                                                    {t.subscriptionStatus === 'ACTIVE' && <FiCheckCircle className="text-emerald-600" />}
                                                    {t.subscriptionStatus === 'TRIAL' && <FiClock className="text-amber-600" />}
                                                    {t.subscriptionStatus === 'SUSPENDED' && <FiAlertTriangle className="text-rose-600" />}
                                                    {t.subscriptionStatus}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 min-w-[140px]">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                                        <span>{t.employeeCount} colab.</span>
                                                        <span className="text-slate-400 text-[10px]">{usagePct}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${usagePct > 85 ? 'bg-rose-500' : 'bg-slate-700'}`}
                                                            style={{ width: `${usagePct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 min-w-[220px]">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openTenantDrawer(t.id)}
                                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                                        title="Ver Detalles"
                                                    >
                                                        <FiEye /> Detalles
                                                    </button>

                                                    {t.subscriptionStatus !== 'ACTIVE' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(t.id, 'ACTIVE')}
                                                            disabled={updatingId === t.id}
                                                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                        >
                                                            <FiCheckCircle /> Activar
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleUpdateStatus(t.id, t.subscriptionStatus, 30)}
                                                        disabled={updatingId === t.id}
                                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <FiPlusCircle /> +30d
                                                    </button>

                                                    {t.subscriptionStatus !== 'SUSPENDED' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(t.id, 'SUSPENDED')}
                                                            disabled={updatingId === t.id}
                                                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                        >
                                                            <FiAlertTriangle /> Suspender
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls Clean Responsive */}
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left">
                    <p className="text-xs text-slate-500">
                        Mostrando <span className="font-semibold text-slate-800">{tenants.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> a <span className="font-semibold text-slate-800">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de <span className="font-semibold text-slate-800">{pagination.total}</span> empresas
                    </p>

                    <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            <FiChevronLeft /> Anterior
                        </button>
                        <span className="text-xs font-medium text-slate-700 px-2 shrink-0">
                            Página {pagination.page} de {pagination.totalPages || 1}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || loading}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            Siguiente <FiChevronRight />
                        </button>
                    </div>
                </div>
            </div>

            {/* Slide-over Inspection Drawer */}
            <TenantDetailDrawer
                tenantId={selectedTenantId}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onRefresh={() => loadData(pagination.page)}
            />
        </div>
    );
}
