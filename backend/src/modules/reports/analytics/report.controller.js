/**
 * @file report.controller.js
 * @description Norma ERP - Controlador de Reportes Operativos
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import reportService from './report.service.js';

export class ReportController {
  async getAttendanceReport(req, res) {
    try {
      const { startDate, endDate, department, employeeId } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ success: false, message: 'Se requieren fechas de inicio y fin' });
      }

      const tenantId = req.tenantId || req.user?.tenantId;
      const report = await reportService.getAttendanceStats(
        startDate,
        endDate,
        department,
        employeeId,
        tenantId
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error generando reporte' });
    }
  }
}

export default new ReportController();
