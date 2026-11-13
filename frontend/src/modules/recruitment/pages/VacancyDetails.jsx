/**
 * @file VacancyDetails.jsx
 * @description Norma ERP - Gestión de candidatos y pipeline por vacante
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getVacancyById,
  getApplicationsByVacancy,
  deleteVacancy,
  deleteApplication,
  updateApplicationStatus,
} from '../services/recruitment.service';
import { FiArrowLeft, FiTrash2, FiCopy, FiCheck, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Button, EmptyState, Modal, Skeleton } from '@core/ui';
import { ErrorState } from '@core/feedback';
import VacancyApplicationsTable from '../components/VacancyApplicationsTable';

const STATUS_OPTIONS = [
  { key: 'ALL', label: 'Todos' },
  { key: 'PENDING', label: 'Postulados' },
  { key: 'REVIEWING', label: 'En Revisión' },
  { key: 'INTERVIEW', label: 'Entrevistas' },
  { key: 'TESTING', label: 'Pruebas' },
  { key: 'OFFER', label: 'Oferta' },
  { key: 'HIRED', label: 'Contratados' },
  { key: 'REJECTED', label: 'Descartados' },
];

const VacancyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);
  const [deletingCandidate, setDeletingCandidate] = useState(false);
  const [appToReject, setAppToReject] = useState(null);
  const [notifyRejectEmail, setNotifyRejectEmail] = useState(true);
  const [rejecting, setRejecting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [vacData, apps] = await Promise.all([getVacancyById(id), getApplicationsByVacancy(id)]);
      setVacancy(vacData);
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (error) {
      setLoadError(
        error.response?.data?.message || 'Error al cargar los candidatos de la vacante.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyStatusChange = async (appId, newStatus, sendEmail = false) => {
    try {
      await updateApplicationStatus(appId, newStatus, sendEmail);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      toast.success(
        newStatus === 'REJECTED' && sendEmail
          ? 'Candidato descartado y notificado por correo'
          : 'Estado del candidato actualizado'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleStatusChange = (app, newStatus) => {
    if (newStatus === 'REJECTED') {
      setAppToReject(app);
      setNotifyRejectEmail(true);
      return;
    }
    applyStatusChange(app.id, newStatus, false);
  };

  const handleConfirmReject = async () => {
    if (!appToReject) return;
    setRejecting(true);
    await applyStatusChange(appToReject.id, 'REJECTED', notifyRejectEmail);
    setRejecting(false);
    setAppToReject(null);
  };

  const handleDeleteCandidate = async () => {
    if (!appToDelete) return;
    try {
      setDeletingCandidate(true);
      await deleteApplication(appToDelete.id);
      toast.success('Candidato eliminado');
      setApplications((prev) => prev.filter((a) => a.id !== appToDelete.id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar el candidato');
    } finally {
      setDeletingCandidate(false);
      setAppToDelete(null);
    }
  };

  const handleDeleteVacancy = async () => {
    try {
      setDeleting(true);
      await deleteVacancy(id);
      toast.success('Vacante eliminada correctamente');
      navigate('/recruitment');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar la vacante');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const copyPublicLink = () => {
    const slug = vacancy?.tenant?.slug;
    const url = slug
      ? `${window.location.origin}/careers/${id}?company=${encodeURIComponent(slug)}`
      : `${window.location.origin}/careers/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Enlace de postulación copiado');
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesTab = activeTab === 'ALL' || app.status === activeTab;
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${app.firstName} ${app.lastName}`.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        fullName.includes(searchLower) ||
        app.email?.toLowerCase().includes(searchLower);
      return matchesTab && matchesSearch;
    });
  }, [applications, activeTab, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: applications.length };
    STATUS_OPTIONS.forEach((opt) => {
      if (opt.key !== 'ALL') {
        counts[opt.key] = applications.filter((a) => a.status === opt.key).length;
      }
    });
    return counts;
  }, [applications]);

  const vacancyTitle = vacancy?.title || 'Proceso de Selección';
  const vacancyDepartment = vacancy?.department || 'General';

  if (loadError) {
    return <ErrorState message={loadError} onRetry={loadData} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-200">
        <div>
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate('/recruitment')}
              className="hover:text-gray-900 transition-colors flex items-center gap-1 text-gray-600 cursor-pointer"
            >
              <FiArrowLeft size={12} /> Reclutamiento y Vacantes
            </button>
            <span>·</span>
            <span>{vacancyDepartment}</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{vacancyTitle}</h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="secondary" size="sm" onClick={copyPublicLink}>
            {copied ? <FiCheck className="text-green-700" size={13} /> : <FiCopy size={13} />}
            <span>{copied ? 'Enlace Copiado' : 'Copiar Enlace de Postulación'}</span>
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            <FiTrash2 size={13} />
            <span>Eliminar</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_OPTIONS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'border-gray-900 text-gray-900 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[10px] text-gray-500 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="pb-2 sm:pb-0">
          <input
            type="text"
            aria-label="Buscar candidato por nombre o correo"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900 w-full sm:w-56"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full rounded" />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          icon={<FiUsers size={24} />}
          title="No se encontraron postulantes en esta etapa"
          description="Comparte el enlace público para recibir candidatos o ajusta el filtro de búsqueda."
        />
      ) : (
        <VacancyApplicationsTable
          applications={filteredApplications}
          onSelectApplication={(appId) => navigate(`/recruitment/applications/${appId}`)}
          onStatusChange={handleStatusChange}
          onRequestDelete={setAppToDelete}
        />
      )}

      <Modal
        isOpen={Boolean(appToReject)}
        onClose={() => setAppToReject(null)}
        title="Descartar candidato"
        subtitle={appToReject ? `${appToReject.firstName} ${appToReject.lastName}` : ''}
        size="sm"
      >
        <div className="space-y-4 text-xs text-gray-600">
          <p>¿Confirmas marcar esta postulación como descartada?</p>
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifyRejectEmail}
              onChange={(e) => setNotifyRejectEmail(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-blue-600"
            />
            <span>Enviar correo electrónico cordial de notificación al candidato.</span>
          </label>
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAppToReject(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={rejecting} onClick={handleConfirmReject}>
              Confirmar Descarte
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(appToDelete)}
        onClose={() => setAppToDelete(null)}
        title="Eliminar candidato"
        subtitle={appToDelete ? `${appToDelete.firstName} ${appToDelete.lastName}` : ''}
        size="sm"
      >
        <div className="space-y-4 text-xs text-gray-600">
          <p>Se eliminarán permanentemente la postulación, notas, evaluaciones y CV adjunto.</p>
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAppToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deletingCandidate}
              onClick={handleDeleteCandidate}
            >
              Eliminar Candidato
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar vacante"
        subtitle={vacancyTitle}
        size="sm"
      >
        <div className="space-y-4 text-xs text-gray-600">
          <p>
            Esta acción eliminará permanentemente la vacante y las{' '}
            <strong className="font-mono">{applications.length}</strong> postulaciones asociadas.
          </p>
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteVacancy}>
              Eliminar Vacante
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VacancyDetails;
