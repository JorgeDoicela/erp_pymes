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

const INITIAL_ADMIN_FORM = {
  employeeId: '',
  amount: '',
  installments: 1,
  reason: '',
  autoApprove: true,
};
const INITIAL_STATS = {
  total: 0,
  pending: 0,
  approved: 0,
  paid: 0,
  rejected: 0,
  cancelled: 0,
  totalActiveBalance: 0,
  monthlyDeductionsTotal: 0,
};
const fmtCurrency = (val) =>
  Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SalaryAdvancesManagement = ({ user }) => {
  const canMutate = canMutatePayroll(user || getCurrentUser());
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [modals, setModals] = useState({
    create: false,
    approve: false,
    reject: false,
    detail: false,
  });
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState(null);
  const [adminFormData, setAdminFormData] = useState(INITIAL_ADMIN_FORM);

  const setModal = (key, val) => setModals((prev) => ({ ...prev, [key]: val }));
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const calculatedDeduction = useMemo(() => {
    const amt = parseFloat(adminFormData.amount);
    const inst = parseInt(adminFormData.installments, 10);
    return !isNaN(amt) && amt > 0 && !isNaN(inst) && inst > 0 ? amt / inst : 0;
  }, [adminFormData.amount, adminFormData.installments]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        getAdvances({
          page: pagination.page,
          limit: pagination.limit,
          status: activeTab === 'ALL' ? undefined : activeTab,
          search: searchTerm.trim() || undefined,
        }),
        getAdvanceStats(),
      ]);
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
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
    } catch (error) {
      showNotification('error', error.message || 'Error al cargar anticipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEmployees()
      .then((res) => res.success && Array.isArray(res.data) && setEmployees(res.data))
      .catch((err) => console.error('Error al cargar colaboradores:', err));
  }, []);

  useEffect(() => {
    refreshData();
  }, [activeTab, pagination.page]);

  const runMutation = async (fn, successMsg, closeKey) => {
    setActionLoading(true);
    try {
      const res = await fn();
      if (res.success) {
        showNotification('success', res.message || successMsg);
        setModal(closeKey, false);
        setSelectedAdvance(null);
        setRejectionReason('');
        refreshData();
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al procesar anticipo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!adminFormData.employeeId) return showNotification('error', 'Seleccione un colaborador');
    runMutation(
      () =>
        createAdvanceByAdmin({
          ...adminFormData,
          amount: parseFloat(adminFormData.amount),
          installments: parseInt(adminFormData.installments, 10),
        }),
      'Anticipo registrado exitosamente',
      'create'
    );
  };

  return (
    <div className="space-y-4">
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded border text-xs font-medium shadow-md ${
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
                ${fmtCurrency(stats.totalActiveBalance)} USD
              </span>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
                Deducción Mes
              </span>
              <span className="font-semibold text-red-700 tabular-nums">
                −${fmtCurrency(stats.monthlyDeductionsTotal)} USD
              </span>
            </div>
          </div>

          {canMutate ? (
            <button
              onClick={() => {
                setAdminFormData({ ...INITIAL_ADMIN_FORM, employeeId: employees[0]?.id || '' });
                setModal('create', true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded cursor-pointer"
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
          refreshData();
        }}
        onSearchClear={() => {
          setSearchTerm('');
          setPagination((prev) => ({ ...prev, page: 1 }));
          setTimeout(refreshData, 0);
        }}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onOpenApprove={(adv) => {
          setSelectedAdvance(adv);
          setModal('approve', true);
        }}
        onOpenReject={(adv) => {
          setSelectedAdvance(adv);
          setRejectionReason('');
          setModal('reject', true);
        }}
        onOpenDetail={(adv) => {
          setSelectedAdvance(adv);
          setModal('detail', true);
        }}
      />

      <AdvancesAdminModals
        employees={employees}
        createModalOpen={modals.create}
        setCreateModalOpen={(v) => setModal('create', v)}
        adminFormData={adminFormData}
        setAdminFormData={setAdminFormData}
        calculatedDeduction={calculatedDeduction}
        onCreateSubmit={handleCreateSubmit}
        approveModalOpen={modals.approve}
        setApproveModalOpen={(v) => setModal('approve', v)}
        onConfirmApprove={() =>
          selectedAdvance &&
          runMutation(
            () => approveAdvance(selectedAdvance.id),
            'Anticipo aprobado exitosamente',
            'approve'
          )
        }
        rejectModalOpen={modals.reject}
        setRejectModalOpen={(v) => setModal('reject', v)}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onConfirmReject={(e) => {
          e.preventDefault();
          if (selectedAdvance) {
            runMutation(
              () => rejectAdvance(selectedAdvance.id, rejectionReason),
              'Solicitud rechazada',
              'reject'
            );
          }
        }}
        detailModalOpen={modals.detail}
        setDetailModalOpen={(v) => setModal('detail', v)}
        selectedAdvance={selectedAdvance}
        setSelectedAdvance={setSelectedAdvance}
        actionLoading={actionLoading}
      />
    </div>
  );
};

export default SalaryAdvancesManagement;
