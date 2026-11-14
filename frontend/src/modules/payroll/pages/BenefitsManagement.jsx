/**
 * @file BenefitsManagement.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
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

const BenefitsManagement = () => {
  const [benefits, setBenefits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    processed: 0,
    cancelled: 0,
    activeAmountTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [notification, setNotification] = useState(null);
  const [singleFormData, setSingleFormData] = useState(INITIAL_SINGLE);
  const [editFormData, setEditFormData] = useState(INITIAL_SINGLE);
  const [bulkData, setBulkData] = useState(INITIAL_BULK);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadStatsData = async () => {
    try {
      const res = await getBenefitStats();
      if (res.success && res.data) setStats(res.data);
    } catch (error) {
      console.error('Error al cargar estadísticas de beneficios:', error);
    }
  };

  const loadBenefitsData = async () => {
    setLoading(true);
    try {
      const res = await getBenefits({
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab === 'ALL' ? undefined : activeTab,
        type: filterType || undefined,
        search: searchTerm.trim() || undefined,
      });
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
    } catch (error) {
      showNotification('error', error.message || 'Error al cargar beneficios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEmployees()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setEmployees(res.data);
      })
      .catch((error) => console.error('Error al cargar empleados:', error));
  }, []);

  useEffect(() => {
    loadBenefitsData();
    loadStatsData();
  }, [activeTab, filterType, pagination.page]);

  const runMutation = async (fn, successMsg, onSuccessClose) => {
    setActionLoading(true);
    try {
      const res = await fn();
      if (res.success) {
        showNotification('success', res.message || successMsg);
        onSuccessClose();
        loadBenefitsData();
        loadStatsData();
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
      () =>
        createBenefit({
          employeeId: singleFormData.employeeId,
          name: singleFormData.name,
          amount: parseFloat(singleFormData.amount),
          type: singleFormData.type,
          frequency: singleFormData.frequency,
        }),
      'Beneficio registrado exitosamente',
      () => setCreateModalOpen(false)
    );
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedBenefit) return;
    runMutation(
      () =>
        updateBenefit(selectedBenefit.id, {
          name: editFormData.name,
          amount: parseFloat(editFormData.amount),
          type: editFormData.type,
          frequency: editFormData.frequency,
        }),
      'Beneficio actualizado exitosamente',
      () => {
        setEditModalOpen(false);
        setSelectedBenefit(null);
      }
    );
  };

  const handleConfirmDeactivate = () => {
    if (!selectedBenefit) return;
    runMutation(
      () => deactivateBenefit(selectedBenefit.id),
      'Beneficio cancelado exitosamente',
      () => {
        setConfirmModalOpen(false);
        setSelectedBenefit(null);
      }
    );
  };

  const handleBulkSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (bulkData.selectedEmployees.length === 0) {
      return showNotification('error', 'Debe seleccionar al menos un colaborador');
    }
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
      () => setBulkModalOpen(false)
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
                $
                {Number(stats.activeAmountTotal || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                USD
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setSingleFormData({ ...INITIAL_SINGLE, employeeId: employees[0]?.id || '' });
              setCreateModalOpen(true);
            }}
            className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
          >
            + Asignar Individual
          </button>

          <button
            onClick={() => {
              setBulkData({ ...INITIAL_BULK, selectedEmployees: employees.map((e) => e.id) });
              setBulkModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
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
          loadBenefitsData();
        }}
        onSearchClear={() => {
          setSearchTerm('');
          setPagination((prev) => ({ ...prev, page: 1 }));
          setTimeout(loadBenefitsData, 0);
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
          setEditModalOpen(true);
        }}
        onOpenConfirmDeactivate={(b) => {
          setSelectedBenefit(b);
          setConfirmModalOpen(true);
        }}
      />

      <BenefitFormModals
        employees={employees}
        createModalOpen={createModalOpen}
        setCreateModalOpen={setCreateModalOpen}
        singleFormData={singleFormData}
        setSingleFormData={setSingleFormData}
        onSingleCreateSubmit={handleSingleCreateSubmit}
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        onEditSubmit={handleEditSubmit}
        confirmModalOpen={confirmModalOpen}
        setConfirmModalOpen={setConfirmModalOpen}
        onConfirmDeactivate={handleConfirmDeactivate}
        selectedBenefit={selectedBenefit}
        setSelectedBenefit={setSelectedBenefit}
        actionLoading={actionLoading}
      />

      <BulkBenefitModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
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
