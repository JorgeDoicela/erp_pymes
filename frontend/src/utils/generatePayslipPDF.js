import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePayslipPDF = (detail, employee, periodDate) => {
    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("EMPLIFI S.A.", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.text("Rol de Pagos Individual", 105, 28, null, null, "center");

    // Period Info
    const periodStr = new Date(periodDate).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
    doc.setFontSize(10);
    doc.text(`Período: ${periodStr.toUpperCase()}`, 105, 35, null, null, "center");

    // Line
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);

    // Employee Info Box
    doc.setFontSize(10);
    const leftX = 15;
    const rightX = 110;
    let currentY = 50;

    doc.text(`Nombre: ${employee.firstName} ${employee.lastName}`, leftX, currentY);
    doc.text(`Cédula: ${employee.identityCard}`, rightX, currentY);

    currentY += 8;
    doc.text(`Departamento: ${employee.department}`, leftX, currentY);
    doc.text(`Cargo: ${employee.position}`, rightX, currentY);

    currentY += 8;
    doc.text(`Sueldo Base: $${detail.baseSalary.toFixed(2)}`, leftX, currentY);
    doc.text(`Días Trabajados: ${detail.workedDays}`, rightX, currentY);

    // Parse items
    const bonuses = JSON.parse(detail.bonuses || '[]');
    const deductions = JSON.parse(detail.deductions || '[]');

    // Tables
    const earningsData = [
        ["Sueldo Ganado", detail.workedDays < 30 ? ((detail.baseSalary / 30) * detail.workedDays).toFixed(2) : detail.baseSalary.toFixed(2)],
        ["Horas Extra", detail.overtimeAmount.toFixed(2)],
        ...bonuses.map(b => [b.name, b.amount.toFixed(2)])
    ];

    const deductionsData = [
        ...deductions.map(d => [d.name, d.amount.toFixed(2)])
    ];

    let totalEarnings = earningsData.reduce((sum, row) => sum + parseFloat(row[1]), 0);
    let totalDeductions = deductionsData.reduce((sum, row) => sum + parseFloat(row[1]), 0);

    // Earnings Table
    doc.setFontSize(11);
    doc.text("Ingresos", leftX, 80);

    autoTable(doc, {
        startY: 85,
        head: [['Concepto', 'Monto']],
        body: [...earningsData, ['TOTAL INGRESOS', totalEarnings.toFixed(2)]],
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] }, // Emerald Green
        margin: { left: 15, width: 85 }
    });

    // Deductions Table (Right side relative to earnings, or below if simple)
    // Let's put it below? No, side-by-side looks more like real payslip.
    // autotable doesn't support easy float. Let's do sequential for simplicity or use margin to push right.

    const finalY = doc.lastAutoTable.finalY;

    doc.text("Egresos", 110, 80);

    autoTable(doc, {
        startY: 85,
        head: [['Concepto', 'Monto']],
        body: [...deductionsData, ['TOTAL EGRESOS', totalDeductions.toFixed(2)]],
        theme: 'striped',
        headStyles: { fillColor: [231, 76, 60] }, // Red
        margin: { left: 110, width: 85 }
    });

    // Net Total
    const maxY = Math.max(doc.lastAutoTable.finalY, finalY);

    doc.setFillColor(240, 240, 240);
    doc.rect(15, maxY + 10, 180, 15, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Líquido a Recibir:", 20, maxY + 20);
    doc.text(`$${detail.netSalary.toFixed(2)}`, 160, maxY + 20);

    // Signatures
    const signY = maxY + 60;
    doc.setLineWidth(0.5);
    doc.line(30, signY, 90, signY);
    doc.line(120, signY, 180, signY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    doc.text("Empleador / RRHH", 60, signY + 5, null, null, "center");
    doc.text("Empleado (Conformidad)", 150, signY + 5, null, null, "center");

    // Footer
    doc.setFontSize(8);
    doc.text("Generado por Sistema EMPLIFI", 105, 290, null, null, "center");

    doc.save(`RolPago_${periodStr}_${employee.lastName}.pdf`);
};
