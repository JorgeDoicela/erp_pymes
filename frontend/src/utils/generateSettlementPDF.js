import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateSettlementPDF = (settlementData) => {
    const doc = new jsPDF();

    const {
        employee,
        exitDate,
        causal,
        daysWorkedTotal,
        yearsWorked,
        baseSalary,
        thirteenthProportional,
        fourteenthProportional,
        pendingVacationDays,
        vacationAmount,
        desahucioAmount,
        severanceAmount,
        totalSettlement
    } = settlementData;

    // Header
    doc.setFontSize(18);
    doc.setTextColor(30);
    doc.text("EMPLIFI S.A. - DEPARTAMENTO DE RRHH", 105, 20, null, null, "center");

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ACTA DE FINIQUITO Y LIQUIDACIÓN LEGAL", 105, 28, null, null, "center");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-EC')}`, 105, 34, null, null, "center");

    doc.setLineWidth(0.5);
    doc.line(15, 38, 195, 38);

    // Employee & Contract Box
    let currentY = 46;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("1. DATOS GENERALES DEL TRABAJADOR Y CONTRATO", 15, currentY);

    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Trabajador: ${employee.firstName} ${employee.lastName}`, 15, currentY);
    doc.text(`Cédula / DNI: ${employee.identityCard}`, 120, currentY);

    currentY += 6;
    doc.text(`Departamento: ${employee.department || 'General'}`, 15, currentY);
    doc.text(`Cargo: ${employee.position || 'N/A'}`, 120, currentY);

    currentY += 6;
    const startDateStr = new Date(employee.startDate).toLocaleDateString('es-EC');
    const exitDateStr = new Date(exitDate).toLocaleDateString('es-EC');
    doc.text(`Fecha de Ingreso: ${startDateStr}`, 15, currentY);
    doc.text(`Fecha de Salida: ${exitDateStr}`, 120, currentY);

    currentY += 6;
    doc.text(`Tiempo de Servicio: ${yearsWorked} años (${daysWorkedTotal} días)`, 15, currentY);
    doc.text(`Sueldo Base Mensual: $${baseSalary.toFixed(2)}`, 120, currentY);

    const causalMap = {
        'VOLUNTARY_RESIGNATION': 'Renuncia Voluntaria del Trabajador',
        'UNFAIR_DISMISSAL': 'Despido Intempestivo (Art. 188)',
        'CONTRACT_END': 'Terminación de Contrato por Plazo',
        'JUST_CAUSE': 'Visto Bueno / Causa Justa'
    };

    currentY += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Causal de Desvinculación: ${causalMap[causal] || causal}`, 15, currentY);

    // Breakdown Table
    currentY += 10;
    doc.setFontSize(10);
    doc.text("2. DESGLOSE DE HABERES Y LIQUIDACIÓN DE LEY", 15, currentY);

    const tableRows = [
        ["Décimo Tercero Proporcional (13er Sueldo)", `$${thirteenthProportional.toFixed(2)}`],
        ["Décimo Cuarto Proporcional (14to Sueldo - SBU)", `$${fourteenthProportional.toFixed(2)}`],
        [`Vacaciones No Gozadas (${pendingVacationDays} días pend.)`, `$${vacationAmount.toFixed(2)}`],
        ["Bonificación por Desahucio (25% Art. 185)", `$${desahucioAmount.toFixed(2)}`],
        ["Indemnización por Despido Intempestivo (Art. 188)", `$${severanceAmount.toFixed(2)}`],
        ["TOTAL LIQUIDACIÓN A RECIBIR", `$${totalSettlement.toFixed(2)}`]
    ];

    autoTable(doc, {
        startY: currentY + 4,
        head: [['Concepto de Ley / Haberes', 'Monto a Favor ($)']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        footStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
        margin: { left: 15, right: 15 }
    });

    const finalY = doc.lastAutoTable.finalY + 12;

    // Declaration text
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const declaration = "El trabajador declara recibir a su entera satisfacción la suma total detallada en este documento por concepto de liquidación de haberes y beneficios legales, declarando que no tiene reclamo posterior que formular por ningún otro concepto de relación laboral.";
    const splitText = doc.splitTextToSize(declaration, 180);
    doc.text(splitText, 15, finalY);

    // Signatures
    const signY = finalY + 40;
    doc.setLineWidth(0.5);
    doc.line(25, signY, 85, signY);
    doc.line(125, signY, 185, signY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLIFI S.A. / EMPLEADOR", 55, signY + 5, null, null, "center");
    doc.text(`${employee.firstName} ${employee.lastName}`, 155, signY + 5, null, null, "center");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Representante Legal / RRHH", 55, signY + 10, null, null, "center");
    doc.text(`C.I. ${employee.identityCard} (Firma Conformidad)`, 155, signY + 10, null, null, "center");

    doc.save(`ActaFiniquito_${employee.lastName}_${new Date().toISOString().split('T')[0]}.pdf`);
};
