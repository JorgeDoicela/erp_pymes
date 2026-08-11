import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { 
    FiShield, FiTrendingUp, FiCheckCircle, FiClock, FiAlertTriangle, 
    FiUsers, FiPlusCircle, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight,
    FiEye, FiDollarSign, FiBarChart2, FiGrid, FiLayers, FiLogIn
} from 'react-icons/fi';
import TenantDetailDrawer from '../../components/superadmin/TenantDetailDrawer.jsx';
import SuperAdminOverview from '../../components/superadmin/SuperAdminOverview.jsx';
import SuperAdminMetricsView from '../../components/superadmin/SuperAdminMetricsView.jsx';
import SuperAdminAuditView from '../../components/superadmin/SuperAdminAuditView.jsx';
import SuperAdminCreateTenantModal from '../../components/superadmin/SuperAdminCreateTenantModal.jsx';
import useAutoSync from '../../hooks/useAutoSync.js';

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
    const location = useLocation();
    const navigate = useNavigate();

    const [metrics, setMetrics] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [updatingId, setUpdatingId] = useState(null);

    // Modal & Drawer state
    const [selectedTenantId, setSelectedTenantId] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const currentPath = location.pathname;

    const loadData = async (pageToLoad = pagination.page, isSilent = false) => {
        if (!isSilent && !metrics) setLoading(true);
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
            if (!isSilent) toast.error('Error al cargar datos del Backoffice SuperAdmin');
        } finally {
            setLoading(false);
        }
    };

    const { lastSynced, isSyncing, triggerSync } = useAutoSync(
        () => loadData(pagination.page, true),
        { intervalMs: 30000 }
    );

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
            loadData(pagination.page, true);
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
            loadData(pagination.page, true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al cambiar plan');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleImpersonate = async (tenantId, tenantName) => {
        try {
            const res = await api.post(`/superadmin/tenants/${tenantId}/impersonate`);
            if (res.data.success) {
                const { token, user } = res.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                toast.success(`Modo Soporte iniciado en '${tenantName}'. Redirigiendo...`);
                setTimeout(() => {
                    window.location.href = '/admin';
                }, 500);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'No se pudo iniciar el modo soporte para esta empresa.');
        }
    };

    const openTenantDrawer = (id) => {
        setSelectedTenantId(id);
        setIsDrawerOpen(true);
    };

    // Renderizado según la subruta activa
    const renderContent = () => {
        if (currentPath === '/superadmin/metrics') {
            return <SuperAdminMetricsView metrics={metrics} loading={loading} />;
        }

        if (currentPath === '/superadmin/audit') {
            return <SuperAdminAuditView />;
        }

        if (currentPath === '/superadmin/dashboard') {
            return <SuperAdminOverview metrics={metrics} loading={loading} />;
        }

        // Default o '/superadmin/tenants': Vista completa de Gestión de Empresas
        return (
            <div className="space-y-6">
                {/* Header Directorio Empresas */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            Directorio Global de Empresas (Tenants)
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Administra el estado de suscripción, plan contratado y capacidades de cada cliente.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                        <FiPlusCircle className="w-4 h-4" /> Registrar Empresa
                    </button>
                </div>

                {/* Filtros de Búsqueda y Estado */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, RUC o admin..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                            <button
                                onClick={() => setActiveTab('ALL')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Todas ({metrics?.totalTenants ?? 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('ACTIVE')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === 'ACTIVE' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Activas ({metrics?.activeTenants ?? 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('TRIAL')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === 'TRIAL' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                En Trial ({metrics?.trialTenants ?? 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('EXPIRING')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === 'EXPIRING' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Vencen Pronto ({metrics?.expiringTrialsCount ?? 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('SUSPENDED')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === 'SUSPENDED' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Suspendidas ({metrics?.suspendedTenants ?? 0})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla Escritorio / Tarjetas Móvil */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {loading && tenants.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <FiRefreshCw className="animate-spin text-3xl mx-auto mb-2 text-indigo-600" />
                            <span className="text-sm font-medium">Cargando directorio de empresas...</span>
                        </div>
                    ) : tenants.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <FiAlertTriangle className="text-3xl mx-auto mb-2 text-amber-500" />
                            <p className="text-sm font-medium text-slate-700">No se encontraron empresas contratantes.</p>
                            <p className="text-xs text-slate-500 mt-1">Prueba con otros términos de búsqueda o filtros de estado.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3.5 px-4">Empresa</th>
                                            <th className="py-3.5 px-4">Administrador Primario</th>
                                            <th className="py-3.5 px-4">Plan SaaS</th>
                                            <th className="py-3.5 px-4">Uso de Licencias</th>
                                            <th className="py-3.5 px-4">Estado Suscripción</th>
                                            <th className="py-3.5 px-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {tenants.map((t) => {
                                            const maxCap = PLAN_LIMITS[t.plan] || t.maxEmployees || 25;
                                            const usagePct = Math.min(Math.round(((t.employeeCount || 0) / maxCap) * 100), 100);

                                            return (
                                                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarGradient(t.name)} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs`}>
                                                                {t.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 leading-tight">{t.name}</p>
                                                                <p className="text-xs text-slate-500 font-mono">RUC: {t.ruc || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        {t.admin ? (
                                                            <div>
                                                                <p className="font-medium text-slate-800 text-xs">{t.admin.firstName} {t.admin.lastName}</p>
                                                                <p className="text-[11px] text-slate-500">{t.admin.email}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">No asignado</span>
                                                        )}
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        <select
                                                            value={t.plan}
                                                            disabled={updatingId === t.id}
                                                            onChange={(e) => handleUpdatePlan(t.id, e.target.value)}
                                                            className="text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                                        >
                                                            <option value="ESSENTIAL">ESSENTIAL (25 max)</option>
                                                            <option value="GROWTH">GROWTH (100 max)</option>
                                                            <option value="ENTERPRISE">ENTERPRISE (500 max)</option>
                                                        </select>
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        <div className="w-36">
                                                            <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                                                                <span>{t.employeeCount || 0} emp</span>
                                                                <span className="text-slate-400">/ {maxCap} max</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${usagePct > 90 ? 'bg-rose-500' : usagePct > 70 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                                                                    style={{ width: `${usagePct}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        <select
                                                            value={t.subscriptionStatus}
                                                            disabled={updatingId === t.id}
                                                            onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                                                            className={`text-xs font-bold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer ${
                                                                t.subscriptionStatus === 'ACTIVE' 
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                    : t.subscriptionStatus === 'TRIAL'
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                                            }`}
                                                        >
                                                            <option value="ACTIVE">ACTIVE (Activa)</option>
                                                            <option value="TRIAL">TRIAL (Prueba)</option>
                                                            <option value="SUSPENDED">SUSPENDED (Suspendida)</option>
                                                            <option value="CANCELLED">CANCELLED (Cancelada)</option>
                                                        </select>
                                                    </td>

                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleImpersonate(t.id, t.name)}
                                                                title="Ingresar en Modo Soporte Auditado"
                                                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded-lg border border-amber-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <FiLogIn className="w-3.5 h-3.5" /> Soporte
                                                            </button>

                                                            <button
                                                                onClick={() => openTenantDrawer(t.id)}
                                                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <FiEye className="w-3.5 h-3.5" /> Detalle
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            {pagination.totalPages > 1 && (
                                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <p className="text-xs text-slate-500">
                                        Página <span className="font-semibold text-slate-800">{pagination.page}</span> de <span className="font-semibold text-slate-800">{pagination.totalPages}</span> ({pagination.total} empresas)
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={pagination.page <= 1}
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <FiChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            disabled={pagination.page >= pagination.totalPages}
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <FiChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Nav Tabs SuperAdmin SaaS */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
                <button
                    onClick={() => navigate('/superadmin/dashboard')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        currentPath === '/superadmin/dashboard'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <FiGrid className="w-4 h-4" /> Resumen General
                </button>

                <button
                    onClick={() => navigate('/superadmin/tenants')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        currentPath === '/superadmin/tenants' || currentPath === '/superadmin'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <FiUsers className="w-4 h-4" /> Gestión de Empresas & Tenants
                </button>

                <button
                    onClick={() => navigate('/superadmin/metrics')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        currentPath === '/superadmin/metrics'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <FiBarChart2 className="w-4 h-4" /> Analíticas & Métricas SaaS
                </button>

                <button
                    onClick={() => navigate('/superadmin/audit')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        currentPath === '/superadmin/audit'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <FiShield className="w-4 h-4" /> Auditoría Global
                </button>
            </div>

            {/* Contenido Dinámico de la Subvista */}
            {renderContent()}

            {/* Modal de Alta de Empresa Directa */}
            <SuperAdminCreateTenantModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => loadData(1, true)}
            />

            {/* Drawer de Detalle de Tenant */}
            <TenantDetailDrawer
                tenantId={selectedTenantId}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onRefresh={() => loadData(pagination.page, true)}
            />
        </div>
    );
}
