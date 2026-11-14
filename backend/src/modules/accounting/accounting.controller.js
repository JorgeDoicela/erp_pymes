/**
 * @file accounting.controller.js
 * @description Controlador HTTP para el módulo contable (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import accountingService from './accounting.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';

const getTenantId = (req) => req.tenantId || req.user?.tenantId || null;

export const getPeriods = asyncHandler(async (req, res) => {
  res.status(200).json(await accountingService.getPeriods(getTenantId(req)));
});

export const createPeriod = asyncHandler(async (req, res) => {
  const period = await accountingService.createPeriod({
    ...req.body,
    tenantId: getTenantId(req),
    user: req.user,
  });
  res.status(201).json(period);
});

export const togglePeriodStatus = asyncHandler(async (req, res) => {
  const updated = await accountingService.togglePeriodStatus(req.params.id, req.user);
  res.status(200).json({ message: `Periodo actualizado a ${updated.status}`, period: updated });
});

export const deletePeriod = asyncHandler(async (req, res) => {
  res.status(200).json(await accountingService.deletePeriod(req.params.id, req.user));
});

export const getAccounts = asyncHandler(async (req, res) => {
  res.status(200).json(await accountingService.getAccounts(getTenantId(req)));
});

export const createAccount = asyncHandler(async (req, res) => {
  const account = await accountingService.createAccount({
    ...req.body,
    tenantId: getTenantId(req),
    user: req.user,
  });
  res.status(201).json(account);
});

export const updateAccount = asyncHandler(async (req, res) => {
  res.status(200).json(await accountingService.updateAccount(req.params.id, req.body, req.user));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  res.status(200).json(await accountingService.deleteAccount(req.params.id, req.user));
});

export const getCostCenters = asyncHandler(async (req, res) => {
  res.status(200).json(await accountingService.getCostCenters(getTenantId(req)));
});

export const createCostCenter = asyncHandler(async (req, res) => {
  const center = await accountingService.createCostCenter({
    ...req.body,
    tenantId: getTenantId(req),
    user: req.user,
  });
  res.status(201).json(center);
});

export const updateCostCenter = asyncHandler(async (req, res) => {
  res.status(200).json(await accountingService.updateCostCenter(req.params.id, req.body, req.user));
});

export const deleteCostCenter = asyncHandler(async (req, res) => {
  res.status(200).json(await accountingService.deleteCostCenter(req.params.id, req.user));
});

export const getJournalEntries = asyncHandler(async (req, res) => {
  const { status, periodId, take } = req.query;
  const entries = await accountingService.getJournalEntries({
    tenantId: getTenantId(req),
    status,
    periodId,
    take: take ? parseInt(take, 10) : 150,
  });
  res.status(200).json(entries);
});

export const createJournalEntry = asyncHandler(async (req, res) => {
  const result = await accountingService.createJournalEntry({
    ...req.body,
    tenantId: getTenantId(req),
    user: req.user,
  });
  res.status(201).json(result);
});

export const postJournalEntry = asyncHandler(async (req, res) => {
  const updated = await accountingService.postJournalEntry(req.params.id, req.user);
  res.status(200).json({ message: 'Asiento contable mayorizado exitosamente.', entry: updated });
});

export const deleteJournalEntry = asyncHandler(async (req, res) => {
  res.status(200).json(await accountingService.deleteJournalEntry(req.params.id, req.user));
});

export const getTrialBalance = asyncHandler(async (req, res) => {
  const { periodId, status } = req.query;
  res
    .status(200)
    .json(
      await accountingService.getTrialBalance({ tenantId: getTenantId(req), periodId, status })
    );
});

export const getGeneralLedger = asyncHandler(async (req, res) => {
  const { periodId, accountId } = req.query;
  res
    .status(200)
    .json(
      await accountingService.getGeneralLedger({ tenantId: getTenantId(req), periodId, accountId })
    );
});

export const integratePayroll = asyncHandler(async (req, res) => {
  const result = await accountingService.integratePayroll({
    payrollId: req.body.payrollId,
    tenantId: getTenantId(req),
    user: req.user,
  });
  res.status(200).json(result);
});
