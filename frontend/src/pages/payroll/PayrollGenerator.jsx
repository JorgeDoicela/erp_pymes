import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generatePayroll, getPayrolls, getPayrollById, confirmPayroll, downloadBankFile, markPayrollAsPaid } from '../../services/payroll/payrollConfig.service';
import { generatePayslipPDF } from '../../utils/generatePayslipPDF';

const PayrollGenerator = () => {
    const navigate = useNavigate();
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState(null); // Full detail

    const [modalOpen, setModalOpen] = useState(false);
    const [genParams, setGenParams] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

    useEffect(() => {
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

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-8">
                Generador de Roles de Pago
            </h1>

            {!selectedPayroll ? (
                /* LIST VIEW */
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-white/5">
                        <h2 className="text-xl font-bold">Historial de Nóminas</h2>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/admin/payroll/config')}
                                className="text-slate-400 hover:text-white px-4 py-2 font-medium"
                            >
                                ⚙️ Configuración
                            </button>
                            <button
                                onClick={() => setModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-colors"
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
                                <div key={pay.id} className="bg-slate-800 p-6 rounded-xl border border-white/5 hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => viewDetail(pay.id)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-slate-400">Periodo</p>
                                            <p className="text-xl font-bold text-white">
                                                {new Date(pay.period).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${pay.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {pay.status === 'APPROVED' ? 'APROBADO' : 'BORRADOR'}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
                                        <span className="text-slate-400">Total a Pagar</span>
                                        <span className="text-xl font-mono font-bold text-emerald-400">${pay.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                            {payrolls.length === 0 && <p className="text-slate-500">No hay nóminas generadas.</p>}
                        </div>
                    )}
                </div>
            ) : (
                /* DETAIL VIEW */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <button onClick={() => setSelectedPayroll(null)} className="text-slate-400 hover:text-white mb-4">← Volver al historial</button>

                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold">Detalle de Nómina</h2>
                            <p className="text-slate-400">
                                {new Date(selectedPayroll.period).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </p>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${selectedPayroll.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                selectedPayroll.status === 'PAID' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {selectedPayroll.status === 'APPROVED' ? 'APROBADO' : selectedPayroll.status === 'PAID' ? 'PAGADO' : 'BORRADOR'}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            {selectedPayroll.status === 'DRAFT' && (
                                <button
                                    onClick={handleConfirm}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-emerald-500/20"
                                >
                                    ✅ Aprobar Nómina
                                </button>
                            )}
                            {selectedPayroll.status === 'APPROVED' && (
                                <>
                                    <button
                                        onClick={handleDownloadBankFile}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                                    >
                                        Archivo Banco
                                    </button>
                                    <button
                                        onClick={handleMarkAsPaid}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                                    >
                                        ✓ Confirmar Pago
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl overflow-hidden border border-white/5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-300">
                                <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-500">
                                    <tr>
                                        <th className="p-4">Empleado</th>
                                        <th className="p-4 text-right">Sueldo Base</th>
                                        <th className="p-4 text-center">Días Trab.</th>
                                        <th className="p-4 text-right">Ingresos (Bonos)</th>
                                        <th className="p-4 text-right">Hrs Extra ($)</th>
                                        <th className="p-4 text-right">Egresos (Deduc.)</th>
                                        <th className="p-4 text-right text-white">Neto a Pagar</th>
                                        <th className="p-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {selectedPayroll.details.map(det => {
                                        const bonuses = JSON.parse(det.bonuses || '[]');
                                        const deductions = JSON.parse(det.deductions || '[]');
                                        const totalBonuses = bonuses.reduce((a, b) => a + b.amount, 0);
                                        const totalDeductions = deductions.reduce((a, b) => a + b.amount, 0);

                                        return (
                                            <tr key={det.id} className="hover:bg-slate-700/30">
                                                <td className="p-4 font-medium text-white">
                                                    {det.employee.firstName} {det.employee.lastName}
                                                </td>
                                                <td className="p-4 text-right">${det.baseSalary.toFixed(2)}</td>
                                                <td className="p-4 text-center">{det.workedDays}</td>
                                                <td className="p-4 text-right text-green-400 font-mono">
                                                    +${totalBonuses.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right text-purple-400 font-mono">
                                                    +${det.overtimeAmount.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right text-red-400 font-mono">
                                                    -${totalDeductions.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right text-emerald-400 font-bold font-mono text-lg">
                                                    ${det.netSalary.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => generatePayslipPDF(det, det.employee, selectedPayroll.period)}
                                                        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-xs"
                                                        title="Descargar Rol Individual"
                                                    >
                                                        PDF
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* GENERATE MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-8 rounded-xl border border-white/10 w-96 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Generar Nueva Nómina</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Mes</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    value={genParams.month}
                                    onChange={e => setGenParams({ ...genParams, month: parseInt(e.target.value) })}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                        <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es', { month: 'long' })}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Año</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                    value={genParams.year}
                                    onChange={e => setGenParams({ ...genParams, year: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white px-4 py-2">Cancelar</button>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold"
                            >
                                {generating ? 'Calculando...' : 'Generar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollGenerator;
