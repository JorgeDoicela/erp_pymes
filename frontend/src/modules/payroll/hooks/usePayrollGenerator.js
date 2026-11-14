/**
 * @file usePayrollGenerator.js
 * @description Hook de estado y acciones para el generador y flujo de vida de Nómina.
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

const INITIAL_CONFIRM = {
  open: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  isDestructive: false,
  onConfirm: null,
};

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
  const [confirmDialog, setConfirmDialog] = useState(INITIAL_CONFIRM);

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
    const details = selectedPayroll?.details || [];
    if (!searchTerm.trim()) return details;
    const term = searchTerm.toLowerCase();
    return details.filter(
      (d) =>
        d.employee?.firstName?.toLowerCase().includes(term) ||
        d.employee?.lastName?.toLowerCase().includes(term) ||
        d.employee?.identityCard?.includes(term)
    );
  }, [selectedPayroll, searchTerm]);

  const signatureStats = useMemo(() => {
    const details = selectedPayroll?.details || [];
    const signed = details.filter((d) => d.signatureStatus === 'SIGNED').length;
    const disputed = details.filter((d) => d.signatureStatus === 'DISPUTED').length;
    return { signed, pending: details.length - signed - disputed, disputed, total: details.length };
  }, [selectedPayroll]);

  const dialogCtx = {
    selectedPayroll,
    setConfirmDialog,
    setSelectedPayroll,
    viewDetail,
    loadHistory,
  };

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
    handleConfirmPayroll: () => setConfirmDialog(buildConfirmPayrollDialog(dialogCtx)),
    handleDownloadBankFile: () => executeBankFileDownload(selectedPayroll.id),
    handleMarkAsPaid: () => setConfirmDialog(buildMarkPaidDialog(dialogCtx)),
    handleDeletePayroll: () => setConfirmDialog(buildDeletePayrollDialog(dialogCtx)),
    handleIntegrateAccounting: () =>
      executeAccountingIntegration({ payrollId: selectedPayroll.id, viewDetail, loadHistory }),
    handleNotifySignatures: () => executeNotifySignatures(selectedPayroll.id),
    handleUpdateDetail: (e) => {
      if (e?.preventDefault) e.preventDefault();
      return executeUpdateDetail({
        ...dialogCtx,
        editingDetail,
        setEditModalOpen,
        setEditingDetail,
      });
    },
  };
};
