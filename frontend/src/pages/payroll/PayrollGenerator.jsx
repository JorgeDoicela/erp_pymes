import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePayroll, getPayrolls, getPayrollById, confirmPayroll, downloadBankFile, markPayrollAsPaid, deletePayroll, updatePayrollDetail } from '../../services/payroll/payrollConfig.service';
import { integratePayroll } from '../../services/accounting.service';
import { generatePayslipPDF } from '../../utils/generatePayslipPDF';
import ExportButtons from '../../components/common/ExportButtons';

const STATUS_MAP = {
    APPROVED: { label: 'APROBADO', cls: 'bg-green-50 text-green-800 border-green-200' },
    PAID: { label: 'PAGADO', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    DRAFT: { label: 'BORRADOR', cls: 'bg-amber-50 text-amber-800 border-amber-200' }
};

const PayrollGenerator = () => {
    const navigate = useNavigate();
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [genParams, setGenParams] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingDetail, setEditingDetail] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await getPayrolls();
            if (res.success) setPayrolls(res.data);
        } catch (error) {
            alert('Error al cargar nóminas: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await generatePayroll(genParams.month, genParams.year);
            if (res.success) {
                loadHistory();
                setModalOpen(false);
                viewDetail(res.data.id);
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setGenerating(false);
        }
    };

    const viewDetail = async (id) => {
        setLoading(true);
        try {
            const res = await getPayrollById(id);
            if (res.success) setSelectedPayroll(res.data);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirm('¿Aprobar esta nómina? No se podrán realizar cambios posteriores.')) return;
        try {
            const res = await confirmPayroll(selectedPayroll.id);
            if (res.success) { viewDetail(selectedPayroll.id); loadHistory(); }
        } catch (error) { alert(error.message); }
    };

    const handleDownloadBankFile = async () => {
        try {
            await downloadBankFile(selectedPayroll.id);
        } catch (error) { alert(error.message); }
    };

    const handleMarkAsPaid = async () => {
        if (!confirm('¿Confirmar que los pagos fueron realizados?')) return;
        try {
            const res = await markPayrollAsPaid(selectedPayroll.id);
            if (res.success) { viewDetail(selectedPayroll.id); loadHistory(); }
        } catch (error) { alert(error.message); }
    };

    const handleDelete = async () => {
        if (!confirm('¿Eliminar este borrador de nómina? Podrá regenerarla después.')) return;
        try {
            const res = await deletePayroll(selectedPayroll.id);
            if (res.success) { setSelectedPayroll(null); loadHistory(); }
        } catch (error) { alert(error.message); }
    };

    const handleIntegrateAccounting = async () => {
        if (!confirm('¿Generar asiento contable para esta nómina?')) return;
        try {
            const res = await integratePayroll(selectedPayroll.id);
            if (res.entryId && confirm(`${res.message}. ¿Deseas ver el asiento?`)) {
                navigate('/admin/accounting/journals', { state: { highlightEntryId: res.entryId } });
            } else { alert(res.message); }
        } catch (error) {
            const msg = error.response?.data?.message || 'Error integrando con contabilidad';
            alert(msg);
            if (error.response?.data?.entryId && confirm('Esta nómina ya fue contabilizada. ¿Ver el asiento?')) {
                navigate('/admin/accounting/journals', { state: { highlightEntryId: error.response.data.entryId } });
            }
        }
    };

    const handleUpdateDetail = async (e) => {
        e.preventDefault();
        try {
            const res = await updatePayrollDetail(editingDetail.id, editingDetail);
            if (res.success) { setEditModalOpen(false); viewDetail(selectedPayroll.id); }
        } catch (error) { alert(error.message); }
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
                            ? new Date(selectedPayroll.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
                            : 'Genera, revisa y aprueba las nóminas mensuales del personal.'}
                    </p>
                </div>
                {selectedPayroll ? (
                    <button onClick={() => setSelectedPayroll(null)} className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer shrink-0">
                        ← Historial
                    </button>
                ) : (
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => navigate('/admin/payroll/config')} className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer">
                            Configuración
                        </button>
                        <button onClick={() => setModalOpen(true)} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer">
                            + Nueva Nómina
                        </button>
                    </div>
                )}
            </div>

            {!selectedPayroll ? (
                /* VISTA HISTORIAL */
                <div>
                    {loading ? (
                        <div className="p-12 text-center text-gray-400 text-xs">Cargando historial de nóminas...</div>
                    ) : payrolls.length === 0 ? (
                        <div className="p-12 text-center bg-white border border-gray-200 rounded">
                            <p className="text-sm font-medium text-gray-700">Sin nóminas generadas</p>
                            <p className="text-xs text-gray-400 mt-1">Genera la primera nómina para comenzar el historial.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Periodo</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Total a Pagar</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payrolls.map(pay => {
                                        const s = STATUS_MAP[pay.status] || STATUS_MAP.DRAFT;
                                        return (
                                            <tr key={pay.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => viewDetail(pay.id)}>
                                                <td className="py-2.5 px-4 font-medium text-gray-900 capitalize">
                                                    {new Date(pay.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${s.cls}`}>{s.label}</span>
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                    ${(pay.totalAmount || 0).toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <button className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer">
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
                <div className="space-y-5">
                    {/* Barra de acciones de la nómina */}
                    <div className="bg-white border border-gray-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded text-[11px] font-mono border ${(STATUS_MAP[selectedPayroll.status] || STATUS_MAP.DRAFT).cls}`}>
                                {(STATUS_MAP[selectedPayroll.status] || STATUS_MAP.DRAFT).label}
                            </span>
                            <span className="text-xs text-gray-500">
                                {selectedPayroll.details?.length || 0} empleados procesados
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedPayroll.status === 'DRAFT' && (
                                <>
                                    <button onClick={handleDelete} className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer">
                                        Eliminar Borrador
                                    </button>
                                    <button onClick={handleConfirm} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer">
                                        Aprobar Nómina
                                    </button>
                                </>
                            )}
                            {(selectedPayroll.status === 'APPROVED' || selectedPayroll.status === 'PAID') && (
                                <>
                                    <ExportButtons type="payroll_csv" id={selectedPayroll.id} fileName={`nomina_${selectedPayroll.period.split('T')[0]}`} />
                                    <button onClick={handleDownloadBankFile} className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer">
                                        Archivo Banco
                                    </button>
                                    {selectedPayroll.status === 'APPROVED' && (
                                        <button onClick={handleMarkAsPaid} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer">
                                            Confirmar Pago
                                        </button>
                                    )}
                                    <button onClick={handleIntegrateAccounting} className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer" title="Generar asiento en Contabilidad">
                                        Contabilizar Role
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tabla de Detalles */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        {/* Mobile: tarjetas */}
                        <div className="block md:hidden divide-y divide-gray-100">
                            {selectedPayroll.details?.map(det => {
                                const bonuses = JSON.parse(det.bonuses || '[]');
                                const deductions = JSON.parse(det.deductions || '[]');
                                const totalBonuses = bonuses.reduce((a, b) => a + (Number(b.amount) || 0), 0);
                                const totalDeductions = deductions.reduce((a, b) => a + (Number(b.amount) || 0), 0);
                                return (
                                    <div key={det.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-900">{det.employee.firstName} {det.employee.lastName}</p>
                                                <p className="text-[11px] text-gray-400">Días trabajados: {det.workedDays}</p>
                                            </div>
                                            <span className="font-mono font-semibold text-gray-900 text-sm" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                ${(det.netSalary || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2 rounded border border-gray-100 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                            <div><span className="text-gray-400 text-[10px] block font-sans font-medium uppercase">Ingresos</span><span className="text-green-700">+${(totalBonuses + det.overtimeAmount).toFixed(2)}</span></div>
                                            <div><span className="text-gray-400 text-[10px] block font-sans font-medium uppercase">Deducciones</span><span className="text-red-700">−${totalDeductions.toFixed(2)}</span></div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            {selectedPayroll.status === 'DRAFT' && (
                                                <button onClick={() => { setEditingDetail({ ...det }); setEditModalOpen(true); }} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer">Editar</button>
                                            )}
                                            <button onClick={() => generatePayslipPDF(det, det.employee, selectedPayroll.period)} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer">PDF Rol</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop: tabla */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Sueldo Base</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Días</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Ingresos</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Hrs Extra</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Deducciones</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Neto a Pagar</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Acc.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedPayroll.details?.map(det => {
                                        const bonuses = JSON.parse(det.bonuses || '[]');
                                        const deductions = JSON.parse(det.deductions || '[]');
                                        const totalBonuses = bonuses.reduce((a, b) => a + (Number(b.amount) || 0), 0);
                                        const totalDeductions = deductions.reduce((a, b) => a + (Number(b.amount) || 0), 0);
                                        return (
                                            <tr key={det.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-2.5 px-4 font-medium text-gray-900">{det.employee.firstName} {det.employee.lastName}</td>
                                                <td className="py-2.5 px-4 text-right font-mono text-gray-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>${(det.baseSalary || 0).toFixed(2)}</td>
                                                <td className="py-2.5 px-4 text-center text-gray-700 font-mono">{det.workedDays}</td>
                                                <td className="py-2.5 px-4 text-right font-mono text-green-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>+${totalBonuses.toFixed(2)}</td>
                                                <td className="py-2.5 px-4 text-right font-mono text-gray-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>+${det.overtimeAmount.toFixed(2)}</td>
                                                <td className="py-2.5 px-4 text-right font-mono text-red-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>−${totalDeductions.toFixed(2)}</td>
                                                <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>${(det.netSalary || 0).toFixed(2)}</td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <div className="flex justify-center gap-1.5">
                                                        {selectedPayroll.status === 'DRAFT' && (
                                                            <button onClick={() => { setEditingDetail({ ...det }); setEditModalOpen(true); }} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer">Editar</button>
                                                        )}
                                                        <button onClick={() => generatePayslipPDF(det, det.employee, selectedPayroll.period)} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer">PDF</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL — Generar Nueva Nómina */}
            {modalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-sm w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Generar Nueva Nómina</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer">×</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className={labelClass}>Mes</label>
                                <select className={inputClass} value={genParams.month} onChange={e => setGenParams({ ...genParams, month: parseInt(e.target.value) })}>
                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                        <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es', { month: 'long' })}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Año</label>
                                <input type="number" className={inputClass} value={genParams.year} onChange={e => setGenParams({ ...genParams, year: parseInt(e.target.value) })} />
                            </div>
                        </div>
                        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button onClick={() => setModalOpen(false)} className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer">Cancelar</button>
                            <button onClick={handleGenerate} disabled={generating} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50">
                                {generating ? 'Calculando...' : 'Generar Nómina'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL — Editar Detalle de Rol */}
            {editModalOpen && editingDetail && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-2xl w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Ajuste Manual de Rol</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{editingDetail.employee.firstName} {editingDetail.employee.lastName}</p>
                            </div>
                            <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer">×</button>
                        </div>
                        <form onSubmit={handleUpdateDetail} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Sueldo Ganado (Mensual)</label>
                                    <input type="number" step="0.01" className={inputClass + ' font-mono'} value={editingDetail.baseSalary} onChange={e => setEditingDetail({ ...editingDetail, baseSalary: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Horas Extra ($)</label>
                                    <input type="number" step="0.01" className={inputClass + ' font-mono'} value={editingDetail.overtimeAmount} onChange={e => setEditingDetail({ ...editingDetail, overtimeAmount: parseFloat(e.target.value) })} />
                                </div>
                            </div>

                            {/* Bonos */}
                            <div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                                    <h4 className="text-xs font-semibold text-gray-700">Bonos e Ingresos Extra</h4>
                                    <button type="button" onClick={() => { const b = JSON.parse(editingDetail.bonuses || '[]'); b.push({ name: '', amount: 0 }); setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) }); }} className="text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer">+ Añadir Bono</button>
                                </div>
                                <div className="space-y-2">
                                    {JSON.parse(editingDetail.bonuses || '[]').map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input type="text" placeholder="Descripción" className={inputClass} value={item.name} onChange={e => { const b = JSON.parse(editingDetail.bonuses); b[idx].name = e.target.value; setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) }); }} />
                                            <input type="number" placeholder="$" className={inputClass + ' w-28 font-mono'} value={item.amount} onChange={e => { const b = JSON.parse(editingDetail.bonuses); b[idx].amount = parseFloat(e.target.value) || 0; setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) }); }} />
                                            <button type="button" onClick={() => { const b = JSON.parse(editingDetail.bonuses); b.splice(idx, 1); setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) }); }} className="text-red-400 hover:text-red-600 text-lg leading-none cursor-pointer">×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Deducciones */}
                            <div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                                    <h4 className="text-xs font-semibold text-gray-700">Deducciones y Egresos</h4>
                                    <button type="button" onClick={() => { const d = JSON.parse(editingDetail.deductions || '[]'); d.push({ name: '', amount: 0 }); setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) }); }} className="text-red-600 hover:text-red-700 text-xs font-medium cursor-pointer">+ Añadir Deducción</button>
                                </div>
                                <div className="space-y-2">
                                    {JSON.parse(editingDetail.deductions || '[]').map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input type="text" placeholder="Descripción" className={inputClass} value={item.name} onChange={e => { const d = JSON.parse(editingDetail.deductions); d[idx].name = e.target.value; setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) }); }} />
                                            <input type="number" placeholder="$" className={inputClass + ' w-28 font-mono'} value={item.amount} onChange={e => { const d = JSON.parse(editingDetail.deductions); d[idx].amount = parseFloat(e.target.value) || 0; setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) }); }} />
                                            <button type="button" onClick={() => { const d = JSON.parse(editingDetail.deductions); d.splice(idx, 1); setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) }); }} className="text-red-400 hover:text-red-600 text-lg leading-none cursor-pointer">×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resumen Neto */}
                            <div className="bg-gray-50 border border-gray-200 rounded p-3 flex justify-between items-center text-xs">
                                <span className="font-medium text-gray-600 uppercase tracking-wider">Neto a Pagar (Estimado)</span>
                                <span className="text-sm font-semibold font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                    ${(() => {
                                        try {
                                            const b = JSON.parse(editingDetail.bonuses || '[]');
                                            const d = JSON.parse(editingDetail.deductions || '[]');
                                            return ((parseFloat(editingDetail.baseSalary) || 0) + (parseFloat(editingDetail.overtimeAmount) || 0) + b.reduce((a, c) => a + (parseFloat(c.amount) || 0), 0) - d.reduce((a, c) => a + (parseFloat(c.amount) || 0), 0)).toFixed(2);
                                        } catch { return '0.00'; }
                                    })()}
                                </span>
                            </div>
                        </form>
                        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button type="button" onClick={() => setEditModalOpen(false)} className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer">Cancelar</button>
                            <button onClick={handleUpdateDetail} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer">Guardar Ajustes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollGenerator;
