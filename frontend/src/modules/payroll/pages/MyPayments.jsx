/**
 * @file MyPayments.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getMyPayrolls,
  signPayslipDetail,
  disputePayslipDetail,
} from '../services/payrollConfig.service';
import { generatePayslipPDF } from '../utils/generatePayslipPDF';
import { FiFileText, FiEye, FiAlertCircle, FiCheck } from 'react-icons/fi';
import {
  PayslipBreakdownModal,
  PayslipDisputeModal,
  PayslipSignModal,
} from '../components/payments/PayslipDetailModals';

const STATUS_SIGNATURE_MAP = {
  SIGNED: { label: 'Firmado de Conformidad', badge: 'text-emerald-700 font-medium' },
  PENDING: { label: 'Pendiente de Firma', badge: 'text-amber-700 font-medium' },
  DISPUTED: { label: 'Observación Registrada', badge: 'text-red-700 font-medium' },
};

const MyPayments = ({ user }) => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyPayrolls();
      if (res.success) setPayrolls(res.data || []);
    } catch (err) {
      const msg = err.message || 'Error al cargar los recibos de pago';
      setError(msg);
      toast.error(msg);
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
        notes: 'Aceptación y conformidad de rol de pagos mensual',
      });
      if (res.success) {
        toast.success('Rol de pagos firmado exitosamente');
        setSignModalOpen(false);
        loadData();
      } else {
        toast.error(res.message || 'No se pudo firmar');
      }
    } catch (err) {
      toast.error(err.message || 'Error al firmar');
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
    } catch (err) {
      toast.error(err.message || 'Error al procesar');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Mis Roles de Pago</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Consulta tus recibos de nómina mensuales, firma de conformidad o registra observaciones.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-500 text-xs font-mono">
          Cargando tus recibos de pago...
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded border border-gray-200 text-center space-y-2">
          <p className="text-xs text-red-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="bg-white p-12 rounded border border-gray-200 text-center text-gray-400 text-xs">
          <FiFileText size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="font-semibold text-gray-700">Sin roles de pago disponibles</p>
          <p className="text-gray-400 mt-0.5">
            Aún no se han emitido nóminas aprobadas para tu usuario.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payrolls.map((detail) => {
            const periodDate = new Date(detail.payroll?.period);
            const periodName = periodDate.toLocaleDateString('es-EC', {
              month: 'long',
              year: 'numeric',
            });
            const deductionsList = (() => {
              try {
                return JSON.parse(detail.deductions) || [];
              } catch {
                return [];
              }
            })();
            const deductionsSum = deductionsList.reduce((a, b) => a + (b.amount || 0), 0);
            const grossSum = detail.netSalary + deductionsSum;
            const sigStatus = detail.signatureStatus || 'PENDING';
            const sigConfig = STATUS_SIGNATURE_MAP[sigStatus] || STATUS_SIGNATURE_MAP.PENDING;

            return (
              <div
                key={detail.id}
                className="bg-white p-4 rounded border border-gray-200 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start pb-3 border-b border-gray-100 mb-3">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block font-sans">
                        Período Fiscal
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 capitalize">{periodName}</h3>
                    </div>
                    <span className={`text-xs font-medium ${sigConfig.badge}`}>
                      {sigConfig.label}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ingresos Brutos:</span>
                      <span className="font-mono tabular-nums text-gray-800">
                        ${grossSum.toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Descuentos y Retenciones:</span>
                      <span className="font-mono tabular-nums text-rose-700">
                        -${deductionsSum.toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold">
                      <span className="text-gray-900">Líquido a Recibir:</span>
                      <span className="font-mono tabular-nums text-emerald-800 font-bold">
                        ${detail.netSalary.toFixed(2)} USD
                      </span>
                    </div>

                    {sigStatus === 'SIGNED' && detail.signedAt && (
                      <div className="pt-2 text-[11px] text-gray-400 font-mono tabular-nums">
                        Firmado el {new Date(detail.signedAt).toLocaleDateString('es-EC')} (Código:{' '}
                        {detail.signatureCode || 'SIG-EC'})
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
                  {sigStatus === 'PENDING' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDetail(detail);
                          setSignModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-2.5 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FiCheck size={13} />
                        <span>Aprobar / Firmar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDetail(detail);
                          setDisputeModalOpen(true);
                        }}
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
                      onClick={() =>
                        generatePayslipPDF(detail, detail.employee || user, detail.payroll?.period)
                      }
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

      <PayslipBreakdownModal
        selectedPayroll={selectedPayroll}
        onClose={() => setSelectedPayroll(null)}
        user={user}
      />
      <PayslipSignModal
        isOpen={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        activeDetail={activeDetail}
        signing={signing}
        onSign={handleSign}
      />
      <PayslipDisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        activeDetail={activeDetail}
        disputeReason={disputeReason}
        setDisputeReason={setDisputeReason}
        signing={signing}
        onDispute={handleDispute}
      />
    </div>
  );
};

export default MyPayments;
