/**
 * @file MySalaryAdvances.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { requestAdvance, getMyAdvances, cancelAdvance } from '../services/salaryAdvance.service';
import { HiPlus as PlusIcon, HiInformationCircle as InformationCircleIcon } from 'react-icons/hi2';
import { MyAdvancesTable } from '../components/advances/MyAdvancesTable';
import { RequestAdvanceModal } from '../components/advances/RequestAdvanceModal';

const MySalaryAdvances = () => {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: '', installments: 1, reason: '' });

  useEffect(() => {
    loadMyAdvances();
  }, []);

  const loadMyAdvances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAdvances();
      if (res.success) setAdvances(res.data || []);
    } catch (err) {
      const msg = err.message || 'Error al cargar anticipos';
      setError(msg);
      toast.error(msg);
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
        reason: form.reason,
      });
      if (res.success) {
        toast.success('Solicitud de anticipo enviada exitosamente a RRHH');
        setModalOpen(false);
        setForm({ amount: '', installments: 1, reason: '' });
        loadMyAdvances();
      }
    } catch (err) {
      toast.error(err.message || 'Error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Confirmas la cancelación de esta solicitud de anticipo?')) return;
    try {
      const res = await cancelAdvance(id);
      if (res.success) {
        toast.success('Solicitud de anticipo cancelada');
        loadMyAdvances();
      }
    } catch (err) {
      toast.error(err.message || 'Error al cancelar la solicitud');
    }
  };

  const activeAdvance = advances.find((a) => a.status === 'APPROVED');
  const pendingAdvance = advances.find((a) => a.status === 'PENDING');

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="bg-white p-5 rounded border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Anticipos y Créditos
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Mis Anticipos y Préstamos
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Solicita adelantos de sueldo o préstamos internos con descuento automático en rol de
            pagos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <PlusIcon className="w-4 h-4" />
          Solicitar Anticipo / Préstamo
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded p-4 flex items-start gap-3 text-gray-700 text-xs">
        <InformationCircleIcon className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-gray-900">Política Institucional de Adelantos:</p>
          <p className="mt-0.5 text-gray-500">
            • Los anticipos de 1 cuota se descuentan íntegramente en el rol de pago del mes.
            <br />
            • Los préstamos multicuota (hasta 24 meses) deducen un valor fijo mensual.
            <br />• La cuota mensual no podrá exceder el 50% de la remuneración mensual unificada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
              Solicitud Pendiente
            </p>
            <p className="text-base font-bold text-gray-900 font-mono tabular-nums mt-0.5">
              {pendingAdvance
                ? `$${pendingAdvance.amount.toFixed(2)} (${pendingAdvance.installments} cuotas)`
                : 'Ninguna'}
            </p>
          </div>
          <div className="w-8 h-8 rounded bg-gray-100 text-gray-700 font-mono flex items-center justify-center text-xs font-semibold">
            P
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
              Anticipo / Préstamo Activo
            </p>
            <p className="text-base font-bold text-gray-900 font-mono tabular-nums mt-0.5">
              {activeAdvance
                ? `$${activeAdvance.monthlyDeduction.toFixed(2)} / mes (${activeAdvance.paidInstallments}/${activeAdvance.installments} cuotas)`
                : 'Sin préstamos activos'}
            </p>
          </div>
          <div className="w-8 h-8 rounded bg-gray-100 text-gray-700 font-mono flex items-center justify-center text-xs font-semibold">
            A
          </div>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Historial de Solicitudes
          </h2>
        </div>
        <MyAdvancesTable
          advances={advances}
          loading={loading}
          error={error}
          onRetry={loadMyAdvances}
          onCancel={handleCancel}
        />
      </div>

      <RequestAdvanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        form={form}
        setForm={setForm}
        submitting={submitting}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default MySalaryAdvances;
