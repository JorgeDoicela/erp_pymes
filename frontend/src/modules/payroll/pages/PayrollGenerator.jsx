/**
 * @file PayrollGenerator.jsx
 * @description Orquestador modular del Generador de Nómina Legal y Liquidaciones PyME
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  notifyPendingPayrollSignatures,
} from '@/services/payroll/payrollConfig.service';
import { integratePayroll } from '@/services/accounting.service';
import ExportButtons from '@/components/common/ExportButtons';
import { FiBell } from 'react-icons/fi';

// Subcomponentes Modulares Extraídos (core/ui y modules/payroll)
import { Button } from '@/core/ui/Button.jsx';
import { GeneratePayrollModal } from '@/modules/payroll/components/GeneratePayrollModal.jsx';
import { EditPayrollDetailModal } from '@/modules/payroll/components/EditPayrollDetailModal.jsx';
import { ConfirmActionModal } from '@/modules/payroll/components/ConfirmActionModal.jsx';
import { PayrollDetailsTable } from '@/modules/payroll/components/PayrollDetailsTable.jsx';

const STATUS_MAP = {
  APPROVED: { label: 'Aprobado', cls: 'text-green-800 bg-transparent border-green-300' },
  PAID: { label: 'Pagado', cls: 'text-blue-800 bg-transparent border-blue-300' },
  DRAFT: { label: 'Borrador', cls: 'text-amber-800 bg-transparent border-amber-300' },
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
    year: new Date().getFullYear(),
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    isDestructive: false,
    onConfirm: null,
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
      .then((res) => {
        if (isMounted && res.success) {
          setPayrolls(res.data || []);
        }
      })
      .catch((error) => {
        if (isMounted) toast.error(error.message || 'Error al cargar el historial de nóminas');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
      message:
        '¿Está seguro de aprobar esta nómina? Una vez aprobada, se congelarán los valores de rol, se procesarán los anticipos/beneficios y no se permitirán más modificaciones manuales.',
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
      },
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
      title: 'Registrar Pago de Nómina',
      message:
        '¿Confirmar que la nómina ha sido dispersada bancariamente a todos los colaboradores?',
      confirmText: 'Registrar como Pagada',
      isDestructive: false,
      onConfirm: async () => {
        try {
          const res = await markPayrollAsPaid(selectedPayroll.id);
          if (res.success) {
            toast.success('Nómina marcada como pagada con éxito');
            setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
            await viewDetail(selectedPayroll.id);
            await loadHistory();
          }
        } catch (error) {
          toast.error(error.message || 'Error al actualizar estado');
        }
      },
    });
  };

  const handleDeletePayroll = () => {
    setConfirmDialog({
      open: true,
      title: 'Eliminar Nómina Borrador',
      message:
        '¿Está seguro de eliminar esta nómina en borrador? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar Nómina',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await deletePayroll(selectedPayroll.id);
          if (res.success) {
            toast.success('Nómina eliminada');
            setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
            setSelectedPayroll(null);
            await loadHistory();
          }
        } catch (error) {
          toast.error(error.message || 'Error al eliminar nómina');
        }
      },
    });
  };

  const handleIntegrateAccounting = async () => {
    try {
      toast.loading('Generando asiento contable automático...', { id: 'acct-gen' });
      const res = await integratePayroll(selectedPayroll.id);
      if (res.success) {
        toast.success(res.message || 'Asiento contable integrado exitosamente', { id: 'acct-gen' });
        await viewDetail(selectedPayroll.id);
        await loadHistory();
      }
    } catch (error) {
      toast.error(error.message || 'Error al integrar con contabilidad', { id: 'acct-gen' });
    }
  };

  const handleNotifySignatures = async () => {
    try {
      toast.loading('Notificando a colaboradores con firma pendiente...', { id: 'notify-sig' });
      const res = await notifyPendingPayrollSignatures(selectedPayroll.id);
      if (res.success) {
        toast.success(res.message || 'Notificaciones enviadas correctamente', { id: 'notify-sig' });
      }
    } catch (error) {
      toast.error(error.message || 'Error al enviar recordatorios de firma', { id: 'notify-sig' });
    }
  };

  const handleUpdateDetail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const bonusesArr =
        typeof editingDetail.bonuses === 'string'
          ? JSON.parse(editingDetail.bonuses || '[]')
          : editingDetail.bonuses || [];
      const deductionsArr =
        typeof editingDetail.deductions === 'string'
          ? JSON.parse(editingDetail.deductions || '[]')
          : editingDetail.deductions || [];

      const payload = {
        baseSalary: parseFloat(editingDetail.baseSalary) || 0,
        overtimeAmount: parseFloat(editingDetail.overtimeAmount) || 0,
        bonuses: bonusesArr,
        deductions: deductionsArr,
      };

      const res = await updatePayrollDetail(selectedPayroll.id, editingDetail.id, payload);
      if (res.success) {
        toast.success('Detalle de rol actualizado correctamente');
        setEditModalOpen(false);
        setEditingDetail(null);
        await viewDetail(selectedPayroll.id);
        await loadHistory();
      }
    } catch (error) {
      toast.error(error.message || 'Error al actualizar detalle');
    }
  };

  // Filtrado reactivo de colaboradores
  const filteredDetails = useMemo(() => {
    if (!selectedPayroll?.details) return [];
    if (!searchTerm.trim()) return selectedPayroll.details;
    const term = searchTerm.toLowerCase();
    return selectedPayroll.details.filter(
      (d) =>
        d.employee?.firstName?.toLowerCase().includes(term) ||
        d.employee?.lastName?.toLowerCase().includes(term) ||
        d.employee?.identityCard?.includes(term)
    );
  }, [selectedPayroll, searchTerm]);

  // Totales y estadísticas para barra de estado
  const signatureStats = useMemo(() => {
    if (!selectedPayroll?.details) return { signed: 0, pending: 0, disputed: 0, total: 0 };
    const total = selectedPayroll.details.length;
    let signed = 0;
    let pending = 0;
    let disputed = 0;
    selectedPayroll.details.forEach((d) => {
      if (d.signatureStatus === 'SIGNED') signed++;
      else if (d.signatureStatus === 'DISPUTED') disputed++;
      else pending++;
    });
    return { signed, pending, disputed, total };
  }, [selectedPayroll]);

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Nómina y Liquidaciones
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Cálculo legal bajo Código del Trabajo e IESS (Ecuador) · Aportes 9.45% / 11.15% · Horas
            extra y finiquitos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPayroll && (
            <Button variant="secondary" onClick={() => setSelectedPayroll(null)}>
              ← Historial de Nóminas
            </Button>
          )}
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            + Nueva Nómina
          </Button>
        </div>
      </div>

      {/* VISTA 1: Historial de Nóminas Procesadas */}
      {!selectedPayroll ? (
        <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Historial de Períodos</h2>
              <p className="text-xs text-gray-400">
                Seleccione un período para auditar roles individuales o generar comprobantes
              </p>
            </div>
            <ExportButtons
              data={payrolls}
              columns={[
                { header: 'Período', key: 'period' },
                { header: 'Estado', key: 'status' },
                { header: 'Total Empleados', key: 'totalEmployees' },
                { header: 'Total Nómina ($)', key: 'totalNet' },
                { header: 'Fecha Generación', key: 'createdAt' },
              ]}
              fileName="historial-nominas-norma-erp"
              title="HISTORIAL GENERAL DE NÓMINAS"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-gray-700">
              <thead className="bg-gray-50/60 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2.5 px-4">Período</th>
                  <th className="py-2.5 px-4 text-center">Estado</th>
                  <th className="py-2.5 px-4 text-center">Colaboradores</th>
                  <th className="py-2.5 px-4 text-right">Total Neto</th>
                  <th className="py-2.5 px-4 text-center">Contabilidad</th>
                  <th className="py-2.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-400 text-xs">
                      Cargando historial de nóminas...
                    </td>
                  </tr>
                ) : payrolls.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-400 text-xs">
                      No se han procesado nóminas en esta empresa. Presione "+ Nueva Nómina" para
                      iniciar.
                    </td>
                  </tr>
                ) : (
                  payrolls.map((p) => {
                    const st = STATUS_MAP[p.status] || STATUS_MAP.DRAFT;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-gray-900">
                          {p.period}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono tabular-nums">
                          {p.totalEmployees || 0}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                          ${Number(p.totalNet || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {p.journalEntryId ? (
                            <span className="text-blue-700 font-mono text-[11px] font-medium">
                              Asiento #{p.journalEntryId.substring(0, 8)}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">Pendiente</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Button variant="table" onClick={() => viewDetail(p.id)}>
                            Ver Detalle
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA 2: Detalle Operativo de Nómina Seleccionada */
        <div className="space-y-4">
          {/* Barra de Control de Nómina */}
          <div className="bg-white border border-gray-200 rounded-[4px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900">
                  Nómina: {selectedPayroll.period}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    STATUS_MAP[selectedPayroll.status]?.cls
                  }`}
                >
                  {STATUS_MAP[selectedPayroll.status]?.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-mono tabular-nums">
                {selectedPayroll.totalEmployees} empleados · Total Neto: $
                {Number(selectedPayroll.totalNet || 0).toFixed(2)} · Aporte Patronal IESS: $
                {Number(selectedPayroll.totalEmployerIess || 0).toFixed(2)}
              </p>
            </div>

            {/* Acciones de Flujo de Nómina */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedPayroll.status === 'DRAFT' && (
                <>
                  <Button variant="destructive" onClick={handleDeletePayroll}>
                    Eliminar
                  </Button>
                  <Button variant="primary" onClick={handleConfirmPayroll}>
                    Aprobar Nómina
                  </Button>
                </>
              )}

              {selectedPayroll.status === 'APPROVED' && (
                <>
                  <Button variant="secondary" onClick={handleDownloadBankFile}>
                    Descargar Archivo Banco
                  </Button>
                  {!selectedPayroll.journalEntryId && (
                    <Button variant="secondary" onClick={handleIntegrateAccounting}>
                      Integrar Contabilidad
                    </Button>
                  )}
                  <Button variant="primary" onClick={handleMarkAsPaid}>
                    Registrar Pago
                  </Button>
                </>
              )}

              {selectedPayroll.status === 'PAID' && (
                <>
                  <Button variant="secondary" onClick={handleDownloadBankFile}>
                    Descargar Archivo Banco
                  </Button>
                  {!selectedPayroll.journalEntryId && (
                    <Button variant="secondary" onClick={handleIntegrateAccounting}>
                      Integrar Contabilidad
                    </Button>
                  )}
                  {signatureStats.pending > 0 && (
                    <Button variant="secondary" icon={FiBell} onClick={handleNotifySignatures}>
                      Notificar Firmas ({signatureStats.pending})
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Tabla de Colaboradores con Buscador */}
          <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
            <div className="p-3.5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-72 bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-gray-400 font-mono tabular-nums">
                Mostrando {filteredDetails.length} de {selectedPayroll.details?.length || 0}{' '}
                colaboradores
              </span>
            </div>

            <PayrollDetailsTable
              payroll={selectedPayroll}
              details={filteredDetails}
              onEditDetail={(det) => {
                setEditingDetail({ ...det });
                setEditModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Modales Modulares */}
      <GeneratePayrollModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleGenerate}
        params={genParams}
        setParams={setGenParams}
        generating={generating}
      />

      <EditPayrollDetailModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editingDetail={editingDetail}
        setEditingDetail={setEditingDetail}
        onSubmit={handleUpdateDetail}
      />

      <ConfirmActionModal
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
      />
    </div>
  );
};

export default PayrollGenerator;
