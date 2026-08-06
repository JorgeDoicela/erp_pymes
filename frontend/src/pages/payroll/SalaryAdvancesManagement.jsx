import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    getAdvances, 
    approveAdvance, 
    rejectAdvance 
} from '../../services/payroll/salaryAdvance.service';
import { 
    BanknotesIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon, 
    UserIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

const SalaryAdvancesManagement = () => {
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });

    // Modals
    const [selectedAdvance, setSelectedAdvance] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadAdvances();
    }, [filterStatus, pagination.page]);

    const loadAdvances = async () => {
        setLoading(true);
        try {
            const res = await getAdvances({
                page: pagination.page,
                limit: pagination.limit,
                status: filterStatus || undefined,
                search: searchTerm || undefined
            });
            if (res.success) {
                setAdvances(res.data);
                setPagination(prev => ({ ...prev, ...res.pagination }));
            }
        } catch (error) {
            console.error('Error al cargar anticipos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        loadAdvances();
    };

    const handleApprove = async (id) => {
        if (!window.confirm('¿Confirmas la aprobación de este anticipo? Se integrará como deducción en las próximas nóminas.')) return;
        setActionLoading(true);
        try {
            const res = await approveAdvance(id);
            if (res.success) {
                alert('Solicitud aprobada exitosamente');
                loadAdvances();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAdvance) return;
        setActionLoading(true);
        try {
            const res = await rejectAdvance(selectedAdvance.id, rejectionReason);
            if (res.success) {
                alert('Solicitud rechazada');
                setRejectModalOpen(false);
                setSelectedAdvance(null);
                setRejectionReason('');
                loadAdvances();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Calculate Admin KPIs
    const pendingCount = advances.filter(a => a.status === 'PENDING').length;
    const totalApprovedAmount = advances
        .filter(a => a.status === 'APPROVED')
        .reduce((sum, a) => sum + (a.amount - a.paidAmount), 0);
    const monthlyDeductionsTotal = advances
        .filter(a => a.status === 'APPROVED')
        .reduce((sum, a) => sum + a.monthlyDeduction, 0);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircleIcon className="w-4 h-4" /> Aprobado</span>;
            case 'PENDING':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"><ClockIcon className="w-4 h-4" /> Pendiente</span>;
            case 'PAID':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><ShieldCheckIcon className="w-4 h-4" /> Pagado Total</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircleIcon className="w-4 h-4" /> Rechazado</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Cancelado</span>;
            default:
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <BanknotesIcon className="w-8 h-8 text-blue-600" />
                        Gestión de Anticipos y Préstamos
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Control de solicitudes, aprobaciones y cuotas diferidas de nómina para empleados
                    </p>
                </div>
                <button
                    onClick={loadAdvances}
                    className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium text-sm shadow-sm"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border-l-4 border-l-amber-500 border-t border-r border-b border-slate-200/80 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Solicitudes por Revisar</p>
                        <h3 className="text-3xl font-extrabold mt-2 text-slate-800">{pendingCount}</h3>
                        <p className="text-xs text-slate-400 mt-1">Requieren decisión del administrador</p>
                    </div>
                    <ClockIcon className="w-20 h-20 absolute -right-2 -bottom-2 text-slate-100/60" />
                </div>

                <div className="bg-white p-5 rounded-2xl border-l-4 border-l-blue-600 border-t border-r border-b border-slate-200/80 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Monto Total Saldo Activo</p>
                        <h3 className="text-3xl font-extrabold mt-2 text-slate-800">${totalApprovedAmount.toFixed(2)}</h3>
                        <p className="text-xs text-slate-400 mt-1">Pendiente de cobrar en nómina</p>
                    </div>
                    <BanknotesIcon className="w-20 h-20 absolute -right-2 -bottom-2 text-slate-100/60" />
                </div>

                <div className="bg-white p-5 rounded-2xl border-l-4 border-l-emerald-600 border-t border-r border-b border-slate-200/80 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Deducción Estimada Mes</p>
                        <h3 className="text-3xl font-extrabold mt-2 text-slate-800">${monthlyDeductionsTotal.toFixed(2)}</h3>
                        <p className="text-xs text-slate-400 mt-1">Se descontará en el próximo rol de pago</p>
                    </div>
                    <ShieldCheckIcon className="w-20 h-20 absolute -right-2 -bottom-2 text-slate-100/60" />
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <FunnelIcon className="w-5 h-5 text-slate-400 shrink-0" />
                    {[
                        { label: 'Todos', value: '' },
                        { label: 'Pendientes', value: 'PENDING' },
                        { label: 'Aprobados', value: 'APPROVED' },
                        { label: 'Pagados', value: 'PAID' },
                        { label: 'Rechazados', value: 'REJECTED' }
                    ].map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => {
                                setFilterStatus(tab.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                filterStatus === tab.value
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-72">
                    <div className="relative w-full">
                        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Buscar empleado o cédula..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all"
                    >
                        Buscar
                    </button>
                </form>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-200/80">
                            <tr>
                                <th className="p-4">Empleado</th>
                                <th className="p-4 text-right">Monto Solicitado</th>
                                <th className="p-4 text-center">Cuotas</th>
                                <th className="p-4 text-right">Cuota Mensual</th>
                                <th className="p-4 text-right">Saldo Cobrado</th>
                                <th className="p-4 text-center">Fecha Solicitud</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-slate-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-600" />
                                            Cargando solicitudes de anticipos...
                                        </div>
                                    </td>
                                </tr>
                            ) : advances.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-slate-400">
                                        No se encontraron registros de anticipos o préstamos.
                                    </td>
                                </tr>
                            ) : (
                                advances.map(adv => (
                                    <tr key={adv.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                    {adv.employee?.firstName?.[0]}{adv.employee?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 leading-tight">
                                                        {adv.employee?.firstName} {adv.employee?.lastName}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{adv.employee?.department || 'General'} • C.I. {adv.employee?.identityCard}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-800 text-base">
                                            ${adv.amount.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono text-xs font-semibold">
                                                {adv.paidInstallments} / {adv.installments}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-red-600 font-semibold">
                                            -${adv.monthlyDeduction.toFixed(2)} / mes
                                        </td>
                                        <td className="p-4 text-right font-mono text-slate-600">
                                            ${adv.paidAmount.toFixed(2)} de ${adv.amount.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center text-xs text-slate-500">
                                            {new Date(adv.requestDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(adv.status)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {adv.status === 'PENDING' ? (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleApprove(adv.id)}
                                                        disabled={actionLoading}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                                                    >
                                                        <CheckCircleIcon className="w-4 h-4" /> Aprobar
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAdvance(adv);
                                                            setRejectModalOpen(true);
                                                        }}
                                                        disabled={actionLoading}
                                                        className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                    >
                                                        <XCircleIcon className="w-4 h-4" /> Rechazar
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">
                                                    {adv.reason ? `Motivo: ${adv.reason}` : 'Sin notas'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                        <span>Página {pagination.page} de {pagination.totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            <AnimatePresence>
                {rejectModalOpen && selectedAdvance && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 bg-slate-50 border-b border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800">Rechazar Solicitud de Anticipo</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Empleado: {selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName} (${selectedAdvance.amount.toFixed(2)})
                                </p>
                            </div>
                            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Motivo del Rechazo
                                    </label>
                                    <textarea
                                        required
                                        rows="3"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                                        placeholder="Escribe la razón por la cual no se aprueba esta solicitud..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRejectModalOpen(false);
                                            setSelectedAdvance(null);
                                        }}
                                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Procesando...' : 'Confirmar Rechazo'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SalaryAdvancesManagement;
