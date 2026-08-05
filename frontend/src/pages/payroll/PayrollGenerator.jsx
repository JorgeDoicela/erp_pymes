import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generatePayroll, getPayrolls, getPayrollById, confirmPayroll, downloadBankFile, markPayrollAsPaid, deletePayroll } from '../../services/payroll/payrollConfig.service';
import { integratePayroll } from '../../services/accounting.service';
import { generatePayslipPDF } from '../../utils/generatePayslipPDF';
import ExportButtons from '../../components/common/ExportButtons';

const PayrollGenerator = () => {
    const navigate = useNavigate();
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState(null); // Full detail

    const [modalOpen, setModalOpen] = useState(false);
    const [genParams, setGenParams] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

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
            console.error('Error loading payrolls:', error);
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
                alert("Nómina generada exitosamente (Borrador)");
                loadHistory();
                setModalOpen(false);
                // Open detail immediately
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
            if (res.success) {
                setSelectedPayroll(res.data);
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirm("¿Está seguro de aprobar esta nómina? No se podrán hacer cambios.")) return;
        try {
            const res = await confirmPayroll(selectedPayroll.id);
            if (res.success) {
                alert("Nómina aprobada");
                viewDetail(selectedPayroll.id); // Refresh
                loadHistory();
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDownloadBankFile = async () => {
        try {
            await downloadBankFile(selectedPayroll.id);
            alert("Archivo descargado");
        } catch (error) {
            alert(error.message);
        }
    };

    // Note: ExportButtons component handles the CSV download via its own internal logic calling the new /export route

    const handleMarkAsPaid = async () => {
        if (!confirm("¿Confirmar que los pagos fueron realizados?")) return;
        try {
            const res = await markPayrollAsPaid(selectedPayroll.id);
            if (res.success) {
                alert("Pagos registrados exitosamente");
                viewDetail(selectedPayroll.id);
                loadHistory();
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Está seguro de eliminar este borrador de nómina? Podrá volver a generarla después de corregir los datos necesarios.")) return;
        try {
            const res = await deletePayroll(selectedPayroll.id);
            if (res.success) {
                alert("Borrador eliminado. El periodo ha sido liberado para una nueva generación.");
                setSelectedPayroll(null);
                loadHistory();
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const handleIntegrateAccounting = async () => {
        if (!confirm("¿Generar asiento contable (Nexus) para esta nómina? Esto creará un borrador en el módulo de Contabilidad.")) return;
        try {
            const res = await integratePayroll(selectedPayroll.id);
            if (res.entryId) {
                if (confirm(`${res.message}. ¿Deseas ver el asiento generado ahora?`)) {
                    navigate('/admin/accounting/journals', { state: { highlightEntryId: res.entryId } });
                }
            } else {
                alert(res.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Error integrando con contabilidad';
            alert(msg);
            if (error.response?.data?.entryId) {
                if (confirm("Esta nómina ya fue contabilizada anteriormente. ¿Deseas ver el asiento?")) {
                    navigate('/admin/accounting/journals', { state: { highlightEntryId: error.response.data.entryId } });
                }
            }
        }
    };

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingDetail, setEditingDetail] = useState(null);

    const handleUpdateDetail = async (e) => {
        e.preventDefault();
        try {
            const res = await updatePayrollDetail(editingDetail.id, editingDetail);
            if (res.success) {
                alert("Detalle actualizado y nómina recalculada");
                setEditModalOpen(false);
                viewDetail(selectedPayroll.id);
            }
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Generador de Roles de Pago</h2>
                    <p className="text-slate-500 text-sm">Gestiona y genera las nóminas mensuales</p>
                </div>
                {!selectedPayroll && (
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium"
                    >
                        Volver
                    </button>
                )}
            </div>

            {!selectedPayroll ? (
                /* LIST VIEW */
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800">Historial de Nóminas</h2>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/admin/payroll/config')}
                                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                            >
                                Configuración
                            </button>
                            <button
                                onClick={() => setModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
                            >
                                + Nueva Nómina
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-slate-400">Cargando nóminas...</div>
                        </div>
                    ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {payrolls.map(pay => (
                                <div key={pay.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group" onClick={() => viewDetail(pay.id)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-slate-500">Periodo</p>
                                            <p className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                                                {new Date(pay.period).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${pay.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' :
                                            pay.status === 'PAID' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            {pay.status === 'APPROVED' ? 'APROBADO' : pay.status === 'PAID' ? 'PAGADO' : 'BORRADOR'}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
                                        <span className="text-slate-500">Total a Pagar</span>
                                        <span className="text-xl font-mono font-bold text-emerald-600">${(pay.totalAmount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                            {payrolls.length === 0 && (
                                <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-500 font-medium">No hay nóminas generadas.</p>
                                    <p className="text-sm text-slate-400 mt-1">Crea una nueva nómina para comenzar.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* DETAIL VIEW */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <button onClick={() => setSelectedPayroll(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors mb-2">
                        <span>←</span> Volver al historial
                    </button>

                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Detalle de Nómina</h2>
                            <p className="text-slate-500 text-lg">
                                {new Date(selectedPayroll.period).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </p>
                            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold border ${selectedPayroll.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                selectedPayroll.status === 'PAID' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                {selectedPayroll.status === 'APPROVED' ? 'APROBADO' : selectedPayroll.status === 'PAID' ? 'PAGADO' : 'BORRADOR'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {selectedPayroll.status === 'DRAFT' && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDelete}
                                        className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm"
                                    >
                                        Eliminar Borrador
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all hover:shadow-md"
                                    >
                                        Aprobar Nómina
                                    </button>
                                </div>
                            )}
                            {(selectedPayroll.status === 'APPROVED' || selectedPayroll.status === 'PAID') && (
                                <>
                                    <ExportButtons
                                        type="payroll_csv"
                                        id={selectedPayroll.id}
                                        fileName={`nomina_${selectedPayroll.period.split('T')[0]}`}
                                    />
                                    <button
                                        onClick={handleDownloadBankFile}
                                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors"
                                    >
                                        Archivo Banco
                                    </button>
                                    {selectedPayroll.status === 'APPROVED' && (
                                        <button
                                            onClick={handleMarkAsPaid}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                                        >
                                            Confirmar Pago
                                        </button>
                                    )}
                                    <button
                                        onClick={handleIntegrateAccounting}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                                        title="Generar asiento en Contabilidad"
                                    >
                                        Contabilizar Role
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4">Empleado</th>
                                        <th className="p-4 text-right">Sueldo Ganado</th>
                                        <th className="p-4 text-center">Días Trab.</th>
                                        <th className="p-4 text-right">Ingresos (Bonos)</th>
                                        <th className="p-4 text-right">Hrs Extra ($)</th>
                                        <th className="p-4 text-right">Egresos (Deduc.)</th>
                                        <th className="p-4 text-right text-slate-800">Neto a Pagar</th>
                                        <th className="p-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedPayroll.details.map(det => {
                                        const bonuses = JSON.parse(det.bonuses || '[]');
                                        const deductions = JSON.parse(det.deductions || '[]');
                                        const totalBonuses = bonuses.reduce((a, b) => a + b.amount, 0);
                                        const totalDeductions = deductions.reduce((a, b) => a + b.amount, 0);

                                        return (
                                            <tr key={det.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-medium text-slate-900">
                                                    {det.employee.firstName} {det.employee.lastName}
                                                </td>
                                                <td className="p-4 text-right font-mono font-medium">
                                                    ${(det.baseSalary || 0).toFixed(2)}
                                                    {det.employee?.contracts?.[0]?.salary && Math.abs(det.employee.contracts[0].salary - det.baseSalary) > 0.01 && (
                                                        <div className="text-[10px] text-slate-400 font-sans" title="Sueldo base mensual según contrato">
                                                            Contrato: ${det.employee.contracts[0].salary.toFixed(2)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">{det.workedDays}</td>
                                                <td className="p-4 text-right text-emerald-600 font-mono font-medium">
                                                    +${totalBonuses.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right text-purple-600 font-mono font-medium">
                                                    +${det.overtimeAmount.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right text-red-500 font-mono font-medium">
                                                    -${totalDeductions.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right text-emerald-700 font-bold font-mono text-lg">
                                                    ${(det.netSalary || 0).toFixed(2)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        {selectedPayroll.status === 'DRAFT' && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingDetail({ ...det });
                                                                    setEditModalOpen(true);
                                                                }}
                                                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                                            >
                                                                Editar
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => generatePayslipPDF(det, det.employee, selectedPayroll.period)}
                                                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm"
                                                            title="Descargar Rol Individual"
                                                        >
                                                            PDF
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )
            }

            {/* GENERATE MODAL */}
            {
                modalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-xl border border-slate-200 w-96 shadow-2xl">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Generar Nueva Nómina</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Mes</label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={genParams.month}
                                        onChange={e => setGenParams({ ...genParams, month: parseInt(e.target.value) })}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Año</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={genParams.year}
                                        onChange={e => setGenParams({ ...genParams, year: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-800 px-4 py-2 font-medium transition-colors">Cancelar</button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                                >
                                    {generating ? 'Calculando...' : 'Generar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* EDIT DETAIL MODAL */}
            {
                editModalOpen && editingDetail && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden">
                            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Ajuste Manual de Rol</h3>
                                    <p className="text-sm text-slate-500">{editingDetail.employee.firstName} {editingDetail.employee.lastName}</p>
                                </div>
                                <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                            </div>

                            <form onSubmit={handleUpdateDetail} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Sueldo Ganado (Mensual)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400 font-mono">$</span>
                                            <input
                                                type="number" step="0.01"
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 pl-8 text-slate-800 font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={editingDetail.baseSalary}
                                                onChange={e => setEditingDetail({ ...editingDetail, baseSalary: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Horas Extra ($)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400 font-mono">$</span>
                                            <input
                                                type="number" step="0.01"
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 pl-8 text-slate-800 font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={editingDetail.overtimeAmount}
                                                onChange={e => setEditingDetail({ ...editingDetail, overtimeAmount: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <h4 className="font-bold text-slate-800">Bonos e Ingresos Extra</h4>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const b = JSON.parse(editingDetail.bonuses || '[]');
                                                b.push({ name: '', amount: 0 });
                                                setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) });
                                            }}
                                            className="text-blue-600 hover:text-blue-700 text-xs font-bold"
                                        >
                                            + Añadir Bono
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                        {JSON.parse(editingDetail.bonuses || '[]').map((item, idx) => (
                                            <div key={idx} className="flex gap-3 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Descripción"
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-400"
                                                    value={item.name}
                                                    onChange={e => {
                                                        const b = JSON.parse(editingDetail.bonuses);
                                                        b[idx].name = e.target.value;
                                                        setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) });
                                                    }}
                                                />
                                                <div className="relative w-28">
                                                    <span className="absolute left-2 top-2 text-slate-400 text-xs">$</span>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 pl-5 text-sm font-mono outline-none focus:border-blue-400"
                                                        value={item.amount}
                                                        onChange={e => {
                                                            const b = JSON.parse(editingDetail.bonuses);
                                                            b[idx].amount = parseFloat(e.target.value) || 0;
                                                            setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) });
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const b = JSON.parse(editingDetail.bonuses);
                                                        b.splice(idx, 1);
                                                        setEditingDetail({ ...editingDetail, bonuses: JSON.stringify(b) });
                                                    }}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <h4 className="font-bold text-slate-800">Deducciones y Egresos</h4>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const d = JSON.parse(editingDetail.deductions || '[]');
                                                d.push({ name: '', amount: 0 });
                                                setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) });
                                            }}
                                            className="text-red-600 hover:text-red-700 text-xs font-bold"
                                        >
                                            + Añadir Deducción
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                        {JSON.parse(editingDetail.deductions || '[]').map((item, idx) => (
                                            <div key={idx} className="flex gap-3 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Descripción"
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-red-400"
                                                    value={item.name}
                                                    onChange={e => {
                                                        const d = JSON.parse(editingDetail.deductions);
                                                        d[idx].name = e.target.value;
                                                        setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) });
                                                    }}
                                                />
                                                <div className="relative w-28">
                                                    <span className="absolute left-2 top-2 text-slate-400 text-xs">$</span>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 pl-5 text-sm font-mono outline-none focus:border-red-400"
                                                        value={item.amount}
                                                        onChange={e => {
                                                            const d = JSON.parse(editingDetail.deductions);
                                                            d[idx].amount = parseFloat(e.target.value) || 0;
                                                            setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) });
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const d = JSON.parse(editingDetail.deductions);
                                                        d.splice(idx, 1);
                                                        setEditingDetail({ ...editingDetail, deductions: JSON.stringify(d) });
                                                    }}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                                    <span className="text-blue-800 font-bold uppercase text-xs">Neto a Pagar:</span>
                                    <span className="text-2xl font-bold text-blue-900 font-mono">
                                        ${(() => {
                                            try {
                                                const b = JSON.parse(editingDetail.bonuses || '[]');
                                                const d = JSON.parse(editingDetail.deductions || '[]');
                                                const totalB = b.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                                                const totalD = d.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                                                const net = (parseFloat(editingDetail.baseSalary) || 0) +
                                                    (parseFloat(editingDetail.overtimeAmount) || 0) +
                                                    totalB - totalD;
                                                return net.toFixed(2);
                                            } catch (e) {
                                                return "0.00";
                                            }
                                        })()}
                                    </span>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setEditModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancelar</button>
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-all">Guardar Ajustes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PayrollGenerator;
