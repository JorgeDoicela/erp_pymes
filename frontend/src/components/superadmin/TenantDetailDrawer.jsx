import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { 
    FiX, FiShield, FiUser, FiMail, FiPhone, FiCalendar, 
    FiLayers, FiUsers, FiClock, FiCheckCircle, FiAlertTriangle, FiPlusCircle, FiActivity
} from 'react-icons/fi';

const PLAN_LIMITS = {
    ESSENTIAL: 25,
    GROWTH: 100,
    ENTERPRISE: 500
};

const getAvatarGradient = (name) => {
    const gradients = [
        'from-blue-600 to-indigo-600',
        'from-emerald-600 to-teal-600',
        'from-violet-600 to-purple-600',
        'from-amber-500 to-orange-600',
        'from-rose-600 to-pink-600',
        'from-cyan-600 to-blue-700'
    ];
    let hash = 0;
    for (let i = 0; i < (name?.length || 0); i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
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
        if (isOpen && tenantId) {
            fetchDetail();
        }
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
                    />

                    {/* Drawer Panel */}
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(tenant?.name || 'Empresa')} flex items-center justify-center font-bold text-lg text-white shadow-md border border-white/20`}>
                                    {tenant?.name?.substring(0, 2).toUpperCase() || 'EM'}
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-white leading-tight">{tenant?.name || 'Cargando...'}</h2>
                                    <p className="text-xs text-indigo-300 font-mono">/{tenant?.slug || 'slug'}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium">Obteniendo expediente completo...</span>
                                </div>
                            ) : tenant ? (
                                <>
                                    {/* Status & Plan Quick Banner */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Estado de Suscripción</p>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 shadow-xs
                                                ${tenant.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                  tenant.subscriptionStatus === 'TRIAL' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                  tenant.subscriptionStatus === 'SUSPENDED' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-200 text-slate-700'}`}
                                            >
                                                {tenant.subscriptionStatus === 'ACTIVE' && <FiCheckCircle />}
                                                {tenant.subscriptionStatus === 'TRIAL' && <FiClock />}
                                                {tenant.subscriptionStatus === 'SUSPENDED' && <FiAlertTriangle />}
                                                {tenant.subscriptionStatus}
                                            </span>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Plan Contratado</p>
                                            <select
                                                value={tenant.plan}
                                                disabled={updating}
                                                onChange={(e) => handlePlanChange(e.target.value)}
                                                className="mt-1 px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-xs"
                                            >
                                                <option value="ESSENTIAL">ESSENTIAL ($1.50/emp)</option>
                                                <option value="GROWTH">GROWTH ($3.00/emp)</option>
                                                <option value="ENTERPRISE">ENTERPRISE ($5.00/emp)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Employee Capacity Bar */}
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                                        <div className="flex items-center justify-between text-xs font-semibold">
                                            <span className="text-slate-600 flex items-center gap-1.5"><FiUsers className="text-indigo-600" /> Capacidad de Colaboradores</span>
                                            <span className="text-slate-900">{tenant.employeeCount} / {maxCapacity} empleados</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${usagePercentage > 85 ? 'bg-rose-500' : usagePercentage > 60 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                                style={{ width: `${usagePercentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 text-right">{usagePercentage}% de capacidad utilizada</p>
                                    </div>

                                    {/* Administrator Profile Card */}
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <FiUser className="text-indigo-600" /> Administrador Titular
                                        </h3>
                                        {tenant.admin ? (
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                                                    <FiUser className="text-slate-400 text-xs" />
                                                    {tenant.admin.firstName} {tenant.admin.lastName}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 text-xs">
                                                    <FiMail className="text-slate-400" />
                                                    <a href={`mailto:${tenant.admin.email}`} className="text-indigo-600 hover:underline">{tenant.admin.email}</a>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 text-xs">
                                                    <FiPhone className="text-slate-400" />
                                                    {tenant.admin.phone || 'No registrado'}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">No se encontró usuario administrador directo registrado.</p>
                                        )}
                                    </div>

                                    {/* Licensing & Key Metadata */}
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <FiCalendar className="text-indigo-600" /> Fechas y Licenciamiento
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-slate-400">RUC Fiscal:</span>
                                                <p className="font-mono text-slate-800 font-bold mt-0.5">{tenant.ruc || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Fecha Registro:</span>
                                                <p className="text-slate-800 font-medium mt-0.5">{new Date(tenant.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Vigencia Trial:</span>
                                                <p className="text-slate-800 font-medium mt-0.5">{tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Vigencia Suscripción:</span>
                                                <p className="text-slate-800 font-medium mt-0.5">{tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt).toLocaleDateString() : 'Indefinida'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2 space-y-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Acciones de Licencia</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {tenant.subscriptionStatus !== 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleStatusChange('ACTIVE')}
                                                    disabled={updating}
                                                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                >
                                                    <FiCheckCircle /> Activar Licencia
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleStatusChange(tenant.subscriptionStatus, 30)}
                                                disabled={updating}
                                                className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                            >
                                                <FiPlusCircle /> Extender +30 Días
                                            </button>

                                            {tenant.subscriptionStatus !== 'SUSPENDED' && (
                                                <button
                                                    onClick={() => handleStatusChange('SUSPENDED')}
                                                    disabled={updating}
                                                    className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 col-span-2"
                                                >
                                                    <FiAlertTriangle /> Suspender Empresa por Falta de Pago
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
