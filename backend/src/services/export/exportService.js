import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

class ExportService {
    /**
     * Generates an Excel file from JSON data
     */
    async generateExcel(data, fileName, columns) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(fileName);

        worksheet.columns = columns.map(col => ({
            header: col.header,
            key: col.key,
            width: col.width || 20
        }));

        worksheet.addRows(data);

        // Styling the header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }

    /**
     * Generates a CSV file from JSON data
     */
    async generateCSV(data, fields) {
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);
        return csv;
    }

    /**
     * Generates a PDF pay stub for an employee
     */
    async generatePayStubPDF(payrollData) {
        try {
            const { employee, period, totalEarnings, totalDeductions, netSalary, details } = payrollData;

            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.text('EMPLIFI - SISTEMA DE RECURSOS HUMANOS', 105, 20, { align: 'center' });
            doc.setFontSize(14);
            doc.text('ROL DE PAGOS INDIVIDUAL', 105, 30, { align: 'center' });

            // Employee Info
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('INFORMACIÓN DEL EMPLEADO:', 20, 45);
            doc.setFont(undefined, 'normal');
            doc.text(`Nombre: ${employee.firstName} ${employee.lastName}`, 20, 52);
            doc.text(`Cédula: ${employee.identityCard}`, 20, 57);
            doc.text(`Cargo: ${employee.position}`, 20, 62);
            doc.text(`Departamento: ${employee.department}`, 20, 67);
            fs.appendFileSync('debug_jspdf.log', 'Employee Info done\n');

            // Period Info
            doc.setFont(undefined, 'bold');
            doc.text('PERIODO DE PAGO:', 120, 45);
            doc.setFont(undefined, 'normal');
            doc.text(`Mes: ${period.month}`, 120, 52);
            doc.text(`Año: ${period.year}`, 120, 57);
            fs.appendFileSync('debug_jspdf.log', 'Period Info done\n');

            // Table of details (Earnings and Deductions)
            const tableData = details.map(item => [
                item.description,
                item.type === 'earning' ? `$${item.amount.toFixed(2)}` : '',
                item.type === 'deduction' ? `$${item.amount.toFixed(2)}` : ''
            ]);

            fs.appendFileSync('debug_jspdf.log', 'Starting autoTable\n');
            autoTable(doc, {
                startY: 75,
                head: [['Descripción', 'Ingresos', 'Egresos']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [63, 81, 181] }
            });
            fs.appendFileSync('debug_jspdf.log', 'autoTable done\n');

            const finalY = (doc.lastAutoTable?.finalY || 80) + 10;

            // Totals
            doc.setFont(undefined, 'bold');
            doc.text(`TOTAL INGRESOS: $${totalEarnings.toFixed(2)}`, 140, finalY);
            doc.text(`TOTAL EGRESOS: $${totalDeductions.toFixed(2)}`, 140, finalY + 7);
            doc.setFontSize(12);
            doc.text(`NETO A RECIBIR: $${netSalary.toFixed(2)}`, 140, finalY + 17);
            fs.appendFileSync('debug_jspdf.log', 'Totals done\n');

            // Footer
            doc.setFontSize(8);
            doc.setFont(undefined, 'italic');
            doc.text('Este documento es un comprobante de pago electrónico generado por EMPLIFI.', 105, 280, { align: 'center' });
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
