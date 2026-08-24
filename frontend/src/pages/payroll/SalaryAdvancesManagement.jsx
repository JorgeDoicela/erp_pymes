import { useState, useEffect } from 'react';
import { getAdvances, approveAdvance, rejectAdvance } from '../../services/payroll/salaryAdvance.service';

const STATUS_MAP = {
    APPROVED: { label: 'APROBADO', cls: 'bg-green-50 text-green-800 border-green-200' },
    PENDING: { label: 'PENDIENTE', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    PAID: { label: 'PAGADO', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    REJECTED: { label: 'RECHAZADO', cls: 'bg-red-50 text-red-800 border-red-200' },
    CANCELLED: { label: 'CANCELADO', cls: 'bg-gray-50 text-gray-700 border-gray-200' }
};

const SalaryAdvancesManagement = () => {
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });

    const [selectedAdvance, setSelectedAdvance] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

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

    useEffect(() => {
        loadAdvances();
    }, [filterStatus, pagination.page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        loadAdvances();
    };

    const handleApprove = async (id) => {
        if (!window.confirm('¿Confirmar aprobación de este anticipo? Se integrará como deducción en las próximas nóminas.')) return;
        setActionLoading(true);
        try {
            const res = await approveAdvance(id);
            if (res.success) {
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

    // KPIs
    const pendingCount = advances.filter(a => a.status === 'PENDING').length;
    const totalApprovedAmount = advances
        .filter(a => a.status === 'APPROVED')
        .reduce((sum, a) => sum + (a.amount - a.paidAmount), 0);
    const monthlyDeductionsTotal = advances
        .filter(a => a.status === 'APPROVED')
        .reduce((sum, a) => sum + a.monthlyDeduction, 0);

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";

    return (
        <div className="space-y-5">
            {/* Header ERP con Balance Financiero Integrado */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Nómina · Anticipos y Préstamos</p>
                    <h1 className="text-xl font-semibold text-gray-900">Gestión de Anticipos y Préstamos</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Control de solicitudes, aprobaciones y cuotas diferidas en el rol de pagos.</p>
                </div>
                {/* Resumen Financiero en Línea Sobrio */}
                <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded border border-gray-200 font-mono text-xs shrink-0">
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Saldo Activo</span>
                        <span className="font-semibold text-gray-900 tabular-nums">
                            ${totalApprovedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </span>
                    </div>
                    <div className="w-px h-7 bg-gray-200" />
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Deducción Mes</span>
                        <span className="font-semibold text-gray-900 tabular-nums">
                            ${monthlyDeductionsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </span>
                    </div>
                    {pendingCount > 0 && (
                        <>
                            <div className="w-px h-7 bg-gray-200" />
                            <div>
                                <span className="text-[10px] text-amber-700 uppercase tracking-wider block font-sans">Pendientes</span>
                                <span className="font-semibold text-amber-800 tabular-nums">
                                    {pendingCount} por revisar
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white p-3 rounded border border-gray-200 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs">
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
                            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                                filterStatus === tab.value
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Buscar por empleado o cédula..."
                        className={inputClass}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shrink-0">
                        Buscar
                    </button>
                </form>
            </div>

            {/* Tabla ERP de Anticipos */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Monto</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Cuotas</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Cuota Mensual</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Cobrado</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Fecha</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Estado</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-400">
                                        Cargando anticipos...
                                    </td>
                                </tr>
                            ) : advances.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-400">
                                        No se encontraron solicitudes de anticipo.
                                    </td>
                                </tr>
                            ) : (
                                advances.map(adv => {
                                    const s = STATUS_MAP[adv.status] || STATUS_MAP.CANCELLED;
                                    return (
                                        <tr key={adv.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-2.5 px-4 font-medium text-gray-900">
                                                {adv.employee?.firstName} {adv.employee?.lastName}
                                                <span className="text-[11px] text-gray-400 block font-normal font-mono">{adv.employee?.identityCard}</span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                ${adv.amount.toFixed(2)}
                                            </td>
                                            <td className="py-2.5 px-4 text-center font-mono text-gray-600">
                                                {adv.paidInstallments}/{adv.installments}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono text-red-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                −${adv.monthlyDeduction.toFixed(2)}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono text-gray-600" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                ${adv.paidAmount.toFixed(2)}
                                            </td>
                                            <td className="py-2.5 px-4 text-center text-gray-500 font-mono">
                                                {new Date(adv.requestDate).toLocaleDateString('es-EC')}
                                            </td>
                                            <td className="py-2.5 px-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${s.cls}`}>{s.label}</span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right">
                                                {adv.status === 'PENDING' ? (
                                                    <div className="flex gap-1.5 justify-end">
                                                        <button
                                                            onClick={() => handleApprove(adv.id)}
                                                            disabled={actionLoading}
                                                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedAdvance(adv); setRejectModalOpen(true); }}
                                                            disabled={actionLoading}
                                                            className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer disabled:opacity-50"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-gray-400 italic font-mono">{adv.reason || '—'}</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginador ERP */}
                {pagination.totalPages > 1 && (
                    <div className="px-4 py-2.5 bg-gray-50/50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                        <span>Página {pagination.page} de {pagination.totalPages}</span>
                        <div className="flex gap-1.5">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL RECHAZO */}
            {rejectModalOpen && selectedAdvance && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-md w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Rechazar Solicitud de Anticipo</h3>
                            <button onClick={() => { setRejectModalOpen(false); setSelectedAdvance(null); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer">×</button>
                        </div>
                        <form onSubmit={handleRejectSubmit} className="p-5 space-y-4">
                            <p className="text-xs text-gray-500">
                                Empleado: <span className="font-semibold text-gray-900">{selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName}</span> (${selectedAdvance.amount.toFixed(2)})
                            </p>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Motivo del Rechazo</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors resize-none"
                                    placeholder="Indique la razón por la cual no se aprueba el anticipo..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                            <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                                <button type="button" onClick={() => { setRejectModalOpen(false); setSelectedAdvance(null); }} className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={actionLoading} className="px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50">
                                    {actionLoading ? 'Procesando...' : 'Confirmar Rechazo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryAdvancesManagement;
