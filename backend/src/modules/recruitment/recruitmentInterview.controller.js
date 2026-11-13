/**
 * @file recruitmentInterview.controller.js
 * @description Norma ERP - Controlador de entrevistas y consulta pública de vacantes
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import recruitmentService from './recruitment.service.js';

const getTenantId = (req) => req.tenantId || req.user?.tenantId || null;

export const getPublicVacancyById = async (req, res) => {
  try {
    const vacancy = await recruitmentService.getPublicVacancyById(req.params.id);
    res.json(vacancy);
  } catch (error) {
    res.status(404).json({ message: error.message || 'Vacante no disponible' });
  }
};

export const updateInterviewStatus = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { status, sendEmail = true } = req.body;
    const tenantId = getTenantId(req);
    const updated = await recruitmentService.updateInterviewStatus(
      interviewId,
      status,
      tenantId,
      sendEmail
    );
    res.json(updated);
  } catch (error) {
    const statusCode = error.message?.includes('Acceso denegado') ? 403 : 400;
    res.status(statusCode).json({ message: error.message || 'Error al actualizar entrevista' });
  }
};

export const getTenantInterviewers = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const interviewers = await recruitmentService.getTenantInterviewers(tenantId);
    res.json(interviewers);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error al obtener entrevistadores' });
  }
};
