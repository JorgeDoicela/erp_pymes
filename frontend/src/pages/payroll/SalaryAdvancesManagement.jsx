import { useState, useEffect, useMemo } from 'react';
import { getEmployees } from '../../services/employees/employee.service';
import {
    getAdvances,
    getAdvanceStats,
    approveAdvance,
    rejectAdvance,
    createAdvanceByAdmin
} from '../../services/payroll/salaryAdvance.service';

const STATUS_MAP = {
    APPROVED: { label: 'APROBADO', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    PENDING: { label: 'PENDIENTE', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    PAID: { label: 'PAGADO', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    REJECTED: { label: 'RECHAZADO', cls: 'bg-red-50 text-red-800 border-red-200' },
    CANCELLED: { label: 'CANCELADO', cls: 'bg-gray-50 text-gray-700 border-gray-200' }
};

const SalaryAdvancesManagement = () => {
    // Listas y estados
    const [advances, setAdvances] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        paid: 0,
        rejected: 0,
        cancelled: 0,
        totalActiveBalance: 0,
        monthlyDeductionsTotal: 0
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Filtros y Paginación
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, APPROVED, PAID, REJECTED, CANCELLED
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

    // Modales
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    // Selección actual y formulario
    const [selectedAdvance, setSelectedAdvance] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

    const [adminFormData, setAdminFormData] = useState({
        employeeId: '',
        amount: '',
        installments: 1,
        reason: '',
        autoApprove: true
    });

    useEffect(() => {
        loadEmployeesList();
    }, []);

    useEffect(() => {
        loadAdvancesData();
        loadStatsData();
    }, [activeTab, pagination.page]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const loadEmployeesList = async () => {
        try {
            const res = await getEmployees();
            if (res.success && Array.isArray(res.data)) {
                setEmployees(res.data);
            }
        } catch (error) {
            console.error('Error al cargar colaboradores:', error);
        }
    };

    const loadStatsData = async () => {
        try {
            const res = await getAdvanceStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };

    const loadAdvancesData = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                status: activeTab === 'ALL' ? undefined : activeTab,
                search: searchTerm.trim() || undefined
            };

            const res = await getAdvances(params);
            if (res.success) {
                setAdvances(res.data || []);
                if (res.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        total: res.pagination.total || 0,
                        totalPages: res.pagination.totalPages || 1
                    }));
                }
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al cargar anticipos');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        loadAdvancesData();
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Creación de Anticipo por Administración
    const handleOpenCreateModal = () => {
        setAdminFormData({
            employeeId: employees[0]?.id || '',
            amount: '',
            installments: 1,
            reason: '',
            autoApprove: true
        });
        setCreateModalOpen(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!adminFormData.employeeId) {
            showNotification('error', 'Seleccione un colaborador');
            return;
        }

        setActionLoading(true);
        try {
            const res = await createAdvanceByAdmin({
                employeeId: adminFormData.employeeId,
                amount: parseFloat(adminFormData.amount),
                installments: parseInt(adminFormData.installments, 10),
                reason: adminFormData.reason,
                autoApprove: adminFormData.autoApprove
            });

            if (res.success) {
                showNotification('success', res.message || 'Anticipo registrado exitosamente');
                setCreateModalOpen(false);
                loadAdvancesData();
                loadStatsData();
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al conceder anticipo');
        } finally {
            setActionLoading(false);
        }
    };

    // Aprobación
    const handleOpenApproveModal = (advance) => {
        setSelectedAdvance(advance);
        setApproveModalOpen(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedAdvance) return;

        setActionLoading(true);
        try {
            const res = await approveAdvance(selectedAdvance.id);
            if (res.success) {
                showNotification('success', 'Anticipo aprobado exitosamente');
                setApproveModalOpen(false);
                setSelectedAdvance(null);
                loadAdvancesData();
                loadStatsData();
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al aprobar anticipo');
        } finally {
            setActionLoading(false);
        }
    };

    // Rechazo
    const handleOpenRejectModal = (advance) => {
        setSelectedAdvance(advance);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const handleConfirmReject = async (e) => {
        e.preventDefault();
        if (!selectedAdvance) return;

        setActionLoading(true);
        try {
            const res = await rejectAdvance(selectedAdvance.id, rejectionReason);
            if (res.success) {
                showNotification('success', 'Solicitud rechazada');
                setRejectModalOpen(false);
                setSelectedAdvance(null);
                setRejectionReason('');
                loadAdvancesData();
                loadStatsData();
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al rechazar anticipo');
        } finally {
            setActionLoading(false);
        }
    };

    // Detalle
    const handleOpenDetailModal = (advance) => {
        setSelectedAdvance(advance);
        setDetailModalOpen(true);
    };

    // Cuota estimada reactiva
    const estimatedQuota = useMemo(() => {
        const amt = parseFloat(adminFormData.amount);
        const inst = parseInt(adminFormData.installments, 10);
        if (!amt || isNaN(amt) || !inst || isNaN(inst) || inst < 1) return 0;
        return (amt / inst).toFixed(2);
    }, [adminFormData.amount, adminFormData.installments]);

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";
    const labelClass = "block text-xs font-medium text-gray-600 mb-1";

    return (
        <div className="space-y-4">
            {/* Notificación Toast Sobria */}
            {notification && (
                <div
                    className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded border text-xs font-medium shadow-md transition-all ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-red-50 text-red-900 border-red-200'
                    }`}
                >
                    {notification.message}
                </div>
            )}

            {/* Header ERP con Balance Financiero Integrado */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Nómina · Anticipos y Préstamos</p>
                    <h1 className="text-xl font-semibold text-gray-900">Gestión de Anticipos y Préstamos</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Control de solicitudes, aprobaciones y cuotas amortizadas en el rol de pagos.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Saldo Activo Cartera</span>
                            <span className="font-semibold text-gray-900 tabular-nums">
                                ${Number(stats.totalActiveBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Deducción Mes</span>
                            <span className="font-semibold text-red-700 tabular-nums">
                                −${Number(stats.monthlyDeductionsTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                    >
                        + Conceder Anticipo
                    </button>
                </div>
            </div>

            {/* Pestañas con Contadores Integrados (Holded/Linear Style) */}
            <div className="flex items-center justify-between border-b border-gray-200 gap-4 overflow-x-auto">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleTabChange('ALL')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'ALL'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Todos <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.total})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('PENDING')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'PENDING'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Por Revisar <span className="ml-1.5 font-mono text-[11px] text-amber-700">({stats.pending})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('APPROVED')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'APPROVED'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Vigentes en Cobro <span className="ml-1.5 font-mono text-[11px] text-emerald-600">({stats.approved})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('PAID')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'PAID'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Totalmente Pagados <span className="ml-1.5 font-mono text-[11px] text-blue-600">({stats.paid})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('REJECTED')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'REJECTED'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Rechazados <span className="ml-1.5 font-mono text-[11px] text-red-600">({stats.rejected})</span>
                    </button>
                </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="bg-white p-3 rounded border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por colaborador, cédula o motivo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={inputClass}
                    />
                    <button
                        type="submit"
                        className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors shrink-0 cursor-pointer"
                    >
                        Buscar
                    </button>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setPagination(prev => ({ ...prev, page: 1 }));
                                setTimeout(loadAdvancesData, 0);
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer shrink-0"
                        >
                            Limpiar
                        </button>
                    )}
                </form>
            </div>

            {/* Tabla Principal de Anticipos (Hoja de Cálculo Sobria) */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Colaborador</th>
                                <th className="py-2.5 px-4 text-right">Monto Total</th>
                                <th className="py-2.5 px-4 text-center">Cuotas</th>
                                <th className="py-2.5 px-4 text-right">Cuota Mensual</th>
                                <th className="py-2.5 px-4 text-right">Amortizado</th>
                                <th className="py-2.5 px-4 text-right">Saldo Restante</th>
                                <th className="py-2.5 px-4">Fecha Solicitud</th>
                                <th className="py-2.5 px-4 text-center">Estado</th>
                                <th className="py-2.5 px-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-gray-400 text-xs">
                                        Cargando anticipos y préstamos...
                                    </td>
                                </tr>
                            ) : advances.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-12 text-center">
                                        <p className="text-sm font-medium text-gray-700">Sin solicitudes de anticipo</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            No se encontraron registros con los filtros actuales.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                advances.map(adv => {
                                    const statusConfig = STATUS_MAP[adv.status] || STATUS_MAP.CANCELLED;
                                    const remainingBalance = Math.max(0, (adv.amount || 0) - (adv.paidAmount || 0));

                                    return (
                                        <tr key={adv.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-2.5 px-4">
                                                <p className="font-medium text-gray-900">
                                                    {adv.employee?.firstName} {adv.employee?.lastName}
                                                </p>
                                                <p className="text-gray-400 text-[11px]">
                                                    {adv.employee?.identityCard || 'C.I. S/N'} · {adv.employee?.department || 'General'}
                                                </p>
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                                                ${Number(adv.amount || 0).toFixed(2)}
                                            </td>
                                            <td className="py-2.5 px-4 text-center font-mono text-gray-600">
                                                {adv.paidInstallments}/{adv.installments}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono text-red-700 tabular-nums">
                                                −${Number(adv.monthlyDeduction || 0).toFixed(2)}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono text-gray-600 tabular-nums">
                                                ${Number(adv.paidAmount || 0).toFixed(2)}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900 tabular-nums">
                                                ${Number(remainingBalance).toFixed(2)}
                                            </td>
                                            <td className="py-2.5 px-4 font-mono text-[11px] text-gray-500 tabular-nums">
                                                {new Date(adv.requestDate || adv.createdAt).toLocaleDateString('es-EC')}
                                            </td>
                                            <td className="py-2.5 px-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${statusConfig.cls}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right">
                                                {adv.status === 'PENDING' ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenApproveModal(adv)}
                                                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenRejectModal(adv)}
                                                            className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenDetailModal(adv)}
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                    >
                                                        Detalles
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {!loading && pagination.totalPages > 1 && (
                    <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                        <span>Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)</span>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                className="px-2.5 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                className="px-2.5 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CONCESIÓN ADMINISTRATIVA */}
            {createModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-lg w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Conceder Anticipo / Préstamo</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Registre una entrega directa de fondos con descuento mensual programado.</p>
                            </div>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                            <div>
                                <label className={labelClass}>Colaborador</label>
                                <select
                                    required
                                    className={inputClass}
                                    value={adminFormData.employeeId}
                                    onChange={(e) => setAdminFormData({ ...adminFormData, employeeId: e.target.value })}
                                >
                                    <option value="">Seleccione un colaborador...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} — {emp.department || 'General'} ({emp.position || 'Colaborador'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Monto Total ($ USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        required
                                        className={inputClass + ' font-mono'}
                                        placeholder="0.00"
                                        value={adminFormData.amount}
                                        onChange={(e) => setAdminFormData({ ...adminFormData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Plazo (N° de Cuotas)</label>
                                    <select
                                        className={inputClass + ' font-mono'}
                                        value={adminFormData.installments}
                                        onChange={(e) => setAdminFormData({ ...adminFormData, installments: e.target.value })}
                                    >
                                        <option value="1">1 mes (Próxima Nómina)</option>
                                        <option value="2">2 meses</option>
                                        <option value="3">3 meses</option>
                                        <option value="4">4 meses</option>
                                        <option value="6">6 meses</option>
                                        <option value="12">12 meses (1 año)</option>
                                        <option value="18">18 meses</option>
                                        <option value="24">24 meses (2 años)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Previsualización del Descuento Mensual */}
                            {estimatedQuota > 0 && (
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded flex items-center justify-between text-xs">
                                    <span className="text-gray-600 font-medium">Descuento Mensual Estimado:</span>
                                    <span className="font-mono font-bold text-red-700 tabular-nums">
                                        ${estimatedQuota} USD / mes
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Motivo / Justificación</label>
                                <textarea
                                    rows="2"
                                    className={inputClass + ' resize-none'}
                                    placeholder="Ej. Anticipo quincenal solicitado por colaborador o préstamo para calamidad doméstica..."
                                    value={adminFormData.reason}
                                    onChange={(e) => setAdminFormData({ ...adminFormData, reason: e.target.value })}
                                />
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={adminFormData.autoApprove}
                                        onChange={(e) => setAdminFormData({ ...adminFormData, autoApprove: e.target.checked })}
                                    />
                                    <span>Aprobar inmediatamente para su cobro en el próximo rol de pagos</span>
                                </label>
                            </div>

                            <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                                >
                                    {actionLoading ? 'Procesando...' : 'Conceder Anticipo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL APROBACIÓN */}
            {approveModalOpen && selectedAdvance && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-sm w-full overflow-hidden shadow-xl">
                        <div className="p-5">
                            <h3 className="text-sm font-semibold text-gray-900">¿Aprobar solicitud de anticipo?</h3>
                            <div className="mt-3 space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                                <p><span className="font-medium text-gray-900">Colaborador:</span> {selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName}</p>
                                <p><span className="font-medium text-gray-900">Monto Solicitado:</span> ${selectedAdvance.amount.toFixed(2)} USD</p>
                                <p><span className="font-medium text-gray-900">Cuotas:</span> {selectedAdvance.installments} ({selectedAdvance.monthlyDeduction.toFixed(2)} USD/mes)</p>
                                {selectedAdvance.reason && (
                                    <p><span className="font-medium text-gray-900">Motivo:</span> {selectedAdvance.reason}</p>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2">
                                Al aprobar, se programará la deducción automática en las siguientes liquidaciones de nómina.
                            </p>
                        </div>
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setApproveModalOpen(false);
                                    setSelectedAdvance(null);
                                }}
                                className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleConfirmApprove}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {actionLoading ? 'Aprobando...' : 'Confirmar Aprobación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL RECHAZO */}
            {rejectModalOpen && selectedAdvance && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-md w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Rechazar Solicitud de Anticipo</h3>
                            <button
                                onClick={() => {
                                    setRejectModalOpen(false);
                                    setSelectedAdvance(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleConfirmReject} className="p-5 space-y-4">
                            <p className="text-xs text-gray-500">
                                Colaborador: <span className="font-semibold text-gray-900">{selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName}</span> (${selectedAdvance.amount.toFixed(2)} USD)
                            </p>
                            <div>
                                <label className={labelClass}>Motivo del Rechazo</label>
                                <textarea
                                    required
                                    rows="3"
                                    className={inputClass + ' resize-none'}
                                    placeholder="Indique la justificación formal del rechazo para notificación al colaborador..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                            <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRejectModalOpen(false);
                                        setSelectedAdvance(null);
                                    }}
                                    className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {actionLoading ? 'Procesando...' : 'Confirmar Rechazo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALLES */}
            {detailModalOpen && selectedAdvance && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-md w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Detalle de Anticipo / Préstamo</h3>
                            <button
                                onClick={() => {
                                    setDetailModalOpen(false);
                                    setSelectedAdvance(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-5 space-y-3 text-xs">
                            <div className="bg-gray-50 p-3.5 rounded border border-gray-200 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Colaborador:</span>
                                    <span className="font-semibold text-gray-900">{selectedAdvance.employee?.firstName} {selectedAdvance.employee?.lastName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Cédula / Dept:</span>
                                    <span className="font-mono text-gray-800">{selectedAdvance.employee?.identityCard || 'S/N'} · {selectedAdvance.employee?.department || 'General'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Monto Total:</span>
                                    <span className="font-mono font-semibold text-gray-900">${selectedAdvance.amount.toFixed(2)} USD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amortizado a la Fecha:</span>
                                    <span className="font-mono font-semibold text-emerald-700">${selectedAdvance.paidAmount.toFixed(2)} USD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Saldo Pendiente:</span>
                                    <span className="font-mono font-semibold text-gray-900">${Math.max(0, selectedAdvance.amount - selectedAdvance.paidAmount).toFixed(2)} USD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Progreso Cuotas:</span>
                                    <span className="font-mono text-gray-800">{selectedAdvance.paidInstallments} de {selectedAdvance.installments} cuotas (${selectedAdvance.monthlyDeduction.toFixed(2)}/mes)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Estado:</span>
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_MAP[selectedAdvance.status]?.cls}`}>
                                        {STATUS_MAP[selectedAdvance.status]?.label || selectedAdvance.status}
                                    </span>
                                </div>
                                {selectedAdvance.reason && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <span className="text-gray-500 block mb-0.5">Motivo / Justificación:</span>
                                        <span className="text-gray-800 italic">{selectedAdvance.reason}</span>
                                    </div>
                                )}
                                {selectedAdvance.rejectionReason && (
                                    <div className="pt-2 border-t border-gray-200 text-red-700">
                                        <span className="font-medium block mb-0.5">Motivo de Rechazo:</span>
                                        <span>{selectedAdvance.rejectionReason}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setDetailModalOpen(false);
                                    setSelectedAdvance(null);
                                }}
                                className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryAdvancesManagement;
