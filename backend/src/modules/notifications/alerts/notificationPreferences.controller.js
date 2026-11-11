/**
 * @file notificationPreferences.controller.js
 * @description Norma ERP - Controlador de Preferencias de Canales de Notificación
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import notificationService from './notification.service.js';

export const getPreferences = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId || req.user?.id;
    if (!employeeId) {
      return res.status(401).json({ message: 'Usuario no identificado' });
    }

    const prefs = await notificationService.getPreferences(employeeId);
    res.json(prefs);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ message: 'Error al obtener preferencias de notificación' });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId || req.user?.id;
    const tenantId = req.tenantId || req.user?.tenantId;
    const { preferences } = req.body;

    if (!employeeId) {
      return res.status(401).json({ message: 'Usuario no identificado' });
    }

    const prefs = await notificationService.updatePreferences(employeeId, preferences, tenantId);
    res.json({
      success: true,
      message: 'Preferencias guardadas exitosamente',
      data: prefs,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error al guardar preferencias de notificación' });
  }
};
