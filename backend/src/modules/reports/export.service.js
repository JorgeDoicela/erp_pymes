/**
 * @file export.service.js
 * @description Norma ERP - Servicio de Exportación (Excel, CSV, PDF)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import reportRepository from './report.repository.js';
import { safeDecrypt } from '../../utils/encryption.js';

const escapeCsvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const buildCsvWithBom = (headers, rows) => {
  const headerLine = headers.map((h) => escapeCsvCell(h)).join(',');
  const bodyLines = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(','));
  return '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');
};

export class ExportService {
  async buildEmployeesCsv() {
    const employees = await reportRepository.findEmployeesForExport();
    const headers = [
      'Cedula',
      'Nombre',
      'Apellido',
      'Correo',
      'Cargo',
      'Departamento',
      'Fecha Ingreso',
      'Estado',
      'Salario Base',
      'Banco',
      'N Cuenta',
    ];

    const rows = employees.map((emp) => [
      emp.identityCard,
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.position,
      emp.department,
      emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('es-EC') : '',
      emp.isActive ? 'Activo' : 'Inactivo',
      emp.contracts?.[0]?.salary ?? '',
      safeDecrypt(emp.bankName) ?? 'No registrado',
      safeDecrypt(emp.accountNumber) ?? 'No registrado',
    ]);

    return buildCsvWithBom(headers, rows);
  }

  async buildPayrollCsv(payrollId) {
    const payroll = await reportRepository.findPayrollDetailsForExport(payrollId);
    if (!payroll.length) return null;

    const headers = ['Cedula', 'Nombre', 'Cuenta', 'Banco', 'Monto', 'Concepto'];
    const rows = payroll.map((p) => {
      const bank = safeDecrypt(p.employee.bankName) ?? 'No registrado';
      const account = safeDecrypt(p.employee.accountNumber) ?? 'No registrado';
      const period = new Date(p.payroll.period);
      return [
        p.employee.identityCard,
        `${p.employee.firstName} ${p.employee.lastName}`,
        account,
        bank,
        Number(p.netSalary).toFixed(2),
        `Pago Nomina ${period.getMonth() + 1}/${period.getFullYear()}`,
      ];
    });

    return buildCsvWithBom(headers, rows);
  }

  /**
   * Generates an Excel file from JSON data.
   */
  async generateExcel(data, fileName, columns) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(fileName);

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20,
    }));

    worksheet.addRows(data);

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Generates a CSV file from JSON data.
   */
  async generateCSV(data, fields) {
    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(data);
  }

  /**
   * Generates a PDF pay stub for an employee.
   */
  async generatePayStubPDF(payrollData) {
    try {
      const { employee, period, totalEarnings, totalDeductions, netSalary, details } = payrollData;

      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text('NORMA ERP - PLATAFORMA ERP PARA PYMES', 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text('ROL DE PAGOS INDIVIDUAL', 105, 30, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('INFORMACIÓN DEL EMPLEADO:', 20, 45);
      doc.setFont(undefined, 'normal');
      doc.text(`Nombre: ${employee.firstName} ${employee.lastName}`, 20, 52);
      doc.text(`Cédula: ${employee.identityCard}`, 20, 57);
      doc.text(`Cargo: ${employee.position}`, 20, 62);
      doc.text(`Departamento: ${employee.department}`, 20, 67);

      doc.setFont(undefined, 'bold');
      doc.text('PERIODO DE PAGO:', 120, 45);
      doc.setFont(undefined, 'normal');
      doc.text(`Mes: ${period.month}`, 120, 52);
      doc.text(`Año: ${period.year}`, 120, 57);

      const tableData = details.map((item) => [
        item.description,
        item.type === 'earning' ? `$${item.amount.toFixed(2)}` : '',
        item.type === 'deduction' ? `$${item.amount.toFixed(2)}` : '',
      ]);

      autoTable(doc, {
        startY: 75,
        head: [['Descripción', 'Ingresos', 'Egresos']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] },
      });

      const finalY = (doc.lastAutoTable?.finalY || 80) + 10;

      doc.setFont(undefined, 'bold');
      doc.text(`TOTAL INGRESOS: $${totalEarnings.toFixed(2)}`, 140, finalY);
      doc.text(`TOTAL EGRESOS: $${totalDeductions.toFixed(2)}`, 140, finalY + 7);
      doc.setFontSize(12);
      doc.text(`NETO A RECIBIR: $${netSalary.toFixed(2)}`, 140, finalY + 17);

      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.text(
        'Este documento es un comprobante de pago electrónico generado por NORMA ERP.',
        105,
        280,
        { align: 'center' }
      );
      const output = doc.output();
      if (!output) throw new Error('Falló la generación del contenido del PDF');

      return Buffer.from(output, 'binary');
    } catch (error) {
      console.error('ERROR_IN_GENERATE_PAY_STUB_PDF:', error);
      throw error;
    }
  }
}

export default new ExportService();

