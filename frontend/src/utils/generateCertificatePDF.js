import jsPDF from 'jspdf';

export const generateCertificatePDF = (employeeData) => {
    const doc = new jsPDF();

    const {
        firstName = 'Empleado',
        lastName = '',
        identityCard = '0000000000',
        department = 'General',
        position = 'Colaborador',
        salary = 0,
        startDate = new Date()
    } = employeeData;

    const fullName = `${firstName} ${lastName}`.toUpperCase();
    const formattedStartDate = new Date(startDate).toLocaleDateString('es-EC', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const formattedTodayDate = new Date().toLocaleDateString('es-EC', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const verificationCode = `CERT-${identityCard}-${Date.now().toString(36).toUpperCase()}`;

    // Header Margins
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("EMPLIFI S.A.", 105, 25, null, null, "center");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("RUC: 1792884910001 • Departamento de Recursos Humanos", 105, 32, null, null, "center");
    doc.text("Quito, Ecuador • Contacto: rrhh@emplifi.com", 105, 37, null, null, "center");

    doc.setLineWidth(0.7);
    doc.setDrawColor(59, 130, 246);
    doc.line(20, 42, 190, 42);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("CERTIFICADO LABORAL", 105, 60, null, null, "center");

    // Body Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);

    let currentY = 80;

    const paragraph1 = `Por medio de la presente, EMPLIFI S.A. certifica que el/la Sr.(a) ${fullName}, con número de Cédula de Identidad / DNI Nº ${identityCard}, labora en nuestra institución de manera continua desde el ${formattedStartDate}.`;

    const paragraph2 = `En la actualidad, se desempeña en el cargo de ${position.toUpperCase()} dentro del departamento de ${department.toUpperCase()}, percibiendo una remuneración mensual bruta de USD $${Number(salary).toFixed(2)} (DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA).`;

    const paragraph3 = `Durante su permanencia en la empresa, ha demostrado ser una persona responsable, idónea, honesta y cumplidora de las tareas asignadas a su cargo.`;

    const paragraph4 = `Se expide el presente certificado a petición de la parte interesada para los fines legales y administrativos que al interesado convengan, en la ciudad de Quito, a los ${formattedTodayDate}.`;

    [paragraph1, paragraph2, paragraph3, paragraph4].forEach(p => {
        const splitText = doc.splitTextToSize(p, 170);
        doc.text(splitText, 20, currentY, { align: "justify", maxWidth: 170 });
        currentY += (splitText.length * 6) + 8;
    });

    // Signature Block
    currentY = Math.max(currentY + 10, 200);

    doc.setLineWidth(0.5);
    doc.setDrawColor(148, 163, 184);
    doc.line(70, currentY, 140, currentY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("GERENCIA DE TALENTO HUMANO", 105, currentY + 6, null, null, "center");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("EMPLIFI S.A.", 105, currentY + 11, null, null, "center");

    // QR & Institutional Validation Box (Bottom Left/Right)
    const qrY = currentY + 22;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(20, qrY, 170, 28, "FD");

    // Simulated QR Code Graphic Matrix in jsPDF
    doc.setFillColor(30, 41, 59);
    doc.rect(25, qrY + 4, 20, 20, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(29, qrY + 8, 12, 12, "F");
    doc.setFillColor(30, 41, 59);
    doc.rect(32, qrY + 11, 6, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("DOCUMENTO OFICIAL VERIFICABLE", 50, qrY + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Código de Autenticidad: ${verificationCode}`, 50, qrY + 15);
    doc.text(`Verificable en: https://emplifi.com/verify?code=${verificationCode}`, 50, qrY + 20);

    doc.save(`CertificadoLaboral_${lastName}_${identityCard}.pdf`);
};
