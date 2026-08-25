import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getMyPayrolls, signPayslipDetail, disputePayslipDetail } from '../../services/payroll/payrollConfig.service';
import { generatePayslipPDF } from '../../utils/generatePayslipPDF';
import Modal from '../../components/common/Modal';
import {
    FiFileText,
    FiEye,
    FiCheckCircle,
    FiAlertCircle,
    FiClock,
    FiCheck,
    FiShield
} from 'react-icons/fi';

const STATUS_SIGNATURE_MAP = {
    SIGNED: { label: 'Firmado de Conformidad', badge: 'text-emerald-700 font-medium' },
    PENDING: { label: 'Pendiente de Firma', badge: 'text-amber-700 font-medium' },
    DISPUTED: { label: 'Observación Registrada', badge: 'text-red-700 font-medium' }
};

const MyPayments = ({ user }) => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayroll, setSelectedPayroll] = useState(null);

    // Modales de Acción
    const [signModalOpen, setSignModalOpen] = useState(false);
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [activeDetail, setActiveDetail] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [signing, setSigning] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getMyPayrolls();
            if (res.success) setPayrolls(res.data || []);
        } catch (error) {
            console.error('Error cargando roles de pago:', error);
            toast.error('Error al cargar los recibos de pago');
        } finally {
            setLoading(false);
        }
    };

    const handleSign = async () => {
        if (!activeDetail) return;
        setSigning(true);
        try {
            const res = await signPayslipDetail(activeDetail.id, {
                signatureType: 'DIGITAL_CONFORMITY',
                notes: 'Aceptación y conformidad de rol de pagos mensual'
            });
            if (res.success) {
                toast.success('Rol de pagos firmado exitosamente');
                setSignModalOpen(false);
                loadData();
            } else {
                toast.error(res.message || 'No se pudo firmar');
            }
        } catch (error) {
            toast.error(error.message || 'Error al firmar');
        } finally {
            setSigning(false);
        }
    };

    const handleDispute = async () => {
        if (!activeDetail || !disputeReason.trim()) {
            toast.error('Indica el motivo de la observación');
            return;
        }
        setSigning(true);
        try {
            const res = await disputePayslipDetail(activeDetail.id, disputeReason);
            if (res.success) {
                toast.success('Observación enviada a Talento Humano');
                setDisputeModalOpen(false);
                setDisputeReason('');
                loadData();
            } else {
                toast.error(res.message || 'No se pudo enviar la observación');
            }
        } catch (error) {
            toast.error(error.message || 'Error al procesar');
        } finally {
            setSigning(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Mis Roles de Pago</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Consulta tus recibos de nómina mensuales, firma de conformidad o registra observaciones.
                    </p>
                </div>
            </div>

            {/* Listado de Roles */}
            {loading ? (
                <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-500 text-xs">
                    Cargando tus recibos de pago...
                </div>
            ) : payrolls.length === 0 ? (
                <div className="bg-white p-12 rounded border border-gray-200 text-center text-gray-400 text-xs">
                    <FiFileText size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-700">Sin roles de pago disponibles</p>
                    <p className="text-gray-400 mt-0.5">Aún no se han emitido nóminas aprobadas para tu usuario.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {payrolls.map(detail => {
                        const periodDate = new Date(detail.payroll?.period);
                        const periodName = periodDate.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
                        const deductionsList = (() => {
                            try { return JSON.parse(detail.deductions) || []; }
                            catch { return []; }
                        })();
                        const deductionsSum = deductionsList.reduce((a, b) => a + (b.amount || 0), 0);
                        const grossSum = detail.netSalary + deductionsSum;

                        const sigStatus = detail.signatureStatus || 'PENDING';
                        const sigConfig = STATUS_SIGNATURE_MAP[sigStatus] || STATUS_SIGNATURE_MAP.PENDING;

                        return (
                            <div key={detail.id} className="bg-white p-4 rounded border border-gray-200 flex flex-col justify-between space-y-4">
                                <div>
                                    <div className="flex justify-between items-start pb-3 border-b border-gray-100 mb-3">
                                        <div>
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block font-sans">
                                                Período Fiscal
                                            </span>
                                            <h3 className="text-sm font-bold text-gray-900 capitalize">
                                                {periodName}
                                            </h3>
                                        </div>
                                        <span className={`text-xs font-medium ${sigConfig.badge}`}>
                                            {sigConfig.label}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Ingresos Brutos:</span>
                                            <span className="font-mono tabular-nums text-gray-800">${grossSum.toFixed(2)} USD</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Descuentos y Retenciones:</span>
                                            <span className="font-mono tabular-nums text-rose-700">-${deductionsSum.toFixed(2)} USD</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold">
                                            <span className="text-gray-900">Líquido a Recibir:</span>
                                            <span className="font-mono tabular-nums text-emerald-800 font-bold">${detail.netSalary.toFixed(2)} USD</span>
                                        </div>

                                        {sigStatus === 'SIGNED' && detail.signedAt && (
                                            <div className="pt-2 text-[11px] text-gray-400 font-mono">
                                                Firmado el {new Date(detail.signedAt).toLocaleDateString('es-EC')} (Código: {detail.signatureCode || 'SIG-EC'})
                                            </div>
                                        )}

                                        {sigStatus === 'DISPUTED' && detail.disputeReason && (
                                            <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-800 mt-2">
                                                <span className="font-bold">Observación:</span> {detail.disputeReason}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    {/* Botón de Firma si está pendiente */}
                                    {sigStatus === 'PENDING' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setActiveDetail(detail); setSignModalOpen(true); }}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-2.5 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                            >
                                                <FiCheck size={13} />
                                                <span>Aprobar / Firmar</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setActiveDetail(detail); setDisputeModalOpen(true); }}
                                                className="border border-red-300 hover:bg-red-50 text-red-700 text-xs font-medium py-1.5 px-2.5 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <FiAlertCircle size={13} />
                                                <span>Observar</span>
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPayroll(detail)}
                                            className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-medium px-2.5 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <FiEye size={12} />
                                            <span>Ver Detalle</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => generatePayslipPDF(detail, detail.employee || user, detail.payroll?.period)}
                                            className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-2.5 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <FiFileText size={12} />
                                            <span>Descargar PDF</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL DETALLE DE ROL */}
            <Modal
                isOpen={!!selectedPayroll}
                onClose={() => setSelectedPayroll(null)}
                title={selectedPayroll ? `Desglose de Rol de Pagos — ${new Date(selectedPayroll.payroll?.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}` : ''}
                subtitle="Detalle formal de ingresos, deducciones de ley y firma."
                size="lg"
                footer={
                        <div className="flex flex-wrap items-center justify-between w-full gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedPayroll(null)}
                                className="px-3.5 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 cursor-pointer"
                            >
                                Cerrar
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => generatePayslipPDF(selectedPayroll, selectedPayroll.employee || user, selectedPayroll.payroll?.period, { isPhysicalPrint: true })}
                                    className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium cursor-pointer"
                                    title="Descargar rol limpio para imprimir en papel y firmar con esfero"
                                >
                                    PDF para Firma Física
                                </button>
                                <button
                                    type="button"
                                    onClick={() => generatePayslipPDF(selectedPayroll, selectedPayroll.employee || user, selectedPayroll.payroll?.period, { isPhysicalPrint: false })}
                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium cursor-pointer shadow-xs"
                                    title="Descargar rol con sellos electrónicos y código QR"
                                >
                                    Descargar PDF Digital
                                </button>
                            </div>
                        </div>
                }
            >
                {selectedPayroll && (
                    <div className="space-y-4 text-xs text-gray-700">
                        <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
                            <div>
                                <span className="text-gray-500">Días Laborados Base 30: </span>
                                <span className="font-mono font-medium text-gray-900">{selectedPayroll.workedDays} días</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Sueldo Base Mensual: </span>
                                <span className="font-mono font-medium text-gray-900">${Number(selectedPayroll.baseSalary || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Ingresos */}
                        <div>
                            <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1 mb-2">Ingresos y Bonos</h4>
                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Sueldo Ganado</span>
                                    <span className="font-mono text-gray-900">${Number(selectedPayroll.baseSalary || 0).toFixed(2)}</span>
                                </div>
                                {selectedPayroll.overtimeAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Horas Extras ({selectedPayroll.overtimeHours} hrs)</span>
                                        <span className="font-mono text-gray-900">+${Number(selectedPayroll.overtimeAmount).toFixed(2)}</span>
                                    </div>
                                )}
                                {(() => {
                                    try {
                                        const bonuses = JSON.parse(selectedPayroll.bonuses || '[]');
                                        return bonuses.map((b, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span className="text-gray-600">{b.name || b.concept}</span>
                                                <span className="font-mono text-gray-900">+${Number(b.amount || 0).toFixed(2)}</span>
                                            </div>
                                        ));
                                    } catch { return null; }
                                })()}
                            </div>
                        </div>

                        {/* Deducciones */}
                        <div>
                            <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1 mb-2">Deducciones de Ley</h4>
                            <div className="space-y-1.5">
                                {(() => {
                                    try {
                                        const deductions = JSON.parse(selectedPayroll.deductions || '[]');
                                        return deductions.map((d, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span className="text-gray-600">{d.name || d.concept}</span>
                                                <span className="font-mono text-gray-900">−${Number(d.amount || 0).toFixed(2)}</span>
                                            </div>
                                        ));
                                    } catch { return null; }
                                })()}
                            </div>
                        </div>

                        {/* Total Neto */}
                        <div className="py-2.5 border-t border-b border-gray-200 flex justify-between items-center text-sm font-semibold text-gray-900">
                            <span>Total Neto a Recibir:</span>
                            <span className="font-mono text-base font-bold text-gray-900">${Number(selectedPayroll.netSalary || 0).toFixed(2)} USD</span>
                        </div>

                        {/* Bloque de Sellos y Firmas */}
                        <div className="pt-2">
                            <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Firmas y Validez Legal</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {/* Sello Empleador */}
                                <div className="p-3 border border-gray-200 rounded">
                                    <p className="font-semibold text-gray-900">{selectedPayroll.employee?.tenant?.name || 'EMPLIFI S.A.'}</p>
                                    <p className="text-[11px] text-gray-500">Dpto. Talento Humano y Nómina</p>
                                    <p className="text-[11px] text-gray-600 mt-1">Autorización y Emisión Conforme</p>
                                </div>

                                {/* Sello Colaborador */}
                                <div className="p-3 border border-gray-200 rounded">
                                    <p className="font-semibold text-gray-900">
                                        {selectedPayroll.employee?.firstName} {selectedPayroll.employee?.lastName}
                                    </p>
                                    <p className="text-[11px] text-gray-500">C.I.: {selectedPayroll.employee?.identityCard || 'S/N'}</p>
                                    {selectedPayroll.signatureStatus === 'SIGNED' ? (
                                        <p className="text-[11px] text-emerald-700 font-medium mt-1">
                                            Firmado el {selectedPayroll.signedAt ? new Date(selectedPayroll.signedAt).toLocaleDateString('es-EC') : 'Digital'}
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-amber-700 font-medium mt-1">
                                            Pendiente de firma del colaborador
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL FIRMA DE CONFORMIDAD */}
            <Modal
                isOpen={signModalOpen && !!activeDetail}
                onClose={() => setSignModalOpen(false)}
                title="Firma de Conformidad de Rol"
                size="md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setSignModalOpen(false)}
                            className="px-3.5 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSign}
                            disabled={signing}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            {signing ? 'Firmando...' : 'Aceptar y Firmar Digitalmente'}
                        </button>
                    </>
                }
            >
                {activeDetail && (
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Al firmar este documento, certificas la correcta recepción del valor neto de{' '}
                            <strong className="text-gray-900 font-mono">${Number(activeDetail.netSalary).toFixed(2)} USD</strong> correspondiente al período de{' '}
                            <strong>{new Date(activeDetail.payroll?.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}</strong>.
                        </p>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1 text-[11px]">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Colaborador:</span>
                                <span className="font-bold text-gray-900">{activeDetail.employee?.firstName} {activeDetail.employee?.lastName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">C.I.:</span>
                                <span className="font-mono text-gray-800">{activeDetail.employee?.identityCard}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tipo de Firma:</span>
                                <span className="font-medium text-emerald-800">Sello Digital Criptográfico QR</span>
                            </div>
                        </div>

                        <p className="text-[11px] text-gray-400">
                            Esta firma digital tiene validez conforme a la Ley de Comercio Electrónico y Firmas Digitales del Ecuador.
                        </p>
                    </div>
                )}
            </Modal>

            {/* MODAL REPORTAR OBSERVACIÓN */}
            <Modal
                isOpen={disputeModalOpen && !!activeDetail}
                onClose={() => setDisputeModalOpen(false)}
                title="Reportar Observación en Rol"
                size="md"
            >
                {activeDetail && (
                    <form onSubmit={handleDispute} className="space-y-4">
                        <p className="text-gray-600">
                            Si encuentras alguna discrepancia en tus horas extras, días trabajados o descuentos, descríbela a continuación para que Recursos Humanos la revise:
                        </p>
                        <textarea
                            required
                            rows="3"
                            placeholder="Ej. No se reflejan las 4 horas extraordinarias del sábado 15..."
                            className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                            value={disputeReason}
                            onChange={e => setDisputeReason(e.target.value)}
                        />

                        <div className="pt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDisputeModalOpen(false)}
                                className="px-3.5 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={signing}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                            >
                                {signing ? 'Enviando...' : 'Enviar Observación'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default MyPayments;
