/**
 * @file export.controller.js
 * @description Norma ERP - Controlador de Exportación de Datos
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import exportService from './export.service.js';

export class ExportController {
  async exportEmployees(req, res) {
    try {
      const csv = await exportService.buildEmployeesCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=lista_empleados.csv');
      res.send(csv);
    } catch (error) {
      console.error('EXPORT_EMPLOYEES_ERROR:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error al exportar empleados: ' + error.message });
    }
  }

  async exportPayrollCSV(req, res) {
    try {
      const { id } = req.params;
      const csv = await exportService.buildPayrollCsv(id);

      if (!csv) {
        return res.status(404).json({ message: 'No hay datos para esta nomina' });
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=nomina_${id}.csv`);
      res.send(csv);
    } catch (error) {
      console.error('EXPORT_PAYROLL_CSV_ERROR:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error al exportar CSV de nomina: ' + error.message });
    }
  }

  async exportPayStubPDF(req, res) {
    return res.status(501).json({
      success: false,
      message:
        'La exportacion de rol de pago en PDF no esta disponible en este entorno. Use la vista de impresion del navegador.',
    });
  }
}

export default new ExportController();

