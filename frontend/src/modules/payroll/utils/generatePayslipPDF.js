/**
 * @file generatePayslipPDF.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  renderDigitalSignatureStamps,
  renderPhysicalSignatureStamps,
} from './payslipPdfStamps.helper';

const parseJSON = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
};

const renderEmployeeHeaderBlock = (
  doc,
  employee,
  detail,
  companyName,
  isPhysicalPrint,
  periodStr
) => {
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(companyName.toUpperCase(), 105, 18, null, null, 'center');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(
    isPhysicalPrint
      ? 'ROL INDIVIDUAL DE PAGOS — COMPROBANTE DE PAGO FÍSICO'
      : 'ROL INDIVIDUAL DE PAGOS Y BENEFICIOS DE LEY',
    105,
    24,
    null,
    null,
    'center'
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(`PERÍODO: ${periodStr.toUpperCase()}`, 105, 30, null, null, 'center');

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, 34, 195, 34);

  const leftX = 15;
  const rightX = 110;
  let currentY = 41;

  const drawPair = (labelL, valL, labelR, valR) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(labelL, leftX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(valL, leftX + 22, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(labelR, rightX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(valR, rightX + 20, currentY);
    currentY += 6;
  };

  drawPair(
    'Colaborador:',
    `${employee.firstName} ${employee.lastName}`,
    'Cédula / ID:',
    `${employee.identityCard || 'S/N'}`
  );
  drawPair(
    'Departamento:',
    `${employee.department || 'General'}`,
    'Cargo:',
    `${employee.position || 'Colaborador'}`
  );
  drawPair(
    'Sueldo Base:',
    `$${Number(detail.baseSalary || 0).toFixed(2)} USD`,
    'Días Base:',
    `${detail.workedDays || 30} días`
  );
};

const renderBreakdownTables = (doc, detail) => {
  const bonuses = parseJSON(detail.bonuses);
  const deductions = parseJSON(detail.deductions);

  const earningsData = [
    ['Sueldo Ganado', Number(detail.baseSalary || 0).toFixed(2)],
    ['Horas Extras', Number(detail.overtimeAmount || 0).toFixed(2)],
    ...bonuses.map((b) => [b.name || b.concept || 'Bono', Number(b.amount || 0).toFixed(2)]),
  ];
  const deductionsData = deductions.map((d) => [
    d.name || d.concept || 'Deducción',
    Number(d.amount || 0).toFixed(2),
  ]);

  const totalEarnings = earningsData.reduce((sum, row) => sum + parseFloat(row[1] || 0), 0);
  const totalDeductions = deductionsData.reduce((sum, row) => sum + parseFloat(row[1] || 0), 0);

  const tableBaseOpts = {
    startY: 67,
    head: [['Concepto', 'Monto (USD)']],
    theme: 'plain',
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 24, 39],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2.5,
    },
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [55, 65, 81] },
    columnStyles: { 0: { cellWidth: 55 }, 1: { halign: 'right', cellWidth: 30 } },
  };

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('1. INGRESOS Y BENEFICIOS', 15, 64);
  autoTable(doc, {
    ...tableBaseOpts,
    body: [...earningsData, ['TOTAL INGRESOS', `$${totalEarnings.toFixed(2)}`]],
    margin: { left: 15, width: 85 },
  });
  const earningsFinalY = doc.lastAutoTable.finalY;

  doc.text('2. DEDUCCIONES Y RETENCIONES', 110, 64);
  autoTable(doc, {
    ...tableBaseOpts,
    body: [...deductionsData, ['TOTAL DEDUCCIONES', `$${totalDeductions.toFixed(2)}`]],
    margin: { left: 110, width: 85 },
  });
  return Math.max(earningsFinalY, doc.lastAutoTable.finalY);
};

export const generatePayslipPDF = async (detail, employee, periodDate, options = {}) => {
  const { isPhysicalPrint = false } = options;
  const doc = new jsPDF();

  const companyName = employee?.tenant?.name || employee?.companyName || 'NORMA S.A.';
  const companyRuc = employee?.tenant?.ruc || '1792345678001';
  const periodStr = new Date(periodDate).toLocaleDateString('es-EC', {
    month: 'long',
    year: 'numeric',
  });

  renderEmployeeHeaderBlock(doc, employee, detail, companyName, isPhysicalPrint, periodStr);
  const tableBottomY = renderBreakdownTables(doc, detail);

  const netBoxY = tableBottomY + 6;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, netBoxY, 180, 13, 1, 1, 'FD');

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59);
  doc.text('LÍQUIDO A RECIBIR (USD):', 22, netBoxY + 8.5);
  doc.setFontSize(12);
  doc.text(`$${Number(detail.netSalary || 0).toFixed(2)}`, 160, netBoxY + 8.5);

  let sigInfo = {};
  try {
    sigInfo =
      typeof detail.signatureData === 'string'
        ? JSON.parse(detail.signatureData || '{}')
        : detail.signatureData || {};
  } catch {
    sigInfo = {};
  }

  const verificationCode =
    detail.signatureCode || `VAL-${detail.id ? detail.id.slice(-6).toUpperCase() : 'EC'}`;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://normaerp.ec';
  const verificationUrl =
    sigInfo.verificationUrl ||
    `${baseUrl}/signatures/verify/${detail.signatureToken || verificationCode}`;

  let qrImage = sigInfo.qrDataUrl;
  if (!qrImage) {
    try {
      const QRCodeModule = await import('qrcode');
      const QRCode = QRCodeModule.default || QRCodeModule;
      qrImage = await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 200,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    } catch (e) {
      console.error('Error generando QR para el PDF:', e);
    }
  }

  const signY = netBoxY + 22;
  if (isPhysicalPrint) {
    renderPhysicalSignatureStamps({
      doc,
      signY,
      qrImage,
      verificationCode,
      companyName,
      employee,
    });
  } else {
    renderDigitalSignatureStamps({
      doc,
      signY,
      qrImage,
      verificationCode,
      companyName,
      companyRuc,
      employee,
      detail,
      isSigned: detail.signatureStatus === 'SIGNED',
    });
  }

  doc.setFontSize(6.5);
  doc.setTextColor(156, 163, 175);
  doc.text(
    'Documento oficial con validez jurídica según Art. 14 del Código del Trabajo y Ley de Comercio Electrónico y Firmas Digitales del Ecuador.',
    105,
    287,
    null,
    null,
    'center'
  );

  const fileSuffix = isPhysicalPrint ? 'ParaFirmaFisica' : 'Digital';
  doc.save(`RolPago_${periodStr.replace(/\s+/g, '_')}_${employee.lastName}_${fileSuffix}.pdf`);
};
