/**
 * @file salaryAdvanceController.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import salaryAdvanceService from './salaryAdvance.service.js';

const getTenantId = (req) => req.tenantId || req.user?.tenantId;
const getEmployeeId = (req) => req.user?.employeeId || req.user?.id;
const respondError = (res, status, error, fallback) =>
  res.status(status).json({ success: false, message: error.message || fallback });

export const requestAdvance = async (req, res) => {
  try {
    const { amount, installments, reason } = req.body;
    const data = await salaryAdvanceService.requestAdvance({
      employeeId: getEmployeeId(req),
      amount,
      installments,
      reason,
    });
    return res
      .status(201)
      .json({ success: true, message: 'Solicitud de anticipo registrada exitosamente', data });
  } catch (error) {
    return respondError(res, 400, error, 'Error al procesar la solicitud de anticipo');
  }
};

export const createByAdmin = async (req, res) => {
  try {
    const { employeeId, amount, installments, reason, autoApprove } = req.body;
    const data = await salaryAdvanceService.createAdvanceByAdmin(
      { employeeId, amount, installments, reason, autoApprove },
      req.user?.id,
      getTenantId(req)
    );
    const message = autoApprove
      ? 'Anticipo concedido y aprobado exitosamente'
      : 'Solicitud de anticipo registrada';
    return res.status(201).json({ success: true, message, data });
  } catch (error) {
    return respondError(res, 400, error, 'Error al registrar anticipo');
  }
};

export const getStats = async (req, res) => {
  try {
    const data = await salaryAdvanceService.getStats(getTenantId(req));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondError(res, 500, error, 'Error al obtener estadísticas de anticipos');
  }
};

export const getAdvances = async (req, res) => {
  try {
    const { page, limit, status, employeeId, search } = req.query;
    const result = await salaryAdvanceService.getAdvances({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      employeeId,
      search,
      tenantId: getTenantId(req),
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return respondError(res, 500, error, 'Error al obtener anticipos');
  }
};

export const getMyAdvances = async (req, res) => {
  try {
    const data = await salaryAdvanceService.getMyAdvances(getEmployeeId(req));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondError(res, 500, error, 'Error al obtener tus anticipos');
  }
};

export const approveAdvance = async (req, res) => {
  try {
    const data = await salaryAdvanceService.approveAdvance(
      req.params.id,
      req.user.id,
      getTenantId(req)
    );
    return res.status(200).json({ success: true, message: 'Anticipo aprobado exitosamente', data });
  } catch (error) {
    return respondError(res, 400, error, 'Error al aprobar anticipo');
  }
};

export const rejectAdvance = async (req, res) => {
  try {
    const data = await salaryAdvanceService.rejectAdvance(
      req.params.id,
      req.body.rejectionReason,
      req.user.id,
      getTenantId(req)
    );
    return res.status(200).json({ success: true, message: 'Anticipo rechazado', data });
  } catch (error) {
    return respondError(res, 400, error, 'Error al rechazar anticipo');
  }
};

export const cancelAdvance = async (req, res) => {
  try {
    const data = await salaryAdvanceService.cancelAdvance(req.params.id, getEmployeeId(req));
    return res.status(200).json({ success: true, message: 'Solicitud cancelada', data });
  } catch (error) {
    return respondError(res, 400, error, 'Error al cancelar solicitud');
  }
};
