/**
 * @file tenant.controller.js
 * @description Norma ERP - Controlador de Onboarding y Perfil de Empresa (Tenant)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import tenantService from './tenant.service.js';

export const registerTenant = async (req, res) => {
  try {
    const data = await tenantService.registerTenant(req.body);
    res.status(201).json({
      success: true,
      message: 'Empresa registrada exitosamente. Período de prueba de 45 días activado.',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('[REGISTER TENANT ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la empresa: ' + error.message,
    });
  }
};

export const getMyTenant = async (req, res) => {
  try {
    const tenant = await tenantService.getMyTenant(req.tenantId);
    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const updateMyTenant = async (req, res) => {
  try {
    const { name, ruc } = req.body;
    const userId = req.user?.id || req.user?.employeeId;
    const updated = await tenantService.updateMyTenant(req.tenantId, userId, { name, ruc });

    res.json({
      success: true,
      message: 'Empresa actualizada exitosamente',
      data: updated,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
