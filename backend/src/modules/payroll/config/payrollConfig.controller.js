/**
 * @file payrollConfig.controller.js
 * @description Controlador HTTP para la configuración legal de nómina (Norma ERP).
 * Adaptador de entrada delgado protegido por asyncHandler.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import payrollConfigService from './payrollConfig.service.js';
import { asyncHandler } from '../../../core/utils/asyncHandler.js';

export class PayrollConfigController {
  getConfig = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const config = await payrollConfigService.getConfig(tenantId);
    res.status(200).json({ success: true, data: config });
  });

  createConfig = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const newConfig = await payrollConfigService.createConfig(req.body, tenantId);
    res
      .status(201)
      .json({ success: true, data: newConfig, message: 'Configuración guardada correctamente' });
  });
}

export default new PayrollConfigController();
