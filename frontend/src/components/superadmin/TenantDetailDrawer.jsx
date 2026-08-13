import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';

const PLAN_LIMITS = {
    ESSENTIAL: 25,
    GROWTH: 100,
    ENTERPRISE: 500
};

export default function TenantDetailDrawer({ tenantId, isOpen, onClose, onRefresh }) {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchDetail = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const res = await api.get(`/superadmin/tenants/${tenantId}`);
            setTenant(res.data.data);
        } catch (error) {
            console.error(error);
            toast.error('No se pudieron cargar los detalles de la empresa');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && tenantId) fetchDetail();
    }, [isOpen, tenantId]);

    const handleStatusChange = async (newStatus, extendDays = 0) => {
        setUpdating(true);
        try {
            const res = await api.patch(`/superadmin/tenants/${tenantId}/status`, {
                subscriptionStatus: newStatus,
                ...(extendDays > 0 ? { extendDays } : {})
            });
            toast.success(res.data.message || 'Estado actualizado');
            fetchDetail();
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al actualizar estado');
        } finally {
            setUpdating(false);
        }
    };

    const handlePlanChange = async (newPlan) => {
        setUpdating(true);
        try {
            const res = await api.patch(`/superadmin/tenants/${tenantId}/plan`, { plan: newPlan });
            toast.success(res.data.message || 'Plan actualizado');
            fetchDetail();
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al actualizar plan');
        } finally {
            setUpdating(false);
        }
    };

    if (!isOpen) return null;

    const maxCapacity = tenant ? (PLAN_LIMITS[tenant.plan] || tenant.maxEmployees || 25) : 25;
    const usagePercentage = tenant ? Math.min(Math.round(((tenant.employeeCount || 0) / maxCapacity) * 100), 100) : 0;

    const statusStyle = (status) => {
        if (status === 'ACTIVE') return 'bg-green-50 text-green-800 border-green-200';
        if (status === 'TRIAL') return 'bg-amber-50 text-amber-800 border-amber-200';
        if (status === 'SUSPENDED') return 'bg-red-50 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-gray-900/50 z-50"
                    />

                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col border-l border-gray-200 overflow-hidden"
                    >
                        {/* Header del Drawer */}
                        <div className="px-5 py-4 bg-white border-b border-gray-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 bg-gray-100 border border-gray-200 rounded flex items-center justify-center font-mono font-semibold text-gray-700 text-sm shrink-0">
                                    {tenant?.name?.substring(0, 2).toUpperCase() || '--'}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-semibold text-base text-gray-900 leading-tight truncate">{tenant?.name || 'Cargando...'}</h2>
                                    <p className="text-xs text-gray-400 font-mono truncate">/{tenant?.slug || 'slug'}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="py-20 flex items-center justify-center text-gray-400 text-sm">
                                    Obteniendo expediente...
                                </div>
                            ) : tenant ? (
                                <div className="divide-y divide-gray-100">

                                    {/* Estado y Plan */}
                                    <div className="px-5 py-4">
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Estado y Suscripción</p>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex-1">
                                                <p className="text-[11px] text-gray-400 mb-1">Estado actual</p>
                                                <span className={`inline-block px-2.5 py-0.5 border rounded text-xs font-mono font-semibold uppercase tracking-wide ${statusStyle(tenant.subscriptionStatus)}`}>
                                                    {tenant.subscriptionStatus}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[11px] text-gray-400 mb-1">Plan contratado</p>
                                                <select
                                                    value={tenant.plan}
                                                    disabled={updating}
                                                    onChange={(e) => handlePlanChange(e.target.value)}
                                                    className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono font-medium text-gray-800 focus:outline-none focus:border-blue-400 cursor-pointer"
                                                >
                                                     <option value="ESSENTIAL">ESSENTIAL · $0.50/emp</option>
                                                     <option value="GROWTH">GROWTH · $1.00/emp</option>
                                                     <option value="ENTERPRISE">ENTERPRISE · $2.00/emp</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Uso de Licencias */}
                                    <div className="px-5 py-4">
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Capacidad de Licencias</p>
                                        <div className="flex justify-between text-xs mb-1.5 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                            <span className="font-semibold text-gray-900">{tenant.employeeCount} empleados</span>
                                            <span className="text-gray-400">/ {maxCapacity} máx.</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-sm overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${usagePercentage > 85 ? 'bg-red-500' : usagePercentage > 60 ? 'bg-amber-400' : 'bg-blue-500'}`}
                                                style={{ width: `${usagePercentage}%` }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-400 text-right mt-1 font-mono">{usagePercentage}% utilizado</p>
                                    </div>

                                    {/* Administrador */}
                                    <div className="px-5 py-4">
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Administrador Titular</p>
                                        {tenant.admin ? (
                                            <div className="space-y-1.5 text-xs">
                                                <p className="font-medium text-gray-900">{tenant.admin.firstName} {tenant.admin.lastName}</p>
                                                <p className="text-gray-500">
                                                    <a href={`mailto:${tenant.admin.email}`} className="text-blue-600 hover:text-blue-800">{tenant.admin.email}</a>
                                                </p>
                                                <p className="text-gray-500">{tenant.admin.phone || 'Teléfono no registrado'}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400">No se encontró administrador registrado.</p>
                                        )}
                                    </div>

                                    {/* Fechas y Metadatos */}
                                    <div className="px-5 py-4">
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Fechas y Licenciamiento</p>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <p className="text-gray-400">RUC Fiscal</p>
                                                <p className="font-mono font-medium text-gray-800 mt-0.5">{tenant.ruc || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Fecha de registro</p>
                                                <p className="font-mono text-gray-800 mt-0.5">{new Date(tenant.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Vigencia trial</p>
                                                <p className="font-mono text-gray-800 mt-0.5">{tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString() : '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Vigencia suscripción</p>
                                                <p className="font-mono text-gray-800 mt-0.5">{tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt).toLocaleDateString() : 'Indefinida'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="px-5 py-4">
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Acciones de Licencia</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {tenant.subscriptionStatus !== 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleStatusChange('ACTIVE')}
                                                    disabled={updating}
                                                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    Activar licencia
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleStatusChange(tenant.subscriptionStatus, 30)}
                                                disabled={updating}
                                                className="py-2 px-4 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                Extender +30 días
                                            </button>
                                            {tenant.subscriptionStatus !== 'SUSPENDED' && (
                                                <button
                                                    onClick={() => handleStatusChange('SUSPENDED')}
                                                    disabled={updating}
                                                    className="py-2 px-4 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 sm:col-span-2"
                                                >
                                                    Suspender por falta de pago
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            ) : null}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
