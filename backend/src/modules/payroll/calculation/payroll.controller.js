/**
 * @file payroll.controller.js
 * @description Controlador HTTP para el módulo de nómina (Norma ERP).
 * Adaptador de entrada delgado protegido por asyncHandler y Clean Architecture.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import payrollCalculationService from './payrollCalculation.service.js';
import { asyncHandler } from '../../../core/utils/asyncHandler.js';
import { ValidationError, NotFoundError } from '../../../core/errors/appError.js';

export class PayrollController {
  generate = asyncHandler(async (req, res) => {
    const { month, year } = req.body;
    if (!month || !year) {
      throw new ValidationError('Mes y año requeridos');
    }
    const userId = req.user?.id;
    const tenantId = req.tenantId || req.user?.tenantId;
    const payroll = await payrollCalculationService.generatePayroll(month, year, userId, tenantId);
    res.status(201).json({
      success: true,
      data: payroll,
      message: 'Nómina generada correctamente (Borrador)',
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const tenantId = req.tenantId || req.user?.tenantId;

    const result = await payrollCalculationService.getPayrolls(page, limit, tenantId);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  getMyPayrolls = asyncHandler(async (req, res) => {
    const employeeId = req.user?.employeeId || req.user?.id;
    const payrolls = await payrollCalculationService.getPayrollsByEmployee(employeeId, req.user);
    res.status(200).json({ success: true, data: payrolls });
  });

  getById = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const payroll = await payrollCalculationService.getPayrollById(req.params.id, tenantId);
    if (!payroll) {
      throw new NotFoundError('Nómina no encontrada');
    }
    res.status(200).json({ success: true, data: payroll });
  });

  confirm = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const tenantId = req.tenantId || req.user?.tenantId;
    const payroll = await payrollCalculationService.confirmPayroll(id, userId, tenantId);
    res.status(200).json({ success: true, data: payroll, message: 'Nómina aprobada' });
  });

  generateBankFile = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const fileContent = await payrollCalculationService.generateBankFile(req.params.id, tenantId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transferencias.csv');
    res.send(fileContent);
  });

  markAsPaid = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const tenantId = req.tenantId || req.user?.tenantId;
    const payroll = await payrollCalculationService.markAsPaid(id, userId, tenantId);
    res.status(200).json({ success: true, data: payroll, message: 'Pago registrado exitosamente' });
  });

  updateDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user?.id;
    const tenantId = req.tenantId || req.user?.tenantId;
    const result = await payrollCalculationService.updatePayrollDetail(
      id,
      req.body,
      adminId,
      tenantId
    );
    res.status(200).json({ success: true, message: 'Detalle de nómina actualizado', data: result });
  });

  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user?.id;
    const tenantId = req.tenantId || req.user?.tenantId;
    const result = await payrollCalculationService.deletePayroll(id, adminId, tenantId);
    res
      .status(200)
      .json({ success: true, message: 'Nómina eliminada correctamente', data: result });
  });

  signPayslip = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employeeId = req.user?.employeeId || req.user?.id;
    const { signatureType, notes, p12Data } = req.body;

    const result = await payrollCalculationService.signPayslip({
      detailId: id,
      employeeId,
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
    const { id } = req.params;
    const employeeId = req.user?.employeeId || req.user?.id;
    const { reason } = req.body;

    if (!reason) {
      throw new ValidationError('Debe especificar el motivo de la observación');
    }

    const result = await payrollCalculationService.disputePayslip({
      detailId: id,
      employeeId,
      reason,
    });

    res.status(200).json({
      success: true,
      message: 'Observación registrada y notificada a Recursos Humanos',
      data: result,
    });
  });

  notifyPendingSignatures = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;
    const result = await payrollCalculationService.notifyPendingSignatures(id, tenantId);

    res.status(200).json({
      success: true,
      message: `Se enviaron ${result.sentCount} recordatorios de firma a colaboradores pendientes`,
      data: result,
    });
  });
}

export default new PayrollController();
