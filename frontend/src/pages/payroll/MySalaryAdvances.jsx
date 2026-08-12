import React, { useState, useEffect } from 'react';
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
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">Aprobado</span>;
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Pendiente</span>;
            case 'PAID':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">Pagado</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">Rechazado</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">Cancelado</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="bg-white p-5 rounded border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Anticipos y Créditos
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Mis Anticipos y Préstamos
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Solicita adelantos de sueldo o préstamos internos con descuento automático en rol de pagos.
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                    <PlusIcon className="w-4 h-4" />
                    Solicitar Anticipo / Préstamo
                </button>
            </div>

            {/* Policy Info Alert */}
            <div className="bg-white border border-gray-200 rounded p-4 flex items-start gap-3 text-gray-700 text-xs">
                <InformationCircleIcon className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-gray-900">Política Institucional de Adelantos:</p>
                    <p className="mt-0.5 text-gray-500">
                        • Los anticipos de 1 cuota se descuentan íntegramente en el rol de pago del mes.<br />
                        • Los préstamos multicuota (hasta 24 meses) deducen un valor fijo mensual.<br />
                        • La cuota mensual no podrá exceder el 50% de la remuneración mensual unificada.
                    </p>
                </div>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Solicitud Pendiente</p>
                        <p className="text-base font-bold text-gray-900 font-mono tabular-nums mt-0.5">
                            {pendingAdvance ? `$${pendingAdvance.amount.toFixed(2)} (${pendingAdvance.installments} cuotas)` : 'Ninguna'}
                        </p>
                    </div>
                    <div className="w-8 h-8 rounded bg-gray-100 text-gray-700 font-mono flex items-center justify-center text-xs font-semibold">
                        P
                    </div>
                </div>

                <div className="bg-white p-4 rounded border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Anticipo / Préstamo Activo</p>
                        <p className="text-base font-bold text-gray-900 font-mono tabular-nums mt-0.5">
                            {activeAdvance ? `$${activeAdvance.monthlyDeduction.toFixed(2)} / mes (${activeAdvance.paidInstallments}/${activeAdvance.installments} cuotas)` : 'Sin préstamos activos'}
                        </p>
                    </div>
                    <div className="w-8 h-8 rounded bg-gray-100 text-gray-700 font-mono flex items-center justify-center text-xs font-semibold">
                        A
                    </div>
                </div>
            </div>

            {/* Advances History Table */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Historial de Solicitudes</h2>
                </div>

                {/* VISTA MÓVIL */}
                <div className="block md:hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-xs font-mono">Cargando solicitudes...</div>
                    ) : advances.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs">
                            No has realizado ninguna solicitud de anticipo o préstamo aún.
                        </div>
                    ) : (
                        advances.map(adv => (
                            <div key={adv.id} className="p-4 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-gray-500 font-mono">
                                        {new Date(adv.requestDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    {getStatusBadge(adv.status)}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded border border-gray-200 font-mono">
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Monto</span>
                                        <span className="font-bold text-gray-900">${adv.amount.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Descuento Mensual</span>
                                        <span className="font-bold text-red-700">-${adv.monthlyDeduction.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1">
                                    <span className="text-gray-500 font-mono text-[11px]">
                                        Progreso: {adv.paidInstallments} / {adv.installments} cuotas
                                    </span>
                                    {adv.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleCancel(adv.id)}
                                            className="text-xs text-red-600 hover:underline cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* VISTA ESCRITORIO: Tabla Completa */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs text-left text-gray-600">
                        <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200 tracking-wider">
                            <tr>
                                <th className="px-4 py-2.5">Fecha</th>
                                <th className="px-4 py-2.5 text-right">Monto</th>
                                <th className="px-4 py-2.5 text-center">Cuotas</th>
                                <th className="px-4 py-2.5 text-right">Descuento Mensual</th>
                                <th className="px-4 py-2.5 text-center">Progreso</th>
                                <th className="px-4 py-2.5 text-center">Estado</th>
                                <th className="px-4 py-2.5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400 font-mono">
                                        Cargando solicitudes...
                                    </td>
                                </tr>
                            ) : advances.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400 text-sm">
                                        No has realizado ninguna solicitud de anticipo o préstamo aún.
                                    </td>
                                </tr>
                            ) : (
                                advances.map(adv => (
                                    <tr key={adv.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3 font-mono text-gray-700">
                                            {new Date(adv.requestDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                                            ${adv.amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono text-xs">
                                            {adv.installments} {adv.installments === 1 ? 'cuota' : 'cuotas'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-red-700">
                                            -${adv.monthlyDeduction.toFixed(2)} / mes
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono text-[11px] text-gray-600">
                                            {adv.paidInstallments} de {adv.installments} pagadas
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(adv.status)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {adv.status === 'PENDING' ? (
                                                <button
                                                    onClick={() => handleCancel(adv.id)}
                                                    className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded transition-colors cursor-pointer"
                                                >
                                                    Cancelar
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">—</span>
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
            {modalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Solicitar Anticipo / Préstamo</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Ingresa el monto deseado y número de cuotas requeridas</p>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Monto Solicitado ($ USD)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="10"
                                    required
                                    placeholder="Ej. 300.00"
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Plazo de Pago (Cuotas Mensuales)
                                </label>
                                <select
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                    value={form.installments}
                                    onChange={(e) => setForm({ ...form, installments: e.target.value })}
                                >
                                    {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24].map(n => (
                                        <option key={n} value={n}>
                                            {n} {n === 1 ? 'cuota (Deducción en próximo rol)' : `cuotas mensuales (${n} meses)`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Preview Card */}
                            {requestedAmount > 0 && (
                                <div className="bg-gray-50 border border-gray-200 rounded p-3 flex justify-between items-center text-xs">
                                    <div>
                                        <p className="text-gray-500">Descuento Mensual:</p>
                                        <p className="font-bold font-mono text-gray-900 mt-0.5">
                                            -${calculatedMonthly} USD / mes
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500">Total a Deducción:</p>
                                        <p className="font-semibold font-mono text-gray-800 mt-0.5">
                                            ${requestedAmount.toFixed(2)} en {numInstallments} cuota(s)
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Motivo / Justificación
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Describe brevemente el motivo..."
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !requestedAmount}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySalaryAdvances;
