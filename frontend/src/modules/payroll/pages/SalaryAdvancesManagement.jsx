/**
 * @file SalaryAdvancesManagement.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useMemo } from 'react';
import { getEmployees } from '@modules/employees';
import {
  getAdvances,
  getAdvanceStats,
  approveAdvance,
  rejectAdvance,
  createAdvanceByAdmin,
} from '../services/salaryAdvance.service';
import { canMutatePayroll, getCurrentUser } from '@core/constants/roles';
import AdvancesManagementTable from '../components/advances/AdvancesManagementTable';
import AdvancesAdminModals from '../components/advances/AdvancesAdminModals';

const SalaryAdvancesManagement = ({ user }) => {
  const currentUser = user || getCurrentUser();
  const canMutate = canMutatePayroll(currentUser);

  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
    cancelled: 0,
    totalActiveBalance: 0,
    monthlyDeductionsTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState(null);

  const [adminFormData, setAdminFormData] = useState({
    employeeId: '',
    amount: '',
    installments: 1,
    reason: '',
    autoApprove: true,
  });

  const calculatedDeduction = useMemo(() => {
    const amt = parseFloat(adminFormData.amount);
    const inst = parseInt(adminFormData.installments, 10);
    if (!isNaN(amt) && amt > 0 && !isNaN(inst) && inst > 0) {
      return amt / inst;
    }
    return 0;
  }, [adminFormData.amount, adminFormData.installments]);

  useEffect(() => {
    getEmployees()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setEmployees(res.data);
      })
      .catch((error) => console.error('Error al cargar colaboradores:', error));
  }, []);

  useEffect(() => {
    loadAdvancesData();
    loadStatsData();
  }, [activeTab, pagination.page]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadStatsData = async () => {
    try {
      const res = await getAdvanceStats();
      if (res.success && res.data) setStats(res.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const loadAdvancesData = async () => {
    setLoading(true);
    try {
      const res = await getAdvances({
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab === 'ALL' ? undefined : activeTab,
        search: searchTerm.trim() || undefined,
      });
      if (res.success) {
        setAdvances(res.data || []);
        if (res.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.pagination.total || 0,
            totalPages: res.pagination.totalPages || 1,
          }));
        }
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al cargar anticipos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setAdminFormData({
      employeeId: employees[0]?.id || '',
      amount: '',
      installments: 1,
      reason: '',
      autoApprove: true,
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!adminFormData.employeeId) {
      showNotification('error', 'Seleccione un colaborador');
      return;
    }
    setActionLoading(true);
    try {
      const res = await createAdvanceByAdmin({
        employeeId: adminFormData.employeeId,
        amount: parseFloat(adminFormData.amount),
        installments: parseInt(adminFormData.installments, 10),
        reason: adminFormData.reason,
        autoApprove: adminFormData.autoApprove,
      });
      if (res.success) {
        showNotification('success', res.message || 'Anticipo registrado exitosamente');
        setCreateModalOpen(false);
        loadAdvancesData();
        loadStatsData();
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al conceder anticipo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!selectedAdvance) return;
    setActionLoading(true);
    try {
      const res = await approveAdvance(selectedAdvance.id);
      if (res.success) {
        showNotification('success', 'Anticipo aprobado exitosamente');
        setApproveModalOpen(false);
        setSelectedAdvance(null);
        loadAdvancesData();
        loadStatsData();
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al aprobar anticipo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedAdvance) return;
    setActionLoading(true);
    try {
      const res = await rejectAdvance(selectedAdvance.id, rejectionReason);
      if (res.success) {
        showNotification('success', 'Solicitud rechazada');
        setRejectModalOpen(false);
        setSelectedAdvance(null);
        setRejectionReason('');
        loadAdvancesData();
        loadStatsData();
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al rechazar anticipo');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded border text-xs font-medium shadow-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
            Nómina · Anticipos y Préstamos
          </p>
          <h1 className="text-xl font-semibold text-gray-900">Gestión de Anticipos y Préstamos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Control de solicitudes, aprobaciones y cuotas amortizadas en el rol de pagos.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
                Saldo Activo Cartera
              </span>
              <span className="font-semibold text-gray-900 tabular-nums">
                $
                {Number(stats.totalActiveBalance || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                USD
              </span>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
                Deducción Mes
              </span>
              <span className="font-semibold text-red-700 tabular-nums">
                −$
                {Number(stats.monthlyDeductionsTotal || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                USD
              </span>
            </div>
          </div>

          {canMutate ? (
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
            >
              + Conceder Anticipo
            </button>
          ) : (
            <span className="text-xs text-gray-500 font-mono border border-gray-200 px-3 py-1.5 rounded bg-gray-50">
              Solo Lectura / Auditoría
            </span>
          )}
        </div>
      </div>

      <AdvancesManagementTable
        advances={advances}
        stats={stats}
        loading={loading}
        activeTab={activeTab}
        searchTerm={searchTerm}
        pagination={pagination}
        canMutate={canMutate}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        onSearchChange={setSearchTerm}
        onSearchSubmit={(e) => {
          e.preventDefault();
          setPagination((prev) => ({ ...prev, page: 1 }));
          loadAdvancesData();
        }}
        onSearchClear={() => {
          setSearchTerm('');
          setPagination((prev) => ({ ...prev, page: 1 }));
          setTimeout(loadAdvancesData, 0);
        }}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onOpenApprove={(adv) => {
          setSelectedAdvance(adv);
          setApproveModalOpen(true);
        }}
        onOpenReject={(adv) => {
          setSelectedAdvance(adv);
          setRejectionReason('');
          setRejectModalOpen(true);
        }}
        onOpenDetail={(adv) => {
          setSelectedAdvance(adv);
          setDetailModalOpen(true);
        }}
      />

      <AdvancesAdminModals
        employees={employees}
        createModalOpen={createModalOpen}
        setCreateModalOpen={setCreateModalOpen}
        adminFormData={adminFormData}
        setAdminFormData={setAdminFormData}
        calculatedDeduction={calculatedDeduction}
        onCreateSubmit={handleCreateSubmit}
        approveModalOpen={approveModalOpen}
        setApproveModalOpen={setApproveModalOpen}
        onConfirmApprove={handleConfirmApprove}
        rejectModalOpen={rejectModalOpen}
        setRejectModalOpen={setRejectModalOpen}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onConfirmReject={handleConfirmReject}
        detailModalOpen={detailModalOpen}
        setDetailModalOpen={setDetailModalOpen}
        selectedAdvance={selectedAdvance}
        setSelectedAdvance={setSelectedAdvance}
        actionLoading={actionLoading}
      />
    </div>
  );
};

export default SalaryAdvancesManagement;
