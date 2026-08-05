import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    requestAdvance, 
    getMyAdvances, 
    cancelAdvance 
} from '../../services/payroll/salaryAdvance.service';
import { 
    BanknotesIcon, 
    ClockIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    PlusIcon, 
    ShieldCheckIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const MySalaryAdvances = () => {
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [form, setForm] = useState({
        amount: '',
        installments: 1,
        reason: ''
    });

    useEffect(() => {
        loadMyAdvances();
    }, []);

    const loadMyAdvances = async () => {
        setLoading(true);
        try {
            const res = await getMyAdvances();
            if (res.success) {
                setAdvances(res.data);
            }
        } catch (error) {
            console.error('Error al obtener mis anticipos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await requestAdvance({
                amount: parseFloat(form.amount),
                installments: parseInt(form.installments, 10),
                reason: form.reason
            });
            if (res.success) {
                alert('Solicitud enviada exitosamente a RRHH/Administración');
                setModalOpen(false);
                setForm({ amount: '', installments: 1, reason: '' });
                loadMyAdvances();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('¿Deseas cancelar esta solicitud de anticipo?')) return;
        try {
            const res = await cancelAdvance(id);
            if (res.success) {
                alert('Solicitud cancelada');
                loadMyAdvances();
            }
        } catch (error) {
            alert(error.message);
        }
    };

    // Calculation preview for modal
    const requestedAmount = parseFloat(form.amount || 0);
    const numInstallments = parseInt(form.installments || 1, 10);
    const calculatedMonthly = requestedAmount > 0 ? (requestedAmount / numInstallments).toFixed(2) : '0.00';

    const activeAdvance = advances.find(a => a.status === 'APPROVED');
    const pendingAdvance = advances.find(a => a.status === 'PENDING');

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircleIcon className="w-4 h-4" /> Aprobado</span>;
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><ClockIcon className="w-4 h-4" /> Pendiente de Aprobación</span>;
            case 'PAID':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><ShieldCheckIcon className="w-4 h-4" /> Pagado Completamente</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><XCircleIcon className="w-4 h-4" /> No Aprobado</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Cancelado</span>;
            default:
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <BanknotesIcon className="w-8 h-8 text-blue-600" />
                        Mis Anticipos y Préstamos
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Solicita adelantos de sueldo o préstamos internos con descuento automático mensual
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Solicitar Anticipo / Préstamo
                </button>
            </div>

            {/* Policy Info Alert */}
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-blue-800 text-xs leading-relaxed">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-blue-900">Política de Préstamos y Anticipos Institucional:</p>
                    <p className="mt-0.5">
                        • Los anticipos de 1 cuota se descuentan íntegramente en la nómina del mes.<br />
                        • Los préstamos multicuota (hasta 24 meses) descuentan una cuota fija mensual.<br />
                        • La cuota mensual no debe exceder el 50% de tu sueldo base mensual.
                    </p>
                </div>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <ClockIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase">Solicitud Pendiente</p>
                        <p className="text-lg font-bold text-slate-800 mt-0.5">
                            {pendingAdvance ? `$${pendingAdvance.amount.toFixed(2)} (${pendingAdvance.installments} cuotas)` : 'Ninguna'}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase">Anticipo / Préstamo Activo</p>
                        <p className="text-lg font-bold text-slate-800 mt-0.5">
                            {activeAdvance ? `$${activeAdvance.monthlyDeduction.toFixed(2)} / mes (${activeAdvance.paidInstallments}/${activeAdvance.installments} cuotas)` : 'Sin préstamos activos'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Advances History Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-base">Historial de Solicitudes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-200/80">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4 text-right">Monto</th>
                                <th className="p-4 text-center">Cuotas</th>
                                <th className="p-4 text-right">Descuento Mensual</th>
                                <th className="p-4 text-center">Progreso</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">
                                        Cargando solicitudes...
                                    </td>
                                </tr>
                            ) : advances.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">
                                        No has realizado ninguna solicitud de anticipo o préstamo aún.
                                    </td>
                                </tr>
                            ) : (
                                advances.map(adv => (
                                    <tr key={adv.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 text-xs font-medium text-slate-700">
                                            {new Date(adv.requestDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-900">
                                            ${adv.amount.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center font-mono text-xs font-semibold">
                                            {adv.installments} {adv.installments === 1 ? 'cuota' : 'cuotas'}
                                        </td>
                                        <td className="p-4 text-right font-mono text-red-600 font-semibold">
                                            -${adv.monthlyDeduction.toFixed(2)} / mes
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-mono font-medium text-slate-600 mb-1">
                                                    {adv.paidInstallments} de {adv.installments} pagadas
                                                </span>
                                                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                                    <div 
                                                        className="bg-emerald-500 h-full transition-all duration-300"
                                                        style={{ width: `${(adv.paidInstallments / adv.installments) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(adv.status)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {adv.status === 'PENDING' ? (
                                                <button
                                                    onClick={() => handleCancel(adv.id)}
                                                    className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            ) : adv.rejectionReason ? (
                                                <span className="text-xs text-rose-500 italic" title={adv.rejectionReason}>
                                                    Nota: {adv.rejectionReason}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Request Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Solicitar Anticipo / Préstamo</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Completa los datos para enviar la solicitud a RRHH</p>
                                </div>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                                >
                                    &times;
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Monto Solicitado ($)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-3 text-slate-400 font-mono font-bold">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="10"
                                            required
                                            placeholder="ej. 300.00"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-9 font-mono text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Plazo en Cuotas Mensuales
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        value={form.installments}
                                        onChange={(e) => setForm({ ...form, installments: e.target.value })}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24].map(n => (
                                            <option key={n} value={n}>
                                                {n} {n === 1 ? 'cuota (Anticipo de mes)' : `cuotas mensual (${n} meses)`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Preview Card */}
                                {requestedAmount > 0 && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-slate-500 font-semibold">Descuento Mensual Estimado:</p>
                                            <p className="text-xl font-bold font-mono text-blue-600 mt-0.5">
                                                -${calculatedMonthly} / mes
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">Total a Pagar:</p>
                                            <p className="text-xs font-bold font-mono text-slate-700 mt-0.5">
                                                ${requestedAmount.toFixed(2)} en {numInstallments} pago(s)
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Motivo / Justificación (Opcional)
                                    </label>
                                    <textarea
                                        rows="2"
                                        placeholder="ej. Gastos de salud familiares, emergencia imprevista..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        value={form.reason}
                                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !requestedAmount}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                                    >
                                        {submitting ? 'Enviando...' : 'Enviar Solicitud'}
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

export default MySalaryAdvances;
