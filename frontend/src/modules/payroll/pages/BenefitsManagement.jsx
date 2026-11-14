/**
 * @file BenefitsManagement.jsx
 * @description Gestión administrativa de beneficios, bonos e incentivos.
 */

import { useState, useEffect, useMemo } from 'react';
import { getEmployees } from '@modules/employees';
import {
  getBenefits,
  getBenefitStats,
  createBenefit,
  updateBenefit,
  deactivateBenefit,
  bulkCreateBenefit,
} from '../services/benefits.service';
import BenefitsTable from '../components/benefits/BenefitsTable';
import BenefitFormModals from '../components/benefits/BenefitFormModals';
import BulkBenefitModal from '../components/benefits/BulkBenefitModal';

const INITIAL_SINGLE = {
  employeeId: '',
  name: '',
  amount: '',
  type: 'BONUS',
  frequency: 'ONE_TIME',
};
const INITIAL_BULK = {
  name: '',
  amount: '',
  type: 'BONUS',
  frequency: 'ONE_TIME',
  isSpecial: false,
  specialType: '',
  selectedDepartment: 'ALL',
  selectedEmployees: [],
};
const INITIAL_STATS = {
  total: 0,
  active: 0,
  processed: 0,
  cancelled: 0,
  activeAmountTotal: 0,
};

const BenefitsManagement = () => {
  const [benefits, setBenefits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [modals, setModals] = useState({ create: false, edit: false, bulk: false, confirm: false });
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [notification, setNotification] = useState(null);
  const [singleFormData, setSingleFormData] = useState(INITIAL_SINGLE);
  const [editFormData, setEditFormData] = useState(INITIAL_SINGLE);
  const [bulkData, setBulkData] = useState(INITIAL_BULK);

  const setModal = (key, val) => setModals((prev) => ({ ...prev, [key]: val }));
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        getBenefits({
          page: pagination.page,
          limit: pagination.limit,
          status: activeTab === 'ALL' ? undefined : activeTab,
          type: filterType || undefined,
          search: searchTerm.trim() || undefined,
        }),
        getBenefitStats(),
      ]);
      if (res.success) {
        setBenefits(res.data || []);
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
      showNotification('error', error.message || 'Error al cargar beneficios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEmployees()
      .then((res) => res.success && Array.isArray(res.data) && setEmployees(res.data))
      .catch((err) => console.error('Error al cargar empleados:', err));
  }, []);

  useEffect(() => {
    refreshData();
  }, [activeTab, filterType, pagination.page]);

  const runMutation = async (fn, successMsg, closeKey) => {
    setActionLoading(true);
    try {
      const res = await fn();
      if (res.success) {
        showNotification('success', res.message || successMsg);
        setModal(closeKey, false);
        setSelectedBenefit(null);
        refreshData();
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al procesar beneficio');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleCreateSubmit = (e) => {
    e.preventDefault();
    if (!singleFormData.employeeId)
      return showNotification('error', 'Debe seleccionar un colaborador');
    runMutation(
      () => createBenefit({ ...singleFormData, amount: parseFloat(singleFormData.amount) }),
      'Beneficio registrado exitosamente',
      'create'
    );
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedBenefit) return;
    runMutation(
      () =>
        updateBenefit(selectedBenefit.id, {
          ...editFormData,
          amount: parseFloat(editFormData.amount),
        }),
      'Beneficio actualizado exitosamente',
      'edit'
    );
  };

  const handleBulkSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (bulkData.selectedEmployees.length === 0)
      return showNotification('error', 'Debe seleccionar al menos un colaborador');
    runMutation(
      () =>
        bulkCreateBenefit({
          employeeIds: bulkData.selectedEmployees,
          name: bulkData.name,
          amount: bulkData.isSpecial ? 0 : parseFloat(bulkData.amount),
          type: bulkData.type,
          frequency: bulkData.frequency || 'ONE_TIME',
          isSpecialCalculation: bulkData.isSpecial ? bulkData.specialType : null,
        }),
      'Asignación masiva completada',
      'bulk'
    );
  };

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(),
    [employees]
  );

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
            Nómina · Beneficios e Incentivos
          </p>
          <h1 className="text-xl font-semibold text-gray-900">
            Gestión de Beneficios e Incentivos
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Administre bonos, viáticos y beneficios legales para su integración al rol de pagos.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
                Pendiente a Nómina
              </span>
              <span className="font-semibold text-gray-900 tabular-nums">
                ${Number(stats.activeAmountTotal || 0).toFixed(2)} USD
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setSingleFormData({ ...INITIAL_SINGLE, employeeId: employees[0]?.id || '' });
              setModal('create', true);
            }}
            className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded cursor-pointer"
          >
            + Asignar Individual
          </button>
          <button
            onClick={() => {
              setBulkData({ ...INITIAL_BULK, selectedEmployees: employees.map((e) => e.id) });
              setModal('bulk', true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded cursor-pointer"
          >
            + Asignación Masiva
          </button>
        </div>
      </div>

      <BenefitsTable
        benefits={benefits}
        stats={stats}
        loading={loading}
        activeTab={activeTab}
        searchTerm={searchTerm}
        filterType={filterType}
        pagination={pagination}
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
        onFilterTypeChange={(val) => {
          setFilterType(val);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onOpenEdit={(b) => {
          setSelectedBenefit(b);
          setEditFormData({
            name: b.name,
            amount: b.amount.toString(),
            type: b.type,
            frequency: b.frequency,
          });
          setModal('edit', true);
        }}
        onOpenConfirmDeactivate={(b) => {
          setSelectedBenefit(b);
          setModal('confirm', true);
        }}
      />

      <BenefitFormModals
        employees={employees}
        createModalOpen={modals.create}
        setCreateModalOpen={(v) => setModal('create', v)}
        singleFormData={singleFormData}
        setSingleFormData={setSingleFormData}
        onSingleCreateSubmit={handleSingleCreateSubmit}
        editModalOpen={modals.edit}
        setEditModalOpen={(v) => setModal('edit', v)}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        onEditSubmit={handleEditSubmit}
        confirmModalOpen={modals.confirm}
        setConfirmModalOpen={(v) => setModal('confirm', v)}
        onConfirmDeactivate={() =>
          selectedBenefit &&
          runMutation(() => deactivateBenefit(selectedBenefit.id), 'Beneficio cancelado', 'confirm')
        }
        selectedBenefit={selectedBenefit}
        setSelectedBenefit={setSelectedBenefit}
        actionLoading={actionLoading}
      />

      <BulkBenefitModal
        isOpen={modals.bulk}
        onClose={() => setModal('bulk', false)}
        onSubmit={handleBulkSubmit}
        bulkData={bulkData}
        setBulkData={setBulkData}
        employees={employees}
        departments={departments}
        loading={actionLoading}
      />
    </div>
  );
};

export default BenefitsManagement;
