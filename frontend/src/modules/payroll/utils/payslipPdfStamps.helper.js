/**
 * @file payslipPdfStamps.helper.js
 * @description Bloques de sellos electrónicos, firmas manuscritas y códigos QR para el PDF de Rol de Pagos.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export const renderPhysicalSignatureStamps = ({
  doc,
  signY,
  qrImage,
  verificationCode,
  companyName,
  employee,
}) => {
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(15, signY, 56, 32, 1.5, 1.5, 'FD');

  if (qrImage) {
    try {
      doc.addImage(qrImage, 'PNG', 17, signY + 3.5, 25, 25);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('REGISTRO FÍSICO', 44, signY + 7);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Código de Emisión:', 44, signY + 11);

      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(verificationCode, 44, signY + 15);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Escanear para verificar', 44, signY + 20);
      doc.text('cálculos en sistema.', 44, signY + 23.5);
    } catch (e) {
      console.error(e);
    }
  }

  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.5);
  doc.line(77, signY + 24, 132, signY + 24);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('Empleador / RRHH', 104.5, signY + 28.5, null, null, 'center');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(companyName, 104.5, signY + 32.5, null, null, 'center');
  doc.text('(Firma Manuscrita y Sello)', 104.5, signY + 36, null, null, 'center');

  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.5);
  doc.line(139, signY + 24, 195, signY + 24);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('Colaborador (Conformidad)', 167, signY + 28.5, null, null, 'center');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`${employee.firstName} ${employee.lastName}`, 167, signY + 32.5, null, null, 'center');
  doc.text(`C.I. ${employee.identityCard || 'S/N'}`, 167, signY + 36, null, null, 'center');
};

const renderDigitalEmployeeStamp = ({ doc, signY, isSigned, employee, detail }) => {
  if (isSigned) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(139, signY, 56, 24, 1.5, 1.5, 'FD');

    doc.setFillColor(220, 252, 231);
    doc.roundedRect(139, signY, 56, 5.5, 1.5, 1.5, 'F');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text('[ FIRMADO ELECTRÓNICAMENTE ]', 167, signY + 4, null, null, 'center');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59);
    doc.text(
      `${employee.firstName} ${employee.lastName}`.toUpperCase(),
      167,
      signY + 9.5,
      null,
      null,
      'center'
    );

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`C.I.: ${employee.identityCard || 'S/N'}`, 167, signY + 13.5, null, null, 'center');

    const signDateStr = detail.signedAt
      ? new Date(detail.signedAt).toLocaleDateString('es-EC')
      : new Date().toLocaleDateString('es-EC');
    doc.text(`Fecha: ${signDateStr}`, 167, signY + 17, null, null, 'center');

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('Conformidad Registrada', 167, signY + 21, null, null, 'center');

    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.4);
    doc.line(139, signY + 27, 195, signY + 27);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('Colaborador (Conformidad)', 167, signY + 31, null, null, 'center');

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 101, 52);
    doc.text(`Firmado: ${signDateStr}`, 167, signY + 34.5, null, null, 'center');
    return;
  }

  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.4);
  doc.line(139, signY + 22, 195, signY + 22);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('Colaborador (Conformidad)', 167, signY + 26.5, null, null, 'center');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 83, 9);
  doc.text('(Pendiente de Firma Digital)', 167, signY + 30.5, null, null, 'center');

  doc.setFontSize(5.5);
  doc.setTextColor(107, 114, 128);
  doc.text(`C.I. ${employee.identityCard || 'S/N'}`, 167, signY + 34, null, null, 'center');
};

export const renderDigitalSignatureStamps = ({
  doc,
  signY,
  qrImage,
  verificationCode,
  companyName,
  companyRuc,
  employee,
  detail,
  isSigned,
}) => {
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(15, signY, 56, 32, 1.5, 1.5, 'FD');

  if (qrImage) {
    try {
      doc.addImage(qrImage, 'PNG', 17, signY + 3.5, 25, 25);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('SELLO OFICIAL', 44, signY + 7);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Código Verificación:', 44, signY + 11);

      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(verificationCode, 44, signY + 15);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Escanear QR para', 44, signY + 20);
      doc.text('validar autenticidad.', 44, signY + 23.5);
    } catch (e) {
      console.error('Error embedding QR in PDF:', e);
    }
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(77, signY, 55, 24, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(77, signY, 55, 5.5, 1.5, 1.5, 'F');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('[ FIRMADO ELECTRÓNICAMENTE ]', 104.5, signY + 4, null, null, 'center');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(companyName.toUpperCase(), 104.5, signY + 9.5, null, null, 'center');

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Dpto. Talento Humano y Nómina', 104.5, signY + 13.5, null, null, 'center');
  doc.text(`RUC: ${companyRuc}`, 104.5, signY + 17, null, null, 'center');

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Emisión y Pago Autorizado', 104.5, signY + 21, null, null, 'center');

  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.4);
  doc.line(77, signY + 27, 132, signY + 27);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('Empleador / RRHH', 104.5, signY + 31, null, null, 'center');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Razón Social Emisora', 104.5, signY + 34.5, null, null, 'center');

  renderDigitalEmployeeStamp({ doc, signY, isSigned, employee, detail });
};
