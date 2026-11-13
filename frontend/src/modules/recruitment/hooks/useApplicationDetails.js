/**
 * @file useApplicationDetails.js
 * @description Hook de carga y mutaciones para el expediente integral de un candidato
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  getApplicationDetails,
  updateApplicationStatus,
  deleteApplication,
  addApplicationNote,
  getInterviewers,
  scheduleInterview,
  updateInterviewStatus,
  evaluateCandidate,
  hireCandidate,
} from '../services/recruitment.service';
import { INITIAL_INTERVIEW_STATE, useApplicationForms } from './useApplicationForms';

export const useApplicationDetails = (id) => {
  const navigate = useNavigate();
  const forms = useApplicationForms();
  const [app, setApp] = useState(null);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingCandidate, setDeletingCandidate] = useState(false);

  const { setHireData } = forms;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [data, team] = await Promise.all([
        getApplicationDetails(id),
        getInterviewers().catch(() => []),
      ]);
      setApp(data);
      setInterviewers(Array.isArray(team) ? team : []);
      if (data?.salary) setHireData((prev) => ({ ...prev, salary: data.salary }));
    } catch (error) {
      setLoadError(
        error.response?.data?.message || 'Error al cargar los detalles de la postulación.'
      );
    } finally {
      setLoading(false);
    }
  }, [id, setHireData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyStatusUpdate = async (newStatus, sendEmail = false) => {
    try {
      await updateApplicationStatus(id, newStatus, sendEmail);
      setApp((prev) => ({ ...prev, status: newStatus }));
      toast.success(
        newStatus === 'REJECTED' && sendEmail
          ? 'Candidato descartado y notificado por correo'
          : 'Etapa del proceso actualizada'
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'REJECTED') {
      forms.setNotifyRejectionEmail(true);
      forms.setShowRejectModal(true);
      return;
    }
    applyStatusUpdate(newStatus, false);
  };

  const handleConfirmReject = async () => {
    setSubmitting(true);
    await applyStatusUpdate('REJECTED', forms.notifyRejectionEmail);
    setSubmitting(false);
    forms.setShowRejectModal(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!forms.note.trim()) return;
    try {
      setSubmitting(true);
      const newNote = await addApplicationNote(id, forms.note.trim());
      setApp((prev) => ({ ...prev, notes: [newNote, ...(prev.notes || [])] }));
      forms.setNote('');
      toast.success('Nota de seguimiento registrada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar la nota');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const dateTime = new Date(`${forms.interviewData.date}T${forms.interviewData.time}`);
      const created = await scheduleInterview(id, {
        ...forms.interviewData,
        date: dateTime.toISOString(),
      });
      setApp((prev) => ({
        ...prev,
        status:
          prev.status === 'PENDING' || prev.status === 'REVIEWING' ? 'INTERVIEW' : prev.status,
        interviews: [...(prev.interviews || []), created].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        ),
      }));
      forms.setShowInterviewModal(false);
      forms.setInterviewData(INITIAL_INTERVIEW_STATE);
      toast.success(
        forms.interviewData.sendEmail !== false
          ? 'Entrevista agendada y notificación enviada al candidato'
          : 'Entrevista agendada exitosamente'
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al agendar entrevista');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateInterviewStatus = async (interviewId, nextStatus) => {
    try {
      const updated = await updateInterviewStatus(
        interviewId,
        nextStatus,
        nextStatus === 'CANCELLED'
      );
      setApp((prev) => ({
        ...prev,
        interviews: (prev.interviews || []).map((item) =>
          item.id === interviewId ? { ...item, status: updated.status } : item
        ),
      }));
      toast.success(
        nextStatus === 'CANCELLED'
          ? 'Entrevista cancelada y candidato notificado'
          : 'Entrevista marcada como completada'
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar la entrevista');
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const created = await evaluateCandidate(id, {
        ...forms.evaData,
        overallScore: parseFloat(forms.evaData.overallScore) * 20,
      });
      setApp((prev) => ({ ...prev, evaluations: [created, ...(prev.evaluations || [])] }));
      forms.setShowEvaModal(false);
      toast.success('Evaluación de equipo registrada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar evaluación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHire = async (e) => {
    e.preventDefault();
    if (!forms.hireData.identityCard || !forms.hireData.salary || !forms.hireData.password) {
      toast.error('Cédula, salario y contraseña son obligatorios');
      return;
    }
    try {
      setSubmitting(true);
      await hireCandidate(id, forms.hireData);
      toast.success('Candidato contratado e incorporado a la nómina con éxito');
      forms.setShowHireModal(false);
      setApp((prev) => ({ ...prev, status: 'HIRED' }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al contratar candidato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCandidate = async () => {
    try {
      setDeletingCandidate(true);
      await deleteApplication(id);
      toast.success('Candidato eliminado');
      navigate(app?.vacancyId ? `/recruitment/${app.vacancyId}` : '/recruitment');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar el candidato');
    } finally {
      setDeletingCandidate(false);
      forms.setShowDeleteModal(false);
    }
  };

  return {
    ...forms,
    app,
    interviewers,
    loading,
    loadError,
    submitting,
    deletingCandidate,
    loadData,
    handleStatusChange,
    handleConfirmReject,
    handleAddNote,
    handleSchedule,
    handleUpdateInterviewStatus,
    handleEvaluate,
    handleHire,
    handleDeleteCandidate,
  };
};
