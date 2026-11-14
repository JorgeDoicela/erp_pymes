/**
 * @file payroll.controller.js
 * @description Controlador HTTP para el módulo de nómina (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import payrollCalculationService from './payrollCalculation.service.js';
import { asyncHandler } from '../../../core/utils/asyncHandler.js';
import { ValidationError, NotFoundError } from '../../../core/errors/appError.js';

const getTenantId = (req) => req.tenantId || req.user?.tenantId;
const getEmployeeId = (req) => req.user?.employeeId || req.user?.id;

export class PayrollController {
  generate = asyncHandler(async (req, res) => {
    const { month, year } = req.body;
    if (!month || !year) throw new ValidationError('Mes y año requeridos');
    const payroll = await payrollCalculationService.generatePayroll(
      month,
      year,
      req.user?.id,
      getTenantId(req)
    );
    res.status(201).json({
      success: true,
      data: payroll,
      message: 'Nómina generada correctamente (Borrador)',
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await payrollCalculationService.getPayrolls(page, limit, getTenantId(req));
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  });

  getMyPayrolls = asyncHandler(async (req, res) => {
    const payrolls = await payrollCalculationService.getPayrollsByEmployee(
      getEmployeeId(req),
      req.user
    );
    res.status(200).json({ success: true, data: payrolls });
  });

  getById = asyncHandler(async (req, res) => {
    const payroll = await payrollCalculationService.getPayrollById(req.params.id, getTenantId(req));
    if (!payroll) throw new NotFoundError('Nómina no encontrada');
    res.status(200).json({ success: true, data: payroll });
  });

  confirm = asyncHandler(async (req, res) => {
    const payroll = await payrollCalculationService.confirmPayroll(
      req.params.id,
      req.user?.id,
      getTenantId(req)
    );
    res.status(200).json({ success: true, data: payroll, message: 'Nómina aprobada' });
  });

  generateBankFile = asyncHandler(async (req, res) => {
    const fileContent = await payrollCalculationService.generateBankFile(
      req.params.id,
      getTenantId(req)
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=transferencias.csv');
    res.send(fileContent);
  });

  markAsPaid = asyncHandler(async (req, res) => {
    const payroll = await payrollCalculationService.markAsPaid(
      req.params.id,
      req.user?.id,
      getTenantId(req)
    );
    res.status(200).json({ success: true, data: payroll, message: 'Pago registrado exitosamente' });
  });

  updateDetail = asyncHandler(async (req, res) => {
    const result = await payrollCalculationService.updatePayrollDetail(
      req.params.id,
      req.body,
      req.user?.id,
      getTenantId(req)
    );
    res.status(200).json({ success: true, message: 'Detalle de nómina actualizado', data: result });
  });

  delete = asyncHandler(async (req, res) => {
    const result = await payrollCalculationService.deletePayroll(
      req.params.id,
      req.user?.id,
      getTenantId(req)
    );
    res
      .status(200)
      .json({ success: true, message: 'Nómina eliminada correctamente', data: result });
  });

  signPayslip = asyncHandler(async (req, res) => {
    const { signatureType, notes, p12Data } = req.body;
    const result = await payrollCalculationService.signPayslip({
      detailId: req.params.id,
      employeeId: getEmployeeId(req),
      tenantId: getTenantId(req),
      signatureType,
      notes,
      p12Data,
    });
    res.status(200).json({
      success: true,
      message: 'Rol de pagos firmado y aprobado con éxito',
      data: result,
    });
  });

  disputePayslip = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason) throw new ValidationError('Debe especificar el motivo de la observación');
    const result = await payrollCalculationService.disputePayslip({
      detailId: req.params.id,
      employeeId: getEmployeeId(req),
      tenantId: getTenantId(req),
      reason,
    });
    res.status(200).json({
      success: true,
      message: 'Observación registrada y notificada a Recursos Humanos',
      data: result,
    });
  });

  notifyPendingSignatures = asyncHandler(async (req, res) => {
    const result = await payrollCalculationService.notifyPendingSignatures(
      req.params.id,
      getTenantId(req)
    );
    res.status(200).json({
      success: true,
      message: `Se enviaron ${result.sentCount} recordatorios de firma a colaboradores pendientes`,
      data: result,
    });
  });
}

export default new PayrollController();
