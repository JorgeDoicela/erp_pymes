/**
 * @file superAdmin.controller.js
 * @description Norma ERP - Controlador Backoffice SuperAdmin (SaaS Control Plane)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import superAdminService from './superAdmin.service.js';

export const getPlatformMetrics = async (req, res) => {
  try {
    const data = await superAdminService.getPlatformMetrics();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('[SUPERADMIN METRICS ERROR]:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getAllTenants = async (req, res) => {
  try {
    const result = await superAdminService.getAllTenants(req.query);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('[SUPERADMIN GET ALL TENANTS ERROR]:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getTenantDetail = async (req, res) => {
  try {
    const data = await superAdminService.getTenantDetail(req.params.id);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('[SUPERADMIN GET TENANT DETAIL ERROR]:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const updateTenantStatus = async (req, res) => {
  try {
    const updated = await superAdminService.updateTenantStatus(req.params.id, req.body);
    return res.json({
      success: true,
      message: `Estado de la empresa '${updated.name}' actualizado a ${updated.subscriptionStatus}`,
      data: updated,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const updateTenantPlan = async (req, res) => {
  try {
    const updated = await superAdminService.updateTenantPlan(req.params.id, req.body);
    return res.json({
      success: true,
      message: `Plan de la empresa '${updated.name}' actualizado a ${updated.plan}`,
      data: updated,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getTenantsList = async (req, res) => {
  try {
    const data = await superAdminService.getTenantsList();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getGlobalAuditLogs = async (req, res) => {
  try {
    const result = await superAdminService.getGlobalAuditLogs(req.query);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('[SUPERADMIN AUDIT LOGS ERROR]:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const createTenantBySuperAdmin = async (req, res) => {
  try {
    const result = await superAdminService.createTenantBySuperAdmin(req.body, req.user?.email);
    return res.status(201).json({
      success: true,
      message: `Empresa '${result.tenant.name}' creada exitosamente con trial de 45 días.`,
      data: result,
    });
  } catch (error) {
    console.error('[SUPERADMIN CREATE TENANT ERROR]:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const impersonateTenant = async (req, res) => {
  try {
    const { tenantName, payload } = await superAdminService.impersonateTenant(
      req.params.id,
      req.user?.email
    );
    return res.json({
      success: true,
      message: `Modo soporte iniciado para la empresa '${tenantName}'`,
      data: payload,
    });
  } catch (error) {
    console.error('[SUPERADMIN IMPERSONATE ERROR]:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
