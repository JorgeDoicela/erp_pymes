/**
 * @file accounting.controller.js
 * @description Controlador HTTP para el módulo contable (Norma ERP).
 * Adaptador de entrada delgado respaldado por asyncHandler y AccountingService.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import accountingService from './accounting.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const getTenantId = (req) => req.tenantId || req.user?.tenantId || null;

// ==========================================
// 1. Periodos Fiscales
// ==========================================

export const getPeriods = asyncHandler(async (req, res) => {
  const periods = await accountingService.getPeriods(getTenantId(req));
  res.status(200).json(periods);
});

export const createPeriod = asyncHandler(async (req, res) => {
  const { year, month, startDate, endDate } = req.body;
  const period = await accountingService.createPeriod({
    tenantId: getTenantId(req),
    year,
    month,
    startDate,
    endDate,
    user: req.user,
  });
  res.status(201).json(period);
});

export const togglePeriodStatus = asyncHandler(async (req, res) => {
  const updated = await accountingService.togglePeriodStatus(req.params.id, req.user);
  res.status(200).json({
    message: `Periodo actualizado a ${updated.status}`,
    period: updated,
  });
});

export const deletePeriod = asyncHandler(async (req, res) => {
  const result = await accountingService.deletePeriod(req.params.id, req.user);
  res.status(200).json(result);
});

// ==========================================
// 2. Catálogo de Cuentas Contables
// ==========================================

export const getAccounts = asyncHandler(async (req, res) => {
  const accounts = await accountingService.getAccounts(getTenantId(req));
  res.status(200).json(accounts);
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
  const updated = await accountingService.updateAccount(req.params.id, req.body, req.user);
  res.status(200).json(updated);
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const result = await accountingService.deleteAccount(req.params.id, req.user);
  res.status(200).json(result);
});

// ==========================================
// 3. Centros de Costo
// ==========================================

export const getCostCenters = asyncHandler(async (req, res) => {
  const centers = await accountingService.getCostCenters(getTenantId(req));
  res.status(200).json(centers);
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
  const updated = await accountingService.updateCostCenter(req.params.id, req.body, req.user);
  res.status(200).json(updated);
});

export const deleteCostCenter = asyncHandler(async (req, res) => {
  const result = await accountingService.deleteCostCenter(req.params.id, req.user);
  res.status(200).json(result);
});

// ==========================================
// 4. Asientos y Comprobantes Contables
// ==========================================

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
  res.status(200).json({
    message: 'Asiento contable mayorizado exitosamente.',
    entry: updated,
  });
});

export const deleteJournalEntry = asyncHandler(async (req, res) => {
  const result = await accountingService.deleteJournalEntry(req.params.id, req.user);
  res.status(200).json(result);
});

// ==========================================
// 5. Reportes Financieros
// ==========================================

export const getTrialBalance = asyncHandler(async (req, res) => {
  const { periodId, status } = req.query;
  const report = await accountingService.getTrialBalance({
    tenantId: getTenantId(req),
    periodId,
    status,
  });
  res.status(200).json(report);
});

export const getGeneralLedger = asyncHandler(async (req, res) => {
  const { periodId, accountId } = req.query;
  const movements = await accountingService.getGeneralLedger({
    tenantId: getTenantId(req),
    periodId,
    accountId,
  });
  res.status(200).json(movements);
});

// ==========================================
// 6. Integración de Nómina
// ==========================================

export const integratePayroll = asyncHandler(async (req, res) => {
  const { payrollId } = req.body;
  const result = await accountingService.integratePayroll({
    payrollId,
    tenantId: getTenantId(req),
    user: req.user,
  });
  res.status(200).json(result);
});
