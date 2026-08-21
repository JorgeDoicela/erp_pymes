export async function seedDocuments(prisma, employees) {
    console.log('[DOCUMENTS] Generando Expediente Digital Completo (Cédula, Título, Banco, Antecedentes, CV)...');

    const docsBatch = [];
    for (const emp of employees) {
        if (!emp.isActive) continue;

        const isFullyVerified = true;

        docsBatch.push(
            {
                employeeId: emp.id,
                type: 'IDENTIFICATION',
                documentCategory: 'IDENTIFICATION',
                documentUrl: `https://storage.emplifi.ec/expedientes/${emp.id}/cedula_identidad.pdf`,
                originalName: `Cedula_${emp.firstName}_${emp.lastName}.pdf`,
                mimeType: 'application/pdf',
                status: 'VERIFIED',
                expiryDate: new Date('2029-12-31')
            },
            {
                employeeId: emp.id,
                type: 'BANK_CERTIFICATE',
                documentCategory: 'BANK_CERTIFICATE',
                documentUrl: `https://storage.emplifi.ec/expedientes/${emp.id}/certificado_bancario.pdf`,
                originalName: `Certificado_${emp.bankName || 'BancoPichincha'}.pdf`,
                mimeType: 'application/pdf',
                status: 'VERIFIED',
                expiryDate: null
            },
            {
                employeeId: emp.id,
                type: 'TITLE_DIPLOMA',
                documentCategory: 'TITLE_DIPLOMA',
                documentUrl: `https://storage.emplifi.ec/expedientes/${emp.id}/titulo_academico.pdf`,
                originalName: `Titulo_Senescyt_${emp.lastName}.pdf`,
                mimeType: 'application/pdf',
                status: 'VERIFIED',
                expiryDate: null
            },
            {
                employeeId: emp.id,
                type: 'POLICE_RECORD',
                documentCategory: 'POLICE_RECORD',
                documentUrl: `https://storage.emplifi.ec/expedientes/${emp.id}/record_policial.pdf`,
                originalName: 'Antecedentes_Penales_MDI.pdf',
                mimeType: 'application/pdf',
                status: 'VERIFIED',
                expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
            },
            {
                employeeId: emp.id,
                type: 'CURRICULUM',
                documentCategory: 'CURRICULUM',
                documentUrl: `https://storage.emplifi.ec/expedientes/${emp.id}/curriculum_vitae.pdf`,
                originalName: `CV_Actualizado_${emp.firstName}_${emp.lastName}.pdf`,
                mimeType: 'application/pdf',
                status: 'VERIFIED',
                expiryDate: null
            },
            {
                employeeId: emp.id,
                type: 'SAFETY_CERTIFICATE',
                documentCategory: 'SAFETY_CERTIFICATE',
                documentUrl: `https://storage.emplifi.ec/expedientes/${emp.id}/salud_ocupacional.pdf`,
                originalName: 'Aptitud_Medica_Ocupacional.pdf',
                mimeType: 'application/pdf',
                status: isFullyVerified ? 'VERIFIED' : 'PENDING',
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
        );
    }

    if (docsBatch.length > 0) {
        await prisma.document.createMany({ data: docsBatch, skipDuplicates: true });
    }
    console.log(`[DOCUMENTS] ${docsBatch.length} documentos de expediente digital sembrados con éxito.`);
}
