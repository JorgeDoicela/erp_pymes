/**
 * @file ApplicationDetails.jsx
 * @description Norma ERP - Expediente integral del candidato y pipeline de selección
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiTrash2, FiStar, FiCheckCircle } from 'react-icons/fi';
import { Button, Modal, Skeleton } from '@core/ui';
import { ErrorState } from '@core/feedback';
import {
  CandidateProfileCard,
  CandidateInterviewsCard,
  CandidateEvaluationsCard,
  CandidateNotesPanel,
  CandidateResumeModal,
  ScheduleInterviewModal,
  EvaluateCandidateModal,
  HireCandidateModal,
} from '../components';
import { useApplicationDetails } from '../hooks/useApplicationDetails';

const PIPELINE_STAGES = [
  { key: 'PENDING', label: '1. Postulado' },
  { key: 'REVIEWING', label: '2. Revisión' },
  { key: 'INTERVIEW', label: '3. Entrevistas' },
  { key: 'TESTING', label: '4. Pruebas' },
  { key: 'OFFER', label: '5. Oferta' },
  { key: 'HIRED', label: '6. Contratado' },
];

const getResumeUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const token = localStorage.getItem('token') || '';
  let cleanPath = url.startsWith('/') ? url.substring(1) : url;
  if (cleanPath.startsWith('resumes/')) cleanPath = `uploads/${cleanPath}`;
  if (!cleanPath.startsWith('api/')) cleanPath = `api/${cleanPath}`;
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  if (apiBase.startsWith('http')) {
    return `${apiBase.replace(/\/api\/?$/, '')}/${cleanPath}${tokenParam}`;
  }
  return `/${cleanPath}${tokenParam}`;
};

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const vm = useApplicationDetails(id);

  if (vm.loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-44 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
          <Skeleton className="h-96 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (vm.loadError) return <ErrorState message={vm.loadError} onRetry={vm.loadData} />;

  if (!vm.app) {
    return (
      <div className="bg-white border border-gray-200 rounded-md p-12 text-center text-gray-500">
        <p className="text-sm font-medium text-gray-700">Postulación no encontrada</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => navigate('/recruitment')}
        >
          Volver a Reclutamiento
        </Button>
      </div>
    );
  }

  const { app } = vm;
  const candidateName = `${app.firstName} ${app.lastName}`;
  const initials = `${app.firstName?.[0] || ''}${app.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-200">
        <div>
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                navigate(app.vacancyId ? `/recruitment/${app.vacancyId}` : '/recruitment')
              }
              className="hover:text-gray-900 transition-colors flex items-center gap-1 text-gray-600 cursor-pointer"
            >
              <FiArrowLeft size={12} /> {app.vacancy?.title || 'Volver al Proceso'}
            </button>
            <span>·</span>
            <span>Expediente de Candidato</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 text-gray-800 font-mono font-bold text-sm flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight leading-none">
                {candidateName}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Postulación recibida el{' '}
                <span className="font-mono tabular-nums font-medium text-gray-700">
                  {new Date(app.createdAt).toLocaleDateString('es-EC')}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <select
            aria-label="Etapa del proceso"
            value={app.status}
            onChange={(e) => vm.handleStatusChange(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 font-medium focus:outline-none focus:border-gray-900 cursor-pointer"
          >
            <option value="PENDING">Postulado</option>
            <option value="REVIEWING">En Revisión</option>
            <option value="INTERVIEW">Entrevistas</option>
            <option value="TESTING">Pruebas</option>
            <option value="OFFER">Oferta Enviada</option>
            <option value="HIRED">Contratado</option>
            <option value="REJECTED">Descartado</option>
          </select>

          <Button variant="secondary" size="sm" onClick={() => vm.setShowInterviewModal(true)}>
            <FiCalendar size={13} />
            <span>Agendar</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => vm.setShowEvaModal(true)}>
            <FiStar size={13} />
            <span>Evaluar</span>
          </Button>
          {app.status !== 'HIRED' ? (
            <Button variant="primary" size="sm" onClick={() => vm.setShowHireModal(true)}>
              <FiCheckCircle size={13} />
              <span>Contratar</span>
            </Button>
          ) : (
            <span className="px-3 py-1.5 bg-white text-green-800 border border-gray-200 rounded text-xs font-semibold font-mono">
              Empleado Activo
            </span>
          )}
          <button
            type="button"
            onClick={() => vm.setShowDeleteModal(true)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
            title="Eliminar candidato"
            aria-label="Eliminar candidato"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-3 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[620px] gap-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCurrent = app.status === stage.key;
            const isCompleted = PIPELINE_STAGES.findIndex((s) => s.key === app.status) >= idx;
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => vm.handleStatusChange(stage.key)}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium text-center border transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                    : isCompleted
                      ? 'bg-gray-100 text-gray-800 border-gray-300'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {stage.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <CandidateProfileCard
            app={app}
            getResumeUrl={getResumeUrl}
            onOpenResumeModal={() => vm.setShowPdfModal(true)}
          />
          <CandidateInterviewsCard
            interviews={app.interviews || []}
            onOpenScheduleModal={() => vm.setShowInterviewModal(true)}
            onUpdateInterviewStatus={vm.handleUpdateInterviewStatus}
          />
          <CandidateEvaluationsCard
            evaluations={app.evaluations || []}
            onOpenEvaModal={() => vm.setShowEvaModal(true)}
          />
        </div>
        <CandidateNotesPanel
          notes={app.notes || []}
          noteText={vm.note}
          setNoteText={vm.setNote}
          onAddNote={vm.handleAddNote}
          submitting={vm.submitting}
        />
      </div>

      <ScheduleInterviewModal
        isOpen={vm.showInterviewModal}
        onClose={() => vm.setShowInterviewModal(false)}
        candidateName={candidateName}
        interviewData={vm.interviewData}
        setInterviewData={vm.setInterviewData}
        interviewers={vm.interviewers}
        onSubmit={vm.handleSchedule}
        submitting={vm.submitting}
      />
      <EvaluateCandidateModal
        isOpen={vm.showEvaModal}
        onClose={() => vm.setShowEvaModal(false)}
        candidateName={candidateName}
        evaData={vm.evaData}
        setEvaData={vm.setEvaData}
        updateRating={vm.updateRating}
        onSubmit={vm.handleEvaluate}
        submitting={vm.submitting}
      />
      <HireCandidateModal
        isOpen={vm.showHireModal}
        onClose={() => vm.setShowHireModal(false)}
        candidateName={candidateName}
        department={app.vacancy?.department}
        hireData={vm.hireData}
        setHireData={vm.setHireData}
        onSubmit={vm.handleHire}
        submitting={vm.submitting}
      />
      <CandidateResumeModal
        isOpen={vm.showPdfModal}
        onClose={() => vm.setShowPdfModal(false)}
        candidateName={candidateName}
        resumeUrl={app.resumeUrl}
        getResumeUrl={getResumeUrl}
      />

      <Modal
        isOpen={vm.showRejectModal}
        onClose={() => vm.setShowRejectModal(false)}
        title="Descartar candidato"
        subtitle={`Actualizar estado de ${candidateName}`}
        size="sm"
      >
        <div className="space-y-4 text-xs text-gray-600">
          <p>
            ¿Confirmas marcar la postulación de <strong>{candidateName}</strong> como descartada?
          </p>
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={vm.notifyRejectionEmail}
              onChange={(e) => vm.setNotifyRejectionEmail(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-blue-600"
            />
            <span>Enviar correo electrónico cordial de notificación al candidato.</span>
          </label>
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => vm.setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={vm.submitting}
              onClick={vm.handleConfirmReject}
            >
              Confirmar Descarte
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={vm.showDeleteModal}
        onClose={() => vm.setShowDeleteModal(false)}
        title="Eliminar candidato"
        subtitle={candidateName}
        size="sm"
      >
        <div className="space-y-4 text-xs text-gray-600">
          <p>
            Esta acción eliminará permanentemente la postulación, notas, entrevistas, evaluaciones y
            el archivo CV de <strong>{candidateName}</strong>.
          </p>
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => vm.setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={vm.deletingCandidate}
              onClick={vm.handleDeleteCandidate}
            >
              Eliminar Candidato
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApplicationDetails;
