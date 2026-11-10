/**
 * @file EmployeeAssetsManagement.jsx
 * @description Gestión de Dotación de Activos, Herramientas, Cómputo y EPPs con actas de custodia.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getAllAssets,
  deliverAsset,
  updateAsset,
  returnAsset,
  deleteAsset,
} from '@/services/employees/onboardingOffboarding.service';
import { getEmployees } from '@/services/employees/employee.service';
import { FiSearch, FiPlus, FiRefreshCw } from 'react-icons/fi';

// Componentes modulares desacoplados de employees/assets
import AssetsTable from '@/modules/employees/components/assets/AssetsTable';
import DeliverAssetModal from '@/modules/employees/components/assets/DeliverAssetModal';
import EditAssetModal from '@/modules/employees/components/assets/EditAssetModal';
import ReturnAssetModal from '@/modules/employees/components/assets/ReturnAssetModal';
import AssetActaModal from '@/modules/employees/components/assets/AssetActaModal';

export default function EmployeeAssetsManagement() {
  const [assets, setAssets] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    deliveredCount: 0,
    returnedCount: 0,
    lostDamagedCount: 0,
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [actaModalOpen, setActaModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Formulario de Entrega
  const [deliverForm, setDeliverForm] = useState({
    employeeId: '',
    name: '',
    serialNumber: '',
    category: 'EQUIPMENT',
    condition: 'NEW',
    deliveryDate: new Date().toISOString().split('T')[0],
  });

  // Formulario de Edición
  const [editForm, setEditForm] = useState({
    name: '',
    serialNumber: '',
    category: 'EQUIPMENT',
    condition: 'GOOD',
    deliveryDate: '',
  });

  // Formulario de Devolución
  const [returnForm, setReturnForm] = useState({
    condition: 'GOOD',
    status: 'RETURNED',
    returnNotes: '',
    returnDate: new Date().toISOString().split('T')[0],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resAssets, resEmployees] = await Promise.all([getAllAssets(), getEmployees()]);

      if (resAssets.success) {
        setAssets(resAssets.data || []);
        if (resAssets.counts) {
          setCounts(resAssets.counts);
        } else {
          const data = resAssets.data || [];
          setCounts({
            total: data.length,
            deliveredCount: data.filter((a) => a.status === 'DELIVERED').length,
            returnedCount: data.filter((a) => a.status === 'RETURNED').length,
            lostDamagedCount: data.filter((a) => a.status === 'LOST_DAMAGED').length,
          });
        }
      }

      if (resEmployees) {
        setEmployees(Array.isArray(resEmployees) ? resEmployees : resEmployees.data || []);
      }
    } catch (error) {
      console.error('Error al cargar activos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeliverSubmit = async (e) => {
    e.preventDefault();
    if (!deliverForm.employeeId || !deliverForm.name.trim()) {
      alert('Por favor selecciona un colaborador y escribe el nombre del activo o EPP.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await deliverAsset(deliverForm);
      if (res.success) {
        setDeliverModalOpen(false);
        setDeliverForm({
          employeeId: '',
          name: '',
          serialNumber: '',
          category: 'EQUIPMENT',
          condition: 'NEW',
          deliveryDate: new Date().toISOString().split('T')[0],
        });
        loadData();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setActionLoading(true);
    try {
      const res = await updateAsset(selectedAsset.id, editForm);
      if (res.success) {
        setEditModalOpen(false);
        setSelectedAsset(null);
        loadData();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setActionLoading(true);
    try {
      const res = await returnAsset(selectedAsset.id, returnForm);
      if (res.success) {
        setReturnModalOpen(false);
        setSelectedAsset(null);
        loadData();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('¿Confirmas que deseas eliminar este registro de activo?')) return;
    setActionLoading(true);
    try {
      const res = await deleteAsset(assetId);
      if (res.success) {
        loadData();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (asset) => {
    setSelectedAsset(asset);
    setEditForm({
      name: asset.name,
      serialNumber: asset.serialNumber || '',
      category: asset.category,
      condition: asset.condition,
      deliveryDate: asset.deliveryDate ? asset.deliveryDate.split('T')[0] : '',
    });
    setEditModalOpen(true);
  };

  const openReturnModal = (asset) => {
    setSelectedAsset(asset);
    setReturnForm({
      condition: asset.condition || 'GOOD',
      status: 'RETURNED',
      returnNotes: '',
      returnDate: new Date().toISOString().split('T')[0],
    });
    setReturnModalOpen(true);
  };

  const openActaModal = (asset) => {
    setSelectedAsset(asset);
    setActaModalOpen(true);
  };

  const filteredAssets = useMemo(() => {
    let list = assets;

    if (statusFilter !== 'ALL') {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (categoryFilter !== 'ALL') {
      list = list.filter((a) => a.category === categoryFilter);
    }

    if (departmentFilter !== 'ALL') {
      list = list.filter((a) => a.employee?.department === departmentFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
          (a.employee?.firstName && a.employee.firstName.toLowerCase().includes(q)) ||
          (a.employee?.lastName && a.employee.lastName.toLowerCase().includes(q)) ||
          (a.employee?.identityCard && a.employee.identityCard.toLowerCase().includes(q))
      );
    }

    return list;
  }, [assets, statusFilter, categoryFilter, departmentFilter, searchQuery]);

  const departments = useMemo(() => {
    const set = new Set(assets.map((a) => a.employee?.department).filter(Boolean));
    return Array.from(set);
  }, [assets]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header Limpio ERP */}
      <div className="bg-white p-5 rounded-[4px] border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">
              Gestión de Capital Humano
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              Dotación y Custodia de Activos
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Control de Equipos, Herramientas y EPPs
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Registro formal de custodia de bienes asignados a colaboradores con actas de entrega y
            control de devoluciones.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded-[4px] transition-colors cursor-pointer bg-white flex items-center gap-1.5"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            type="button"
            onClick={() => setDeliverModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Registrar Entrega</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Estado con Contadores Tabulares + Filtros */}
      <div className="bg-white border border-gray-200 rounded-[4px] p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6 border-b border-gray-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Todos{' '}
              <span className="font-mono tabular-nums text-gray-400">({counts.total})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DELIVERED')}
              className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'DELIVERED'
                  ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              En Custodia{' '}
              <span
                className={`font-mono tabular-nums ${counts.deliveredCount > 0 ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}
              >
                ({counts.deliveredCount})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('RETURNED')}
              className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'RETURNED'
                  ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Devueltos a Bodega{' '}
              <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                ({counts.returnedCount})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LOST_DAMAGED')}
              className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'LOST_DAMAGED'
                  ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Dañados / Extraviados{' '}
              <span
                className={`font-mono tabular-nums ${counts.lostDamagedCount > 0 ? 'text-rose-600 font-semibold' : 'text-gray-400'}`}
              >
                ({counts.lostDamagedCount})
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-56">
              <FiSearch className="absolute left-3 top-2 text-gray-400" size={13} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar activo, serie o persona..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-[4px] text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-700 text-xs font-medium cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-gray-200 text-xs text-gray-800 rounded-[4px] px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="EQUIPMENT">Cómputo y Tecnología</option>
              <option value="UNIFORM_PPE">EPP e Indumentaria</option>
              <option value="TOOL">Herramientas</option>
              <option value="ACCESS_CARD">Tarjetas de Acceso</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-white border border-gray-200 text-xs text-gray-800 rounded-[4px] px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">Todos los Departamentos</option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de Activos Desacoplada */}
        <AssetsTable
          filteredAssets={filteredAssets}
          loading={loading}
          onOpenReturnModal={openReturnModal}
          onOpenActaModal={openActaModal}
          onOpenEditModal={openEditModal}
          onDeleteAsset={handleDelete}
        />
      </div>

      {/* Modales Desacoplados */}
      <DeliverAssetModal
        isOpen={deliverModalOpen}
        onClose={() => setDeliverModalOpen(false)}
        employees={employees}
        deliverForm={deliverForm}
        setDeliverForm={setDeliverForm}
        onSubmit={handleDeliverSubmit}
        actionLoading={actionLoading}
      />

      <EditAssetModal
        isOpen={editModalOpen && !!selectedAsset}
        onClose={() => setEditModalOpen(false)}
        selectedAsset={selectedAsset}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleEditSubmit}
        actionLoading={actionLoading}
      />

      <ReturnAssetModal
        isOpen={returnModalOpen && !!selectedAsset}
        onClose={() => setReturnModalOpen(false)}
        selectedAsset={selectedAsset}
        returnForm={returnForm}
        setReturnForm={setReturnForm}
        onSubmit={handleReturnSubmit}
        actionLoading={actionLoading}
      />

      <AssetActaModal
        isOpen={actaModalOpen && !!selectedAsset}
        onClose={() => setActaModalOpen(false)}
        selectedAsset={selectedAsset}
      />
    </div>
  );
}
