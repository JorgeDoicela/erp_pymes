/**
 * @file useApplicationForms.js
 * @description Estado de modales y formularios para el expediente del candidato
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState } from 'react';

export const INITIAL_INTERVIEW_STATE = {
  date: '',
  time: '',
  type: 'VIRTUAL',
  location: '',
  notes: '',
  interviewerId: '',
  sendEmail: true,
};

export const useApplicationForms = () => {
  const [note, setNote] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showEvaModal, setShowEvaModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notifyRejectionEmail, setNotifyRejectionEmail] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [interviewData, setInterviewData] = useState(INITIAL_INTERVIEW_STATE);
  const [evaData, setEvaData] = useState({
    overallScore: '4.5',
    recommendation: 'HIRE',
    comments: '',
    ratings: {
      'Competencia Técnica': 5,
      'Habilidades Blandas': 4,
      'Experiencia Laboral': 4,
      'Ajuste a la Cultura': 5,
      'Motivación e Interés': 5,
    },
  });
  const [hireData, setHireData] = useState({
    identityCard: '',
    birthDate: '',
    address: '',
    civilStatus: 'Soltero',
    contractType: 'Indefinido',
    salary: '',
    startDate: new Date().toISOString().split('T')[0],
    password: '',
    closeVacancy: false,
    sendEmail: true,
  });

  const updateRating = (criterion, star) => {
    const updated = { ...evaData.ratings, [criterion]: star };
    const values = Object.values(updated);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    setEvaData({ ...evaData, ratings: updated, overallScore: avg.toFixed(1) });
  };

  return {
    note,
    setNote,
    showInterviewModal,
    setShowInterviewModal,
    showEvaModal,
    setShowEvaModal,
    showHireModal,
    setShowHireModal,
    showDeleteModal,
    setShowDeleteModal,
    showRejectModal,
    setShowRejectModal,
    notifyRejectionEmail,
    setNotifyRejectionEmail,
    showPdfModal,
    setShowPdfModal,
    interviewData,
    setInterviewData,
    evaData,
    setEvaData,
    hireData,
    setHireData,
    updateRating,
  };
};
