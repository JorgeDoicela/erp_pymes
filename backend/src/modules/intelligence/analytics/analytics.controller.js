/**
 * @file analytics.controller.js
 * @description Norma ERP - Controlador de Analítica Descriptiva
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import analyticsService from './analytics.service.js';

export const getDashboardData = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.role === 'SUPERADMIN';
    const data = await analyticsService.getDashboardData(tenantId, isSuperAdmin);
    res.json(data);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json(error.payload);
    }
    console.error('Error fetching analytics (CRITICAL):', error);
    res.status(500).json({ message: 'Error al obtener datos del dashboard', error: error.message });
  }
};

export const getTurnoverReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.tenantId || req.user?.tenantId;
    const report = await analyticsService.getTurnoverReport({ startDate, endDate, tenantId });
    res.json(report);
  } catch (error) {
    console.error('Error generating turnover report:', error);
    res.status(500).json({ message: 'Error al generar reporte de rotación' });
  }
};

export const getPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    const tenantId = req.tenantId || req.user?.tenantId;
    const report = await analyticsService.getPerformanceReport({
      startDate,
      endDate,
      department,
      tenantId,
    });
    res.json(report);
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({ message: 'Error al generar reporte de desempeño' });
  }
};

export const getPayrollCostReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.tenantId || req.user?.tenantId;
    const report = await analyticsService.getPayrollCostReport({
      startDate,
      endDate,
      tenantId,
    });
    res.json(report);
  } catch (error) {
    console.error('Error generating payroll cost report:', error);
    res.status(500).json({ message: 'Error al generar reporte de costos' });
  }
};

export const getSatisfactionReport = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const report = await analyticsService.getSatisfactionReport(tenantId);
    res.json(report);
  } catch (error) {
    console.error('Error generating satisfaction report:', error);
    res.status(500).json({ message: 'Error al generar reporte de satisfacción' });
  }
};

export const getCustomReport = async (req, res) => {
  try {
    const { module, fields, filters, limit } = req.body;
    const tenantId = req.tenantId || req.user?.tenantId;
    const data = await analyticsService.getCustomReport({
      module,
      fields,
      filters,
      limit,
      tenantId,
    });
    res.json(data);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json(error.payload);
    }
    console.error('Error generating custom report:', error);
    res.status(500).json({ message: 'Error al generar reporte personalizado' });
  }
};
