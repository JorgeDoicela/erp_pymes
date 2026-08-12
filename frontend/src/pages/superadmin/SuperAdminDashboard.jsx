import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { FiSearch, FiChevronLeft, FiChevronRight, FiLogIn, FiEye } from 'react-icons/fi';
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
    const [density, setDensity] = useState('compact'); // 'compact' | 'comfortable' (Skill ERP PYME)

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
            <div className="space-y-4">
                {/* Toolbar Directorio */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
                    <div>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Backoffice · Tenants</p>
                        <h1 className="text-xl font-semibold text-gray-900">Directorio de Empresas</h1>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                    >
                        Registrar empresa
                    </button>
                </div>

                {/* Barra de Filtros */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative w-full sm:w-72">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Buscar por empresa o RUC..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                        {[
                            { key: 'ALL', label: 'Todas', count: metrics?.totalTenants ?? 0 },
                            { key: 'ACTIVE', label: 'Activas', count: metrics?.activeTenants ?? 0 },
                            { key: 'TRIAL', label: 'En prueba', count: metrics?.trialTenants ?? 0 },
                            { key: 'EXPIRING', label: 'Vencen pronto', count: metrics?.expiringTrialsCount ?? 0 },
                            { key: 'SUSPENDED', label: 'Suspendidas', count: metrics?.suspendedTenants ?? 0 },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-3 py-1.5 text-xs rounded transition-colors cursor-pointer ${
                                    activeTab === tab.key
                                        ? 'bg-blue-600 text-white font-medium'
                                        : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                                }`}
                            >
                                {tab.label} <span className={activeTab === tab.key ? 'opacity-70' : 'text-gray-400'}>({tab.count})</span>
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-medium hidden sm:block">Densidad:</span>
                        <div className="inline-flex border border-gray-200 rounded overflow-hidden text-xs">
                            <button
                                onClick={() => setDensity('compact')}
                                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                                    density === 'compact' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                Compacta
                            </button>
                            <button
                                onClick={() => setDensity('comfortable')}
                                className={`px-2.5 py-1 border-l border-gray-200 transition-colors cursor-pointer ${
                                    density === 'comfortable' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                Cómoda
                            </button>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="px-2.5 py-1 border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 text-xs rounded transition-colors cursor-pointer hidden sm:block"
                        >
                            Imprimir
                        </button>
                    </div>
                </div>

                {/* Tabla principal */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    {loading && tenants.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 text-sm">
                            Cargando directorio...
                        </div>
                    ) : tenants.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-sm font-medium text-gray-600">Sin resultados</p>
                            <p className="text-xs text-gray-400 mt-1">Prueba con otros términos de búsqueda o filtros.</p>
                        </div>
                    ) : (
                        <>
                            {/* Vista Móvil: Tarjetas Apiladas (Cero scroll horizontal) */}
                            <div className="block md:hidden divide-y divide-gray-100">
                                {tenants.map((t) => {
                                    const maxCap = PLAN_LIMITS[t.plan] || t.maxEmployees || 25;
                                    const usagePct = Math.min(Math.round(((t.employeeCount || 0) / maxCap) * 100), 100);

                                    return (
                                        <div key={t.id} className="p-4 space-y-3 bg-white">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded flex items-center justify-center font-mono font-semibold text-gray-700 text-xs shrink-0">
                                                        {t.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 text-sm leading-tight truncate">{t.name}</p>
                                                        <p className="text-[11px] text-gray-400 font-mono mt-0.5" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                            RUC: {t.ruc || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <select
                                                    value={t.subscriptionStatus}
                                                    disabled={updatingId === t.id}
                                                    onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                                                    className="text-[11px] font-mono font-medium px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded focus:outline-none focus:border-gray-400 cursor-pointer uppercase shrink-0"
                                                >
                                                    <option value="ACTIVE">Activa</option>
                                                    <option value="TRIAL">Prueba</option>
                                                    <option value="SUSPENDED">Suspendida</option>
                                                    <option value="CANCELLED">Cancelada</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/70 p-2.5 rounded border border-gray-100">
                                                <div>
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase block mb-0.5">Admin</span>
                                                    {t.admin ? (
                                                        <div>
                                                            <p className="font-medium text-gray-800 truncate">{t.admin.firstName} {t.admin.lastName}</p>
                                                            <p className="text-[11px] text-gray-400 font-mono truncate">{t.admin.email}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">No asignado</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase block mb-0.5">Plan</span>
                                                    <select
                                                        value={t.plan}
                                                        disabled={updatingId === t.id}
                                                        onChange={(e) => handleUpdatePlan(t.id, e.target.value)}
                                                        className="text-xs font-mono font-medium bg-white border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer w-full"
                                                    >
                                                        <option value="ESSENTIAL">ESSENTIAL</option>
                                                        <option value="GROWTH">GROWTH</option>
                                                        <option value="ENTERPRISE">ENTERPRISE</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-[11px] text-gray-500 mb-1 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                    <span>Licencias en uso</span>
                                                    <span className="font-medium text-gray-800">{t.employeeCount || 0} / {maxCap}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-1.5 rounded-sm overflow-hidden">
                                                    <div
                                                        className={`h-full ${usagePct > 90 ? 'bg-red-600' : 'bg-gray-800'}`}
                                                        style={{ width: `${usagePct}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    onClick={() => handleImpersonate(t.id, t.name)}
                                                    className="flex-1 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded transition-colors text-center cursor-pointer"
                                                >
                                                    Soporte
                                                </button>
                                                <button
                                                    onClick={() => openTenantDrawer(t.id)}
                                                    className="flex-1 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded transition-colors text-center cursor-pointer"
                                                >
                                                    Ver detalle
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Vista Escritorio: Tabla Completa */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className={`${density === 'compact' ? 'py-2.5' : 'py-3.5'} px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider`}>Empresa</th>
                                            <th className={`${density === 'compact' ? 'py-2.5' : 'py-3.5'} px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider`}>Administrador</th>
                                            <th className={`${density === 'compact' ? 'py-2.5' : 'py-3.5'} px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider`}>Plan</th>
                                            <th className={`${density === 'compact' ? 'py-2.5' : 'py-3.5'} px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider`}>Licencias</th>
                                            <th className={`${density === 'compact' ? 'py-2.5' : 'py-3.5'} px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider`}>Estado</th>
                                            <th className={`${density === 'compact' ? 'py-2.5' : 'py-3.5'} px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right`}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenants.map((t, idx) => {
                                            const maxCap = PLAN_LIMITS[t.plan] || t.maxEmployees || 25;
                                            const usagePct = Math.min(Math.round(((t.employeeCount || 0) / maxCap) * 100), 100);

                                            return (
                                                <tr key={t.id} className={`border-b border-gray-100 hover:bg-gray-50/60 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                                                    <td className={`${density === 'compact' ? 'py-2.5' : 'py-4'} px-4`}>
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 bg-gray-100 border border-gray-200 rounded flex items-center justify-center font-mono font-semibold text-gray-700 text-xs shrink-0">
                                                                {t.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900 text-sm leading-tight">{t.name}</p>
                                                                <p className="text-[11px] text-gray-400 font-mono mt-0.5" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>RUC: {t.ruc || '—'}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className={`${density === 'compact' ? 'py-2.5' : 'py-4'} px-4`}>
                                                        {t.admin ? (
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-800">{t.admin.firstName} {t.admin.lastName}</p>
                                                                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{t.admin.email}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">No asignado</span>
                                                        )}
                                                    </td>

                                                    <td className={`${density === 'compact' ? 'py-2.5' : 'py-4'} px-4`}>
                                                        <select
                                                            value={t.plan}
                                                            disabled={updatingId === t.id}
                                                            onChange={(e) => handleUpdatePlan(t.id, e.target.value)}
                                                            className="text-xs font-mono font-medium bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
                                                        >
                                                            <option value="ESSENTIAL">ESSENTIAL</option>
                                                            <option value="GROWTH">GROWTH</option>
                                                            <option value="ENTERPRISE">ENTERPRISE</option>
                                                        </select>
                                                    </td>

                                                    <td className={`${density === 'compact' ? 'py-2.5' : 'py-4'} px-4`}>
                                                        <div className="w-28">
                                                            <div className="flex justify-between text-[11px] text-gray-500 mb-1 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                                <span className="font-medium text-gray-800">{t.employeeCount || 0}</span>
                                                                <span className="text-gray-400">/ {maxCap}</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 h-1 rounded-sm overflow-hidden">
                                                                <div
                                                                    className={`h-full ${usagePct > 90 ? 'bg-red-600' : 'bg-gray-800'}`}
                                                                    style={{ width: `${usagePct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className={`${density === 'compact' ? 'py-2.5' : 'py-4'} px-4`}>
                                                        <select
                                                            value={t.subscriptionStatus}
                                                            disabled={updatingId === t.id}
                                                            onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                                                            className="text-[11px] font-mono font-medium px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded focus:outline-none focus:border-gray-400 cursor-pointer uppercase tracking-wide"
                                                        >
                                                            <option value="ACTIVE">Activa</option>
                                                            <option value="TRIAL">Prueba</option>
                                                            <option value="SUSPENDED">Suspendida</option>
                                                            <option value="CANCELLED">Cancelada</option>
                                                        </select>
                                                    </td>

                                                    <td className={`${density === 'compact' ? 'py-2.5' : 'py-4'} px-4 text-right`}>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleImpersonate(t.id, t.name)}
                                                                title="Modo Soporte"
                                                                className="px-2.5 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs rounded transition-colors cursor-pointer"
                                                            >
                                                                Soporte
                                                            </button>
                                                            <button
                                                                onClick={() => openTenantDrawer(t.id)}
                                                                className="px-2.5 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs rounded transition-colors cursor-pointer"
                                                            >
                                                                Ver detalle
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
                                <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 bg-gray-50/50">
                                    <p className="text-xs text-gray-500 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                        Página {pagination.page} de {pagination.totalPages} · {pagination.total} empresas
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            disabled={pagination.page <= 1}
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            className="p-1.5 border border-gray-200 rounded text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                            <FiChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            disabled={pagination.page >= pagination.totalPages}
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            className="p-1.5 border border-gray-200 rounded text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                            <FiChevronRight className="w-3.5 h-3.5" />
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
        <div className="space-y-0">
            <div className="px-3 sm:px-6 py-4 sm:py-6">
                {/* Contenido Dinámico de la Subvista */}
                {renderContent()}
            </div>

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
