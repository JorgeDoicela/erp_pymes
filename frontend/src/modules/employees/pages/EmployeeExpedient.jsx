/**
 * @file EmployeeExpedient.jsx
 * @description Expedientes Digitales de Personal: Vista directorio institucional y expediente individual 360°.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAllExpedientsSummary,
  getEmployeeExpedient,
  getMyExpedient,
  verifyExpedientDocument,
  uploadExpedientDocument,
  deleteExpedientDocument,
} from '@/services/employees/onboardingOffboarding.service';
import Modal from '@/components/common/Modal';

// Componentes modulares desacoplados de employees/expedient
import ExpedientDirectoryView from '@/modules/employees/components/expedient/ExpedientDirectoryView';
import ExpedientDetailView from '@/modules/employees/components/expedient/ExpedientDetailView';
import UploadExpedientDocModal from '@/modules/employees/components/expedient/UploadExpedientDocModal';
import ReviewExpedientDocModal from '@/modules/employees/components/expedient/ReviewExpedientDocModal';

export default function EmployeeExpedient() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const isMyExpedient = window.location.pathname.includes('/my-expedient');
  const isDetailMode = Boolean(employeeId) || isMyExpedient;
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'hr' ||
    currentUser?.role === 'superadmin';

  // Estados para Modo Directorio General
  const [directoryData, setDirectoryData] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Estados para Modo Detalle de Expediente Individual
  const [expedientData, setExpedientData] = useState(null);
  const [expedientLoading, setExpedientLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('IDENTIFICATION');
  const [uploadUrl, setUploadUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const loadDirectory = useCallback(async () => {
    setDirectoryLoading(true);
    try {
      const res = await getAllExpedientsSummary();
      if (res.success) {
        setDirectoryData(res.data);
      }
    } catch (error) {
      console.error('Error al cargar directorio de expedientes:', error);
    } finally {
      setDirectoryLoading(false);
    }
  }, []);

  const loadExpedientDetail = useCallback(async () => {
    if (!employeeId && !isMyExpedient) return;
    setExpedientLoading(true);
    try {
      const res = isMyExpedient ? await getMyExpedient() : await getEmployeeExpedient(employeeId);
      if (res.success) {
        setExpedientData(res.data);
        if (employeeId) setTargetEmployeeId(employeeId);
      } else {
        setExpedientData(null);
      }
    } catch (error) {
      console.error('Error al cargar expediente individual:', error);
      setExpedientData(null);
    } finally {
      setExpedientLoading(false);
    }
  }, [employeeId, isMyExpedient]);

  useEffect(() => {
    if (employeeId === 'undefined') {
      navigate(isAdmin ? '/admin/expedientes' : '/my-expedient', { replace: true });
      return;
    }

    if (isDetailMode) {
      loadExpedientDetail();
      if (isAdmin && !isMyExpedient) {
        getAllExpedientsSummary()
          .then((res) => {
            if (res.success) setDirectoryData(res.data);
          })
          .catch(() => {});
      }
    } else {
      loadDirectory();
    }
  }, [employeeId, isDetailMode, isMyExpedient, isAdmin, navigate, loadExpedientDetail, loadDirectory]);

  // Manejo de Subida de Archivos
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadUrl.trim()) {
      alert('Por favor selecciona un archivo o ingresa el enlace del documento.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await uploadExpedientDocument({
        employeeId: targetEmployeeId || employeeId || expedientData?.employee?.id,
        type: uploadCategory,
        documentCategory: uploadCategory,
        documentUrl: uploadUrl.trim(),
        originalName: fileName.trim() || 'documento.pdf',
        expiryDate: expiryDate ? expiryDate : null,
      });

      if (res.success) {
        setUploadModalOpen(false);
        setUploadUrl('');
        setFileName('');
        setExpiryDate('');
        if (isDetailMode) {
          loadExpedientDetail();
        } else {
          loadDirectory();
        }
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Validación / Aprobación / Rechazo
  const handleVerifyAction = async (status) => {
    if (!selectedItem || !selectedItem.document) return;
    setActionLoading(true);
    try {
      const res = await verifyExpedientDocument(selectedItem.document.id, status, reviewNotes);
      if (res.success) {
        setReviewModalOpen(false);
        setSelectedItem(null);
        setReviewNotes('');
        if (isDetailMode) {
          loadExpedientDetail();
        } else {
          loadDirectory();
        }
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminación de Documento
  const handleDeleteDocumentConfirm = async () => {
    if (!documentToDelete?.id) return;
    setActionLoading(true);
    try {
      const res = await deleteExpedientDocument(documentToDelete.id);
      if (res.success) {
        setDeleteConfirmModalOpen(false);
        setDocumentToDelete(null);
        if (isDetailMode) {
          loadExpedientDetail();
        } else {
          loadDirectory();
        }
      }
    } catch (error) {
      console.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrado de empleados en el directorio
  const filteredEmployees = useMemo(() => {
    if (!directoryData?.employees) return [];
    let list = directoryData.employees;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (emp) =>
          emp.fullName.toLowerCase().includes(q) ||
          emp.identityCard.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q) ||
          emp.position.toLowerCase().includes(q)
      );
    }

    if (departmentFilter !== 'ALL') {
      list = list.filter((emp) => emp.department === departmentFilter);
    }

    if (statusFilter === 'PENDING_REVIEW') {
      list = list.filter((emp) => emp.pendingReviewCount > 0);
    } else if (statusFilter === 'INCOMPLETE') {
      list = list.filter((emp) => !emp.isComplete);
    } else if (statusFilter === 'COMPLETE') {
      list = list.filter((emp) => emp.isComplete);
    }

    return list;
  }, [directoryData, searchQuery, departmentFilter, statusFilter]);

  const departments = useMemo(() => {
    if (!directoryData?.employees) return [];
    const set = new Set(directoryData.employees.map((e) => e.department).filter(Boolean));
    return Array.from(set);
  }, [directoryData]);

  const stats = directoryData?.stats || {
    totalEmployees: 0,
    completeCount: 0,
    incompleteCount: 0,
    pendingReviewsGlobal: 0,
    avgCompletion: 0,
  };

  const openUploadForCategory = (catKey) => {
    setTargetEmployeeId(expedientData?.employee?.id || employeeId || '');
    setUploadCategory(catKey || 'IDENTIFICATION');
    setUploadModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {isDetailMode ? (
        expedientLoading ? (
          <div className="p-12 text-center text-gray-400 text-xs font-mono">
            Cargando Expediente Digital...
          </div>
        ) : !expedientData ? (
          <div className="bg-white p-8 rounded-[4px] border border-gray-200 text-center max-w-md mx-auto my-12 space-y-4">
            <p className="text-sm font-semibold text-gray-900">Expediente no disponible</p>
            <p className="text-xs text-gray-500">
              No se encontró información documental para este colaborador.
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin/expedientes')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[4px] transition-colors cursor-pointer"
            >
              Volver al Directorio de Expedientes
            </button>
          </div>
        ) : (
          <ExpedientDetailView
            expedientData={expedientData}
            employeeId={employeeId}
            isMyExpedient={isMyExpedient}
            directoryData={directoryData}
            isAdmin={isAdmin}
            onOpenUploadModal={openUploadForCategory}
            onOpenReviewModal={(item) => {
              setSelectedItem(item);
              setReviewNotes(item.document?.verificationNotes || '');
              setReviewModalOpen(true);
            }}
            onOpenDeleteModal={(doc) => {
              setDocumentToDelete(doc);
              setDeleteConfirmModalOpen(true);
            }}
          />
        )
      ) : (
        <ExpedientDirectoryView
          stats={stats}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          departments={departments}
          filteredEmployees={filteredEmployees}
          directoryLoading={directoryLoading}
          onRefresh={loadDirectory}
          onOpenUploadModal={() => openUploadForCategory('IDENTIFICATION')}
        />
      )}

      {/* Modal de Subida de Documento */}
      <UploadExpedientDocModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        isDetailMode={isDetailMode}
        directoryData={directoryData}
        targetEmployeeId={targetEmployeeId}
        setTargetEmployeeId={setTargetEmployeeId}
        uploadCategory={uploadCategory}
        setUploadCategory={setUploadCategory}
        onFileUpload={handleFileUpload}
        uploadUrl={uploadUrl}
        setUploadUrl={setUploadUrl}
        expiryDate={expiryDate}
        setExpiryDate={setExpiryDate}
        onSubmit={handleUploadSubmit}
        actionLoading={actionLoading}
      />

      {/* Modal de Validación por RRHH / Admin */}
      <ReviewExpedientDocModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        selectedItem={selectedItem}
        reviewNotes={reviewNotes}
        setReviewNotes={setReviewNotes}
        onVerifyAction={handleVerifyAction}
        actionLoading={actionLoading}
      />

      {/* Modal de Confirmación Destructiva (Eliminar Documento) */}
      <Modal
        isOpen={deleteConfirmModalOpen && !!documentToDelete}
        onClose={() => {
          setDeleteConfirmModalOpen(false);
          setDocumentToDelete(null);
        }}
        title="Eliminar Documento"
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmModalOpen(false);
                setDocumentToDelete(null);
              }}
              className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteDocumentConfirm}
              disabled={actionLoading}
              className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? 'Eliminando...' : 'Eliminar Documento'}
            </button>
          </div>
        }
      >
        {documentToDelete && (
          <div className="space-y-2 text-xs">
            <p className="text-gray-700 leading-relaxed">
              ¿Confirmas que deseas eliminar{' '}
              <strong className="text-gray-900 font-semibold">{documentToDelete.name}</strong> (
              {documentToDelete.category}) del expediente?
            </p>
            <p className="text-[11px] text-gray-400">
              Esta acción eliminará el archivo del registro y recalculará la completitud del
              colaborador.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
