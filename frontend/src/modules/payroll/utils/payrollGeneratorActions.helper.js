/**
 * @file payrollGeneratorActions.helper.js
 * @description Helpers de acciones asíncronas y diálogos de confirmación para el Generador de Nómina.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import toast from 'react-hot-toast';
import {
  confirmPayroll,
  downloadBankFile,
  markPayrollAsPaid,
  deletePayroll,
  updatePayrollDetail,
  notifyPendingPayrollSignatures,
} from '../services/payrollConfig.service';
import { integratePayroll } from '@modules/accounting';

export const buildConfirmPayrollDialog = ({
  selectedPayroll,
  setConfirmDialog,
  viewDetail,
  loadHistory,
}) => ({
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
    } catch (err) {
      toast.error(err.message || 'Error al aprobar nómina');
    }
  },
});

export const buildMarkPaidDialog = ({
  selectedPayroll,
  setConfirmDialog,
  viewDetail,
  loadHistory,
}) => ({
  open: true,
  title: 'Registrar Pago de Nómina',
  message: '¿Confirmar que la nómina ha sido dispersada bancariamente a todos los colaboradores?',
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
    } catch (err) {
      toast.error(err.message || 'Error al actualizar estado');
    }
  },
});

export const buildDeletePayrollDialog = ({
  selectedPayroll,
  setConfirmDialog,
  setSelectedPayroll,
  loadHistory,
}) => ({
  open: true,
  title: 'Eliminar Nómina Borrador',
  message: '¿Está seguro de eliminar esta nómina en borrador? Esta acción no se puede deshacer.',
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
    } catch (err) {
      toast.error(err.message || 'Error al eliminar nómina');
    }
  },
});

export const executeBankFileDownload = async (payrollId) => {
  try {
    toast.loading('Generando archivo bancario...', { id: 'bank-download' });
    await downloadBankFile(payrollId);
    toast.success('Archivo bancario descargado correctamente', { id: 'bank-download' });
  } catch (err) {
    toast.error(err.message || 'Error al generar archivo bancario', { id: 'bank-download' });
  }
};

export const executeAccountingIntegration = async ({ payrollId, viewDetail, loadHistory }) => {
  try {
    toast.loading('Generando asiento contable automático...', { id: 'acct-gen' });
    const res = await integratePayroll(payrollId);
    if (res.success) {
      toast.success(res.message || 'Asiento contable integrado exitosamente', { id: 'acct-gen' });
      await viewDetail(payrollId);
      await loadHistory();
    }
  } catch (err) {
    toast.error(err.message || 'Error al integrar con contabilidad', { id: 'acct-gen' });
  }
};

export const executeNotifySignatures = async (payrollId) => {
  try {
    toast.loading('Notificando a colaboradores con firma pendiente...', { id: 'notify-sig' });
    const res = await notifyPendingPayrollSignatures(payrollId);
    if (res.success) {
      toast.success(res.message || 'Notificaciones enviadas correctamente', { id: 'notify-sig' });
    }
  } catch (err) {
    toast.error(err.message || 'Error al enviar recordatorios de firma', { id: 'notify-sig' });
  }
};

export const executeUpdateDetail = async ({
  selectedPayroll,
  editingDetail,
  setEditModalOpen,
  setEditingDetail,
  viewDetail,
  loadHistory,
}) => {
  try {
    const bonuses =
      typeof editingDetail.bonuses === 'string'
        ? JSON.parse(editingDetail.bonuses || '[]')
        : editingDetail.bonuses || [];
    const deductions =
      typeof editingDetail.deductions === 'string'
        ? JSON.parse(editingDetail.deductions || '[]')
        : editingDetail.deductions || [];

    const res = await updatePayrollDetail(selectedPayroll.id, editingDetail.id, {
      baseSalary: parseFloat(editingDetail.baseSalary) || 0,
      overtimeAmount: parseFloat(editingDetail.overtimeAmount) || 0,
      bonuses,
      deductions,
    });
    if (res.success) {
      toast.success('Detalle de rol actualizado correctamente');
      setEditModalOpen(false);
      setEditingDetail(null);
      await viewDetail(selectedPayroll.id);
      await loadHistory();
    }
  } catch (err) {
    toast.error(err.message || 'Error al actualizar detalle');
  }
};
