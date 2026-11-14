/**
 * @file usePayrollGenerator.js
 * @description Hook de estado y acciones para el generador y flujo de vida de Nómina.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { generatePayroll, getPayrolls, getPayrollById } from '../services/payrollConfig.service';
import {
  buildConfirmPayrollDialog,
  buildDeletePayrollDialog,
  buildMarkPaidDialog,
  executeAccountingIntegration,
  executeBankFileDownload,
  executeNotifySignatures,
  executeUpdateDetail,
} from '../utils/payrollGeneratorActions.helper';

export const usePayrollGenerator = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    setError(null);
    try {
      const res = await getPayrolls();
      if (res.success) setPayrolls(res.data || []);
    } catch (err) {
      const msg = err.message || 'Error al cargar el historial de nóminas';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadHistory();
  }, []);

  const viewDetail = async (id) => {
    setLoading(true);
    try {
      const res = await getPayrollById(id);
      if (res.success && res.data) {
        setSelectedPayroll(res.data);
        setSearchTerm('');
      }
    } catch (err) {
      toast.error(err.message || 'Error al cargar detalle de nómina');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setGenerating(true);
    try {
      const res = await generatePayroll(genParams.month, genParams.year);
      if (res.success && res.data) {
        toast.success(`Nómina borrador generada para ${genParams.month}/${genParams.year}`);
        setModalOpen(false);
        await loadHistory();
        await viewDetail(res.data.id);
      }
    } catch (err) {
      toast.error(err.message || 'Error al generar nómina');
    } finally {
      setGenerating(false);
    }
  };

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

  const signatureStats = useMemo(() => {
    if (!selectedPayroll?.details) return { signed: 0, pending: 0, disputed: 0, total: 0 };
    let signed = 0;
    let pending = 0;
    let disputed = 0;
    selectedPayroll.details.forEach((d) => {
      if (d.signatureStatus === 'SIGNED') signed++;
      else if (d.signatureStatus === 'DISPUTED') disputed++;
      else pending++;
    });
    return { signed, pending, disputed, total: selectedPayroll.details.length };
  }, [selectedPayroll]);

  return {
    payrolls,
    loading,
    error,
    generating,
    selectedPayroll,
    setSelectedPayroll,
    searchTerm,
    setSearchTerm,
    modalOpen,
    setModalOpen,
    genParams,
    setGenParams,
    editModalOpen,
    setEditModalOpen,
    editingDetail,
    setEditingDetail,
    confirmDialog,
    setConfirmDialog,
    filteredDetails,
    signatureStats,
    loadHistory,
    viewDetail,
    handleGenerate,
    handleConfirmPayroll: () =>
      setConfirmDialog(
        buildConfirmPayrollDialog({ selectedPayroll, setConfirmDialog, viewDetail, loadHistory })
      ),
    handleDownloadBankFile: () => executeBankFileDownload(selectedPayroll.id),
    handleMarkAsPaid: () =>
      setConfirmDialog(
        buildMarkPaidDialog({ selectedPayroll, setConfirmDialog, viewDetail, loadHistory })
      ),
    handleDeletePayroll: () =>
      setConfirmDialog(
        buildDeletePayrollDialog({
          selectedPayroll,
          setConfirmDialog,
          setSelectedPayroll,
          loadHistory,
        })
      ),
    handleIntegrateAccounting: () =>
      executeAccountingIntegration({ payrollId: selectedPayroll.id, viewDetail, loadHistory }),
    handleNotifySignatures: () => executeNotifySignatures(selectedPayroll.id),
    handleUpdateDetail: (e) => {
      if (e?.preventDefault) e.preventDefault();
      return executeUpdateDetail({
        selectedPayroll,
        editingDetail,
        setEditModalOpen,
        setEditingDetail,
        viewDetail,
        loadHistory,
      });
    },
  };
};
