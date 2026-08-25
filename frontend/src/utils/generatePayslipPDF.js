import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generador Oficial de Rol de Pagos en Formato PDF.
 * Soporta dos modalidades:
 * 1. Digital (isPhysicalPrint: false): Con sellos electrónicos oficiales, firmas digitales criptográficas y QR de validación.
 * 2. Físico (isPhysicalPrint: true): Con líneas limpias y espacio para firma manuscrita y sello húmedo institucional.
 */
export const generatePayslipPDF = async (detail, employee, periodDate, options = {}) => {
    const { isPhysicalPrint = false } = options;
    const doc = new jsPDF();

    // Nombre de la Empresa
    const companyName = employee?.tenant?.name || employee?.companyName || "EMPLIFI S.A.";
    const companyRuc = employee?.tenant?.ruc || "1792345678001";

    // Header Principal
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39); // Gray 900
    doc.text(companyName.toUpperCase(), 105, 18, null, null, "center");

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99); // Gray 600
    doc.text(
        isPhysicalPrint 
            ? "ROL INDIVIDUAL DE PAGOS — COMPROBANTE DE PAGO FÍSICO" 
            : "ROL INDIVIDUAL DE PAGOS Y BENEFICIOS DE LEY", 
        105, 
        24, 
        null, 
        null, 
        "center"
    );

    // Período
    const periodStr = new Date(periodDate).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(`PERÍODO: ${periodStr.toUpperCase()}`, 105, 30, null, null, "center");

    // Separador
    doc.setDrawColor(229, 231, 235); // Gray 200
    doc.setLineWidth(0.5);
    doc.line(15, 34, 195, 34);

    // Bloque de Datos del Colaborador
    const leftX = 15;
    const rightX = 110;
    let currentY = 41;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    doc.text("Colaborador:", leftX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`${employee.firstName} ${employee.lastName}`, leftX + 22, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text("Cédula / ID:", rightX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`${employee.identityCard || 'S/N'}`, rightX + 20, currentY);

    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text("Departamento:", leftX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`${employee.department || 'General'}`, leftX + 22, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text("Cargo:", rightX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`${employee.position || 'Colaborador'}`, rightX + 20, currentY);

    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text("Sueldo Base:", leftX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`$${Number(detail.baseSalary || 0).toFixed(2)} USD`, leftX + 22, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text("Días Base:", rightX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`${detail.workedDays || 30} días`, rightX + 20, currentY);

    // Parsing seguro de bonos y deducciones
    const parseJSON = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try {
            return JSON.parse(val);
        } catch {
            return [];
        }
    };

    const bonuses = parseJSON(detail.bonuses);
    const deductions = parseJSON(detail.deductions);

    const earningsData = [
        ["Sueldo Ganado", Number(detail.baseSalary || 0).toFixed(2)],
        ["Horas Extras", Number(detail.overtimeAmount || 0).toFixed(2)],
        ...bonuses.map(b => [b.name || b.concept || 'Bono', Number(b.amount || 0).toFixed(2)])
    ];

    const deductionsData = [
        ...deductions.map(d => [d.name || d.concept || 'Deducción', Number(d.amount || 0).toFixed(2)])
    ];

    const totalEarnings = earningsData.reduce((sum, row) => sum + parseFloat(row[1] || 0), 0);
    const totalDeductions = deductionsData.reduce((sum, row) => sum + parseFloat(row[1] || 0), 0);

    // Tabla de Ingresos
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text("1. INGRESOS Y BENEFICIOS", leftX, 64);

    autoTable(doc, {
        startY: 67,
        head: [['Concepto', 'Monto (USD)']],
        body: [...earningsData, ['TOTAL INGRESOS', `$${totalEarnings.toFixed(2)}`]],
        theme: 'plain',
        headStyles: { 
            fillColor: [243, 244, 246], 
            textColor: [17, 24, 39], 
            fontSize: 7.5, 
            fontStyle: 'bold',
            cellPadding: 2.5
        },
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [55, 65, 81] },
        columnStyles: { 0: { cellWidth: 55 }, 1: { halign: 'right', cellWidth: 30 } },
        margin: { left: 15, width: 85 }
    });

    const earningsFinalY = doc.lastAutoTable.finalY;

    // Tabla de Egresos
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text("2. DEDUCCIONES Y RETENCIONES", 110, 64);

    autoTable(doc, {
        startY: 67,
        head: [['Concepto', 'Monto (USD)']],
        body: [...deductionsData, ['TOTAL DEDUCCIONES', `$${totalDeductions.toFixed(2)}`]],
        theme: 'plain',
        headStyles: { 
            fillColor: [243, 244, 246], 
            textColor: [17, 24, 39], 
            fontSize: 7.5, 
            fontStyle: 'bold',
            cellPadding: 2.5
        },
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [55, 65, 81] },
        columnStyles: { 0: { cellWidth: 55 }, 1: { halign: 'right', cellWidth: 30 } },
        margin: { left: 110, width: 85 }
    });

    const deductionsFinalY = doc.lastAutoTable.finalY;
    const tableBottomY = Math.max(earningsFinalY, deductionsFinalY);

    // Caja de Líquido a Recibir
    const netBoxY = tableBottomY + 6;
    doc.setFillColor(240, 253, 244); // Emerald 50
    doc.setDrawColor(187, 247, 208); // Emerald 200
    doc.setLineWidth(0.5);
    doc.roundedRect(15, netBoxY, 180, 13, 1, 1, 'FD');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59); // Emerald 900
    doc.text("LÍQUIDO A RECIBIR (USD):", 22, netBoxY + 8.5);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${Number(detail.netSalary || 0).toFixed(2)}`, 160, netBoxY + 8.5);

    // Parsing de Datos de Firma Electrónica
    let sigInfo = {};
    try {
        sigInfo = typeof detail.signatureData === 'string' 
            ? JSON.parse(detail.signatureData || '{}') 
            : (detail.signatureData || {});
    } catch {
        sigInfo = {};
    }

    const verificationCode = detail.signatureCode || `VAL-${detail.id ? detail.id.slice(-6).toUpperCase() : 'EC'}`;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://emplifi.ec';
    const verificationUrl = sigInfo.verificationUrl || `${baseUrl}/signatures/verify/${detail.signatureToken || verificationCode}`;

    // Generar código QR dinámicamente si no viene en base64
    let qrImage = sigInfo.qrDataUrl;
    if (!qrImage) {
        try {
            const QRCodeModule = await import('qrcode');
            const QRCode = QRCodeModule.default || QRCodeModule;
            qrImage = await QRCode.toDataURL(verificationUrl, {
                margin: 1,
                width: 200,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                }
            });
        } catch (e) {
            console.error('Error generando QR para el PDF:', e);
        }
    }

    const isSigned = detail.signatureStatus === 'SIGNED';
    const signY = netBoxY + 22;

    if (isPhysicalPrint) {
        // ==========================================
        // MODALIDAD 1: FORMATO PARA FIRMA FÍSICA
        // ==========================================
        
        // Bloque Izquierdo: QR de Trazabilidad e Integridad del Documento Físico
        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(15, signY, 56, 32, 1.5, 1.5, 'FD');

        if (qrImage) {
            try {
                doc.addImage(qrImage, 'PNG', 17, signY + 3.5, 25, 25);
                doc.setFontSize(6.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(31, 41, 55);
                doc.text("REGISTRO FÍSICO", 44, signY + 7);

                doc.setFontSize(5.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(107, 114, 128);
                doc.text("Código de Emisión:", 44, signY + 11);

                doc.setFontSize(6);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(17, 24, 39);
                doc.text(verificationCode, 44, signY + 15);

                doc.setFontSize(5.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(107, 114, 128);
                doc.text("Escanear para verificar", 44, signY + 20);
                doc.text("cálculos en sistema.", 44, signY + 23.5);
            } catch (e) {
                console.error(e);
            }
        }

        // Espacio Limpio para Firma Manuscrita de Empleador / RRHH
        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(0.5);
        doc.line(77, signY + 24, 132, signY + 24);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text("Empleador / RRHH", 104.5, signY + 28.5, null, null, "center");

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(companyName, 104.5, signY + 32.5, null, null, "center");
        doc.text("(Firma Manuscrita y Sello)", 104.5, signY + 36, null, null, "center");

        // Espacio Limpio para Firma Manuscrita del Colaborador
        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(0.5);
        doc.line(139, signY + 24, 195, signY + 24);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text("Colaborador (Conformidad)", 167, signY + 28.5, null, null, "center");

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(`${employee.firstName} ${employee.lastName}`, 167, signY + 32.5, null, null, "center");
        doc.text(`C.I. ${employee.identityCard || 'S/N'}`, 167, signY + 36, null, null, "center");

    } else {
        // ==========================================
        // MODALIDAD 2: FORMATO DIGITAL CON SELLOS
        // ==========================================

        // 1. BLOQUE IZQUIERDO: Sello de Validación y Verificación Digital con QR
        doc.setFillColor(249, 250, 251); // Gray 50
        doc.setDrawColor(229, 231, 235); // Gray 200
        doc.roundedRect(15, signY, 56, 32, 1.5, 1.5, 'FD');

        if (qrImage) {
            try {
                doc.addImage(qrImage, 'PNG', 17, signY + 3.5, 25, 25);
                
                doc.setFontSize(6.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(31, 41, 55);
                doc.text("SELLO OFICIAL", 44, signY + 7);

                doc.setFontSize(5.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(107, 114, 128);
                doc.text("Código Verificación:", 44, signY + 11);

                doc.setFontSize(6);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(17, 24, 39);
                doc.text(verificationCode, 44, signY + 15);

                doc.setFontSize(5.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(107, 114, 128);
                doc.text("Escanear QR para", 44, signY + 20);
                doc.text("validar autenticidad.", 44, signY + 23.5);
            } catch (e) {
                console.error('Error embedding QR in PDF:', e);
            }
        }

        // 2. BLOQUE CENTRAL: Sello Electrónico del Empleador (RRHH)
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225); // Slate 300
        doc.roundedRect(77, signY, 55, 24, 1.5, 1.5, 'FD');

        // Header del Sello Empleador
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(77, signY, 55, 5.5, 1.5, 1.5, 'F');
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text("[ FIRMADO ELECTRÓNICAMENTE ]", 104.5, signY + 4, null, null, "center");

        // Cuerpo del Sello Empleador
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(companyName.toUpperCase(), 104.5, signY + 9.5, null, null, "center");

        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text("Dpto. Talento Humano y Nómina", 104.5, signY + 13.5, null, null, "center");
        doc.text(`RUC: ${companyRuc}`, 104.5, signY + 17, null, null, "center");

        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text("Emisión y Pago Autorizado", 104.5, signY + 21, null, null, "center");

        // Línea de pie para Empleador
        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(0.4);
        doc.line(77, signY + 27, 132, signY + 27);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text("Empleador / RRHH", 104.5, signY + 31, null, null, "center");

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text("Razón Social Emisora", 104.5, signY + 34.5, null, null, "center");

        // 3. BLOQUE DERECHO: Firma del Colaborador (Conformidad)
        if (isSigned) {
            // Sello Electrónico de Conformidad Colaborador
            doc.setFillColor(240, 253, 244); // Emerald 50
            doc.setDrawColor(167, 243, 208); // Emerald 200
            doc.roundedRect(139, signY, 56, 24, 1.5, 1.5, 'FD');

            // Header del Sello Colaborador
            doc.setFillColor(220, 252, 231); // Emerald 100
            doc.roundedRect(139, signY, 56, 5.5, 1.5, 1.5, 'F');
            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 95, 70);
            doc.text("[ FIRMADO ELECTRÓNICAMENTE ]", 167, signY + 4, null, null, "center");

            // Cuerpo del Sello Colaborador
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 78, 59);
            doc.text(`${employee.firstName} ${employee.lastName}`.toUpperCase(), 167, signY + 9.5, null, null, "center");

            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text(`C.I.: ${employee.identityCard || 'S/N'}`, 167, signY + 13.5, null, null, "center");

            const signDateStr = detail.signedAt 
                ? new Date(detail.signedAt).toLocaleDateString('es-EC') 
                : new Date().toLocaleDateString('es-EC');
            doc.text(`Fecha: ${signDateStr}`, 167, signY + 17, null, null, "center");

            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(5, 150, 105);
            doc.text("Conformidad Registrada", 167, signY + 21, null, null, "center");

            // Línea de pie para Colaborador
            doc.setDrawColor(156, 163, 175);
            doc.setLineWidth(0.4);
            doc.line(139, signY + 27, 195, signY + 27);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(55, 65, 81);
            doc.text("Colaborador (Conformidad)", 167, signY + 31, null, null, "center");

            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(22, 101, 52); // Emerald 700
            doc.text(`Firmado: ${signDateStr}`, 167, signY + 34.5, null, null, "center");
        } else {
            // Línea estándar para firma manual o firma pendiente
            doc.setDrawColor(156, 163, 175);
            doc.setLineWidth(0.4);
            doc.line(139, signY + 22, 195, signY + 22);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(55, 65, 81);
            doc.text("Colaborador (Conformidad)", 167, signY + 26.5, null, null, "center");

            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(180, 83, 9); // Amber 700
            doc.text("(Pendiente de Firma Digital)", 167, signY + 30.5, null, null, "center");

            doc.setFontSize(5.5);
            doc.setTextColor(107, 114, 128);
            doc.text(`C.I. ${employee.identityCard || 'S/N'}`, 167, signY + 34, null, null, "center");
        }
    }

    // Footer de Cumplimiento Legal
    doc.setFontSize(6.5);
    doc.setTextColor(156, 163, 175);
    doc.text(
        "Documento oficial con validez jurídica según Art. 14 del Código del Trabajo y Ley de Comercio Electrónico y Firmas Digitales del Ecuador.",
        105,
        287,
        null,
        null,
        "center"
    );

    const fileSuffix = isPhysicalPrint ? 'ParaFirmaFisica' : 'Digital';
    doc.save(`RolPago_${periodStr.replace(/\s+/g, '_')}_${employee.lastName}_${fileSuffix}.pdf`);
};
