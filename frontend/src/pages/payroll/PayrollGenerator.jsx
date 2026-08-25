import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    generatePayroll,
    getPayrolls,
    getPayrollById,
    confirmPayroll,
    downloadBankFile,
    markPayrollAsPaid,
    deletePayroll,
    updatePayrollDetail,
    notifyPendingPayrollSignatures
} from '../../services/payroll/payrollConfig.service';
import { integratePayroll } from '../../services/accounting.service';
import { generatePayslipPDF } from '../../utils/generatePayslipPDF';
import ExportButtons from '../../components/common/ExportButtons';
import Modal from '../../components/common/Modal';
import { FiBell } from 'react-icons/fi';

const STATUS_MAP = {
    APPROVED: { label: 'Aprobado', cls: 'text-green-800 bg-green-50 border-green-200' },
    PAID: { label: 'Pagado', cls: 'text-blue-800 bg-blue-50 border-blue-200' },
    DRAFT: { label: 'Borrador', cls: 'text-amber-800 bg-amber-50 border-amber-200' }
};

const SIG_STATUS_MAP = {
    SIGNED: { label: 'Firmado', cls: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
    PENDING: { label: 'Pendiente', cls: 'text-amber-800 bg-amber-50 border-amber-200' },
    DISPUTED: { label: 'Observado', cls: 'text-red-800 bg-red-50 border-red-200' }
};

const PayrollGenerator = () => {
    const navigate = useNavigate();
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [genParams, setGenParams] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingDetail, setEditingDetail] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        isDestructive: false,
        onConfirm: null
    });

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await getPayrolls();
            if (res.success) {
                setPayrolls(res.data || []);
            }
        } catch (error) {
            toast.error(error.message || 'Error al cargar el historial de nóminas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        let isMounted = true;
        getPayrolls()
            .then(res => {
                if (isMounted && res.success) {
                    setPayrolls(res.data || []);
                }
            })
            .catch(error => {
                if (isMounted) toast.error(error.message || 'Error al cargar el historial de nóminas');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const res = await generatePayroll(genParams.month, genParams.year);
            if (res.success && res.data) {
                toast.success(`Nómina borrador generada para ${genParams.month}/${genParams.year}`);
                setModalOpen(false);
                await loadHistory();
                await viewDetail(res.data.id);
            }
        } catch (error) {
            toast.error(error.message || 'Error al generar nómina');
        } finally {
            setGenerating(false);
        }
    };

    const viewDetail = async (id) => {
        setLoading(true);
        try {
            const res = await getPayrollById(id);
            if (res.success && res.data) {
                setSelectedPayroll(res.data);
                setSearchTerm('');
            }
        } catch (error) {
            toast.error(error.message || 'Error al cargar detalle de nómina');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayroll = () => {
        setConfirmDialog({
            open: true,
            title: 'Aprobar Nómina',
            message: '¿Está seguro de aprobar esta nómina? Una vez aprobada, se congelarán los valores de rol, se procesarán los anticipos/beneficios y no se permitirán más modificaciones manuales.',
            confirmText: 'Aprobar Definitivamente',
            isDestructive: false,
            onConfirm: async () => {
                try {
                    const res = await confirmPayroll(selectedPayroll.id);
                    if (res.success) {
                        toast.success('Nómina aprobada con éxito');
                        setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
                        await viewDetail(selectedPayroll.id);
                        await loadHistory();
                    }
                } catch (error) {
                    toast.error(error.message || 'Error al aprobar nómina');
                }
            }
        });
    };

    const handleDownloadBankFile = async () => {
        try {
            toast.loading('Generando archivo bancario...', { id: 'bank-download' });
            await downloadBankFile(selectedPayroll.id);
            toast.success('Archivo bancario descargado correctamente', { id: 'bank-download' });
        } catch (error) {
            toast.error(error.message || 'Error al generar archivo bancario', { id: 'bank-download' });
        }
    };

    const handleMarkAsPaid = () => {
        setConfirmDialog({
            open: true,
            title: 'Confirmar Pago de Nómina',
            message: '¿Confirma que las transferencias o desembolsos a los colaboradores han sido ejecutados satisfactoriamente?',
            confirmText: 'Registrar como Pagado',
            isDestructive: false,
            onConfirm: async () => {
                try {
                    const res = await markPayrollAsPaid(selectedPayroll.id);
                    if (res.success) {
                        toast.success('Estado de nómina actualizado a Pagado');
                        setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
                        await viewDetail(selectedPayroll.id);
                        await loadHistory();
                    }
                } catch (error) {
                    toast.error(error.message || 'Error al marcar como pagado');
                }
            }
        });
    };

    const handleDelete = () => {
        setConfirmDialog({
            open: true,
            title: 'Eliminar Borrador de Nómina',
            message: '¿Está seguro de eliminar este borrador de nómina? Todos los cálculos temporales se descartarán. Podrá regenerarla nuevamente cuando lo desee.',
            confirmText: 'Eliminar Borrador',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await deletePayroll(selectedPayroll.id);
                    if (res.success) {
                        toast.success('Borrador de nómina eliminado');
                        setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
                        setSelectedPayroll(null);
                        await loadHistory();
                    }
                } catch (error) {
                    toast.error(error.message || 'Error al eliminar nómina');
                }
            }
        });
    };

    const handleIntegrateAccounting = () => {
        setConfirmDialog({
            open: true,
            title: 'Generar Asiento Contable',
            message: '¿Desea asentar automáticamente esta nómina en el Libro Diario de Contabilidad?',
            confirmText: 'Contabilizar',
            isDestructive: false,
            onConfirm: async () => {
                try {
                    const res = await integratePayroll(selectedPayroll.id);
                    setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
                    toast.success(res.message || 'Asiento contable generado con éxito');
                    if (res.entryId) {
                        navigate('/admin/accounting/journals', { state: { highlightEntryId: res.entryId } });
                    }
                } catch (error) {
                    const msg = error.response?.data?.message || 'Error al integrar con contabilidad';
                    toast.error(msg);
                    if (error.response?.data?.entryId) {
                        navigate('/admin/accounting/journals', { state: { highlightEntryId: error.response.data.entryId } });
                    }
                }
            }
        });
    };

    const handleUpdateDetail = async (e) => {
        e.preventDefault();
        try {
            const res = await updatePayrollDetail(editingDetail.id, editingDetail);
            if (res.success) {
                toast.success('Detalle de rol de pago actualizado');
                setEditModalOpen(false);
                await viewDetail(selectedPayroll.id);
            }
        } catch (error) {
            toast.error(error.message || 'Error al actualizar detalle');
        }
    };

    // Filtered details
    const filteredDetails = useMemo(() => {
        if (!selectedPayroll?.details) return [];
        if (!searchTerm.trim()) return selectedPayroll.details;
        const q = searchTerm.toLowerCase();
        return selectedPayroll.details.filter(det => {
            const name = `${det.employee?.firstName || ''} ${det.employee?.lastName || ''}`.toLowerCase();
            const idCard = (det.employee?.identityCard || '').toLowerCase();
            const dept = (det.employee?.department || '').toLowerCase();
            return name.includes(q) || idCard.includes(q) || dept.includes(q);
        });
    }, [selectedPayroll, searchTerm]);

    // Financial totals for the active payroll
    const financialSummary = useMemo(() => {
        if (!selectedPayroll?.details) return { base: 0, overtime: 0, bonuses: 0, deductions: 0, net: 0, count: 0 };
        return selectedPayroll.details.reduce((acc, det) => {
            const bonuses = typeof det.bonuses === 'string' ? JSON.parse(det.bonuses || '[]') : (det.bonuses || []);
            const deductions = typeof det.deductions === 'string' ? JSON.parse(det.deductions || '[]') : (det.deductions || []);
            const bSum = bonuses.reduce((s, b) => s + (Number(b.amount) || 0), 0);
            const dSum = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
            return {
                base: acc.base + Number(det.baseSalary || 0),
                overtime: acc.overtime + Number(det.overtimeAmount || 0),
                bonuses: acc.bonuses + bSum,
                deductions: acc.deductions + dSum,
                net: acc.net + Number(det.netSalary || 0),
                count: acc.count + 1
            };
        }, { base: 0, overtime: 0, bonuses: 0, deductions: 0, net: 0, count: 0 });
    }, [selectedPayroll]);

    const signatureStats = useMemo(() => {
        if (!selectedPayroll?.details) return { signed: 0, pending: 0, disputed: 0 };
        let signed = 0, pending = 0, disputed = 0;
        selectedPayroll.details.forEach(d => {
            if (d.signatureStatus === 'SIGNED') signed++;
            else if (d.signatureStatus === 'DISPUTED') disputed++;
            else pending++;
        });
        return { signed, pending, disputed };
    }, [selectedPayroll]);

    const handleNotifyPending = async () => {
        if (!selectedPayroll) return;
        try {
            const res = await notifyPendingPayrollSignatures(selectedPayroll.id);
            toast.success(res.message || 'Recordatorios de firma enviados');
        } catch (error) {
            toast.error(error.message || 'Error al enviar recordatorios');
        }
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";
    const labelClass = "block text-xs font-medium text-gray-600 mb-1";

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Nómina · Roles de Pago</p>
                    <h1 className="text-xl font-semibold text-gray-900">
                        {selectedPayroll ? 'Detalle de Nómina' : 'Generador de Roles de Pago'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {selectedPayroll
                            ? new Date(selectedPayroll.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' })
                            : 'Genera, revisa, valida y aprueba los roles de pago de todo el personal.'}
                    </p>
                </div>
                {selectedPayroll ? (
                    <button
                        type="button"
                        onClick={() => setSelectedPayroll(null)}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                    >
                        ← Volver al Historial
                    </button>
                ) : (
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/payroll/config')}
                            className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                        >
                            Configuración
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                        >
                            + Nueva Nómina
                        </button>
                    </div>
                )}
            </div>

            {!selectedPayroll ? (
                /* VISTA HISTORIAL */
                <div>
                    {loading ? (
                        <div className="p-12 text-center text-gray-400 text-xs">
                            Cargando historial de nóminas...
                        </div>
                    ) : payrolls.length === 0 ? (
                        <div className="p-12 text-center bg-white border border-gray-200 rounded">
                            <p className="text-sm font-medium text-gray-700">Sin nóminas generadas</p>
                            <p className="text-xs text-gray-400 mt-1">Haga clic en "+ Nueva Nómina" para calcular el primer rol de pagos.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-200">
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Total Neto</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payrolls.map(pay => {
                                        const s = STATUS_MAP[pay.status] || STATUS_MAP.DRAFT;
                                        return (
                                            <tr
                                                key={pay.id}
                                                className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                                                onClick={() => viewDetail(pay.id)}
                                            >
                                                <td className="py-2.5 px-4 font-medium text-gray-900 capitalize">
                                                    {new Date(pay.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${s.cls}`}>
                                                        {s.label}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                    ${Number(pay.totalAmount || 0).toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                    >
                                                        Ver detalle →
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                /* VISTA DETALLE */
                <div className="space-y-4">
                    {/* Barra de Resumen Financiero y Acciones */}
                    <div className="bg-white border border-gray-200 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Estado e Indicadores Clave */}
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                            <span className={`px-2.5 py-1 rounded text-[11px] font-mono border ${(STATUS_MAP[selectedPayroll.status] || STATUS_MAP.DRAFT).cls}`}>
                                {(STATUS_MAP[selectedPayroll.status] || STATUS_MAP.DRAFT).label}
                            </span>
                            <div className="flex items-center gap-3 text-gray-600">
                                <span>Colaboradores: <strong className="font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{financialSummary.count}</strong></span>
                                <span>·</span>
                                <span>Total Neto: <strong className="font-mono text-gray-900 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>${financialSummary.net.toFixed(2)}</strong></span>
                                {selectedPayroll.status !== 'DRAFT' && (
                                    <>
                                        <span>·</span>
                                        <span className="text-[11px]">
                                            Firmas: <strong className="text-emerald-700">{signatureStats.signed} firmados</strong>,{' '}
                                            <strong className="text-amber-700">{signatureStats.pending} pendientes</strong>
                                            {signatureStats.disputed > 0 && <strong className="text-red-700">, {signatureStats.disputed} observados</strong>}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Botonera de Acciones Operativas */}
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedPayroll.status === 'DRAFT' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                    >
                                        Eliminar Borrador
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmPayroll}
                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                                    >
                                        Aprobar Nómina
                                    </button>
                                </>
                            )}
                            {(selectedPayroll.status === 'APPROVED' || selectedPayroll.status === 'PAID') && (
                                <>
                                    <ExportButtons
                                        type="payroll_csv"
                                        id={selectedPayroll.id}
                                        fileName={`nomina_${selectedPayroll.period.split('T')[0]}`}
                                    />
                                    {signatureStats.pending > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleNotifyPending}
                                            className="px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                            title="Enviar recordatorio de firma por notificación a los colaboradores pendientes"
                                        >
                                            <FiBell className="w-3.5 h-3.5 text-amber-700" />
                                            <span>Recordar Firmas ({signatureStats.pending})</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleDownloadBankFile}
                                        className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                    >
                                        Archivo Banco
                                    </button>
                                    {selectedPayroll.status === 'APPROVED' && (
                                        <button
                                            type="button"
                                            onClick={handleMarkAsPaid}
                                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                                        >
                                            Confirmar Pago
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleIntegrateAccounting}
                                        className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                        title="Generar o consultar asiento en Contabilidad"
                                    >
                                        Contabilizar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Barra de Filtro / Búsqueda */}
                    <div className="bg-white border border-gray-200 rounded px-4 py-3 flex items-center justify-between gap-3">
                        <div className="w-full max-w-sm">
                            <input
                                type="text"
                                placeholder="Buscar colaborador por nombre, cédula o área..."
                                className={inputClass}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <span className="text-[11px] text-gray-500 shrink-0 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            Mostrando {filteredDetails.length} de {selectedPayroll.details?.length || 0} registros
                        </span>
                    </div>

                    {/* Tabla de Colaboradores */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        {/* Mobile: Tarjetas */}
                        <div className="block md:hidden divide-y divide-gray-100">
                            {filteredDetails.map(det => {
                                const bonuses = typeof det.bonuses === 'string' ? JSON.parse(det.bonuses || '[]') : (det.bonuses || []);
                                const deductions = typeof det.deductions === 'string' ? JSON.parse(det.deductions || '[]') : (det.deductions || []);
                                const totalBonuses = bonuses.reduce((a, b) => a + (Number(b.amount) || 0), 0);
                                const totalDeductions = deductions.reduce((a, b) => a + (Number(b.amount) || 0), 0);
                                return (
                                    <div key={det.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-900">
                                                    {det.employee?.firstName} {det.employee?.lastName}
                                                </p>
                                                <p className="text-[11px] text-gray-400">
                                                    {det.employee?.position || det.employee?.department} · Días: {det.workedDays}
                                                </p>
                                            </div>
                                            <span className="font-mono font-semibold text-gray-900 text-sm" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                ${Number(det.netSalary || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2 rounded border border-gray-100 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                            <div>
                                                <span className="text-gray-400 text-[10px] block font-sans font-medium uppercase">Ingresos</span>
                                                <span className="text-green-700">+${(totalBonuses + Number(det.overtimeAmount || 0)).toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 text-[10px] block font-sans font-medium uppercase">Deducciones</span>
                                                <span className="text-red-700">−${totalDeductions.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            {(() => {
                                                const sig = SIG_STATUS_MAP[det.signatureStatus] || SIG_STATUS_MAP.PENDING;
                                                return <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${sig.cls}`}>{sig.label}</span>;
                                            })()}
                                            <div className="flex gap-2">
                                                {selectedPayroll.status === 'DRAFT' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditingDetail({ ...det }); setEditModalOpen(true); }}
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                    >
                                                        Editar
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => generatePayslipPDF(det, det.employee, selectedPayroll.period, { isPhysicalPrint: false })}
                                                    className="border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                                >
                                                    PDF Digital
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => generatePayslipPDF(det, det.employee, selectedPayroll.period, { isPhysicalPrint: true })}
                                                    className="border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                                >
                                                    PDF Físico
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop: Tabla */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-200">
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Colaborador</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Sueldo Base</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Días</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Hrs Extra</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Ingresos Adic.</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Deducciones</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Neto a Recibir</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Firma</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredDetails.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="p-8 text-center text-gray-400 text-xs">
                                                No se encontraron colaboradores con el término de búsqueda ingresado.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDetails.map(det => {
                                            const bonuses = typeof det.bonuses === 'string' ? JSON.parse(det.bonuses || '[]') : (det.bonuses || []);
                                            const deductions = typeof det.deductions === 'string' ? JSON.parse(det.deductions || '[]') : (det.deductions || []);
                                            const totalBonuses = bonuses.reduce((a, b) => a + (Number(b.amount) || 0), 0);
                                            const totalDeductions = deductions.reduce((a, b) => a + (Number(b.amount) || 0), 0);
                                            return (
                                                <tr key={det.id} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="py-2.5 px-4">
                                                        <p className="font-medium text-gray-900">{det.employee?.firstName} {det.employee?.lastName}</p>
                                                        <p className="text-[11px] text-gray-400 font-mono">{det.employee?.identityCard}</p>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right font-mono text-gray-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                        ${Number(det.baseSalary || 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center font-mono text-gray-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                        {det.workedDays}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right font-mono text-gray-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                        +${Number(det.overtimeAmount || 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right font-mono text-green-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                        +${totalBonuses.toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right font-mono text-red-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                        −${totalDeductions.toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                        ${Number(det.netSalary || 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center">
                                                        {(() => {
                                                            const sig = SIG_STATUS_MAP[det.signatureStatus] || SIG_STATUS_MAP.PENDING;
                                                            return (
                                                                <span
                                                                    className={`px-2 py-0.5 rounded text-[10px] font-medium border ${sig.cls}`}
                                                                    title={det.disputeReason ? `Observación: ${det.disputeReason}` : (det.signedAt ? `Firmado: ${new Date(det.signedAt).toLocaleDateString('es-EC')}` : 'Pendiente de firma')}
                                                                >
                                                                    {sig.label}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center">
                                                        <div className="flex justify-center gap-1.5">
                                                            {selectedPayroll.status === 'DRAFT' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setEditingDetail({ ...det }); setEditModalOpen(true); }}
                                                                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                                >
                                                                    Editar
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => generatePayslipPDF(det, det.employee, selectedPayroll.period, { isPhysicalPrint: false })}
                                                                className="border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                                                title="Descargar Rol Digital (con sellos electrónicos y QR)"
                                                            >
                                                                PDF Digital
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => generatePayslipPDF(det, det.employee, selectedPayroll.period, { isPhysicalPrint: true })}
                                                                className="border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                                                title="Descargar Formato en Blanco para Firma Manuscrita / Física"
                                                            >
                                                                PDF Físico
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL — Generar Nueva Nómina */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Generar Nueva Nómina"
                size="sm"
            >
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label className={labelClass}>Mes a Procesar</label>
                        <select
                            className={inputClass}
                            value={genParams.month}
                            onChange={e => setGenParams({ ...genParams, month: parseInt(e.target.value, 10) })}
                        >
                            {[
                                { m: 1, name: 'Enero' },
                                { m: 2, name: 'Febrero' },
                                { m: 3, name: 'Marzo' },
                                { m: 4, name: 'Abril' },
                                { m: 5, name: 'Mayo' },
                                { m: 6, name: 'Junio' },
                                { m: 7, name: 'Julio' },
                                { m: 8, name: 'Agosto' },
                                { m: 9, name: 'Septiembre' },
                                { m: 10, name: 'Octubre' },
                                { m: 11, name: 'Noviembre' },
                                { m: 12, name: 'Diciembre' }
                            ].map(item => (
                                <option key={item.m} value={item.m}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Año Fiscal</label>
                        <input
                            type="number"
                            min="2020"
                            max="2040"
                            className={`${inputClass} font-mono`}
                            value={genParams.year}
                            onChange={e => setGenParams({ ...genParams, year: parseInt(e.target.value, 10) })}
                        />
                    </div>
                    <p className="text-[11px] text-gray-400">
                        Se procesarán automáticamente las asistencias, turnos, horas extra, recargos nocturnos y beneficios aplicables al período.
                    </p>
                    <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={generating}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                            {generating ? 'Calculando...' : 'Generar Nómina'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL — Ajuste Manual de Rol (Modo Borrador) */}
            <Modal
                isOpen={editModalOpen && !!editingDetail}
                onClose={() => setEditModalOpen(false)}
                title="Ajuste Manual de Rol"
                subtitle={editingDetail ? `${editingDetail.employee?.firstName} ${editingDetail.employee?.lastName}` : ''}
                size="lg"
            >
                {editingDetail && (
                    <form onSubmit={handleUpdateDetail} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Sueldo Base Ganado ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`${inputClass} font-mono`}
                                    value={editingDetail.baseSalary}
                                    onChange={e => setEditingDetail({ ...editingDetail, baseSalary: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Horas Extra ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`${inputClass} font-mono`}
                                    value={editingDetail.overtimeAmount}
                                    onChange={e => setEditingDetail({ ...editingDetail, overtimeAmount: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        {/* Bonos e Ingresos Extra */}
                        <div>
                            <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                                <h4 className="text-xs font-semibold text-gray-700">Bonos e Ingresos Extra</h4>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const b = typeof editingDetail.bonuses === 'string' ? JSON.parse(editingDetail.bonuses || '[]') : (editingDetail.bonuses || []);
                                        b.push({ name: '', amount: 0 });
                                        setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) });
                                    }}
                                    className="text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer"
                                >
                                    + Añadir Ingreso
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(typeof editingDetail.bonuses === 'string' ? JSON.parse(editingDetail.bonuses || '[]') : (editingDetail.bonuses || [])).map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Descripción del ingreso"
                                            className={inputClass}
                                            value={item.name}
                                            onChange={e => {
                                                const b = JSON.parse(editingDetail.bonuses);
                                                b[idx].name = e.target.value;
                                                setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) });
                                            }}
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="$"
                                            className={`${inputClass} w-28 font-mono`}
                                            value={item.amount}
                                            onChange={e => {
                                                const b = JSON.parse(editingDetail.bonuses);
                                                b[idx].amount = parseFloat(e.target.value) || 0;
                                                setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) });
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const b = JSON.parse(editingDetail.bonuses);
                                                b.splice(idx, 1);
                                                setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) });
                                            }}
                                            className="text-red-400 hover:text-red-600 text-lg leading-none cursor-pointer"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Deducciones y Egresos */}
                        <div>
                            <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                                <h4 className="text-xs font-semibold text-gray-700">Deducciones y Egresos</h4>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const d = typeof editingDetail.deductions === 'string' ? JSON.parse(editingDetail.deductions || '[]') : (editingDetail.deductions || []);
                                        d.push({ name: '', amount: 0 });
                                        setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) });
                                    }}
                                    className="text-red-600 hover:text-red-700 text-xs font-medium cursor-pointer"
                                >
                                    + Añadir Deducción
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(typeof editingDetail.deductions === 'string' ? JSON.parse(editingDetail.deductions || '[]') : (editingDetail.deductions || [])).map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Descripción del descuento"
                                            className={inputClass}
                                            value={item.name}
                                            onChange={e => {
                                                const d = JSON.parse(editingDetail.deductions);
                                                d[idx].name = e.target.value;
                                                setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) });
                                            }}
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="$"
                                            className={`${inputClass} w-28 font-mono`}
                                            value={item.amount}
                                            onChange={e => {
                                                const d = JSON.parse(editingDetail.deductions);
                                                d[idx].amount = parseFloat(e.target.value) || 0;
                                                setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) });
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const d = JSON.parse(editingDetail.deductions);
                                                d.splice(idx, 1);
                                                setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) });
                                            }}
                                            className="text-red-400 hover:text-red-600 text-lg leading-none cursor-pointer"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resumen Estimado del Rol */}
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 flex justify-between items-center text-xs">
                            <span className="font-medium text-gray-600 uppercase tracking-wider">Neto a Recibir (Estimado)</span>
                            <span className="text-sm font-semibold font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                ${(() => {
                                    try {
                                        const b = JSON.parse(editingDetail.bonuses || '[]');
                                        const d = JSON.parse(editingDetail.deductions || '[]');
                                        const totalB = b.reduce((a, c) => a + (parseFloat(c.amount) || 0), 0);
                                        const totalD = d.reduce((a, c) => a + (parseFloat(c.amount) || 0), 0);
                                        const totalNet = (parseFloat(editingDetail.baseSalary) || 0) + (parseFloat(editingDetail.overtimeAmount) || 0) + totalB - totalD;
                                        return Math.max(0, totalNet).toFixed(2);
                                    } catch {
                                        return '0.00';
                                    }
                                })()}
                            </span>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditModalOpen(false)}
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                            >
                                Guardar Ajustes
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal de Confirmación Estándar ERP */}
            <Modal
                isOpen={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
                title={confirmDialog.title}
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
                            className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmDialog.onConfirm}
                            className={`px-3.5 py-2 text-white text-xs font-medium rounded transition-colors cursor-pointer ${
                                confirmDialog.isDestructive
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                            }`}
                        >
                            {confirmDialog.confirmText || 'Confirmar'}
                        </button>
                    </>
                }
            >
                <div className="text-xs text-gray-600 leading-relaxed">
                    {confirmDialog.message}
                </div>
            </Modal>
        </div>
    );
};

export default PayrollGenerator;
