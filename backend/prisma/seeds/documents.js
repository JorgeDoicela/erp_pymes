export async function seedDocuments(prisma, employees) {
    console.log('[DOCUMENTS] Generando Metadatos de Documentos...');

    const docsBatch = [];
    for (const emp of employees) {
        if (!emp.isActive) continue;
        docsBatch.push(
            {
                employeeId: emp.id,
                type: 'DNI',
                documentUrl: `dni_${emp.id}.pdf`,
                originalName: 'Cédula.pdf',
                mimeType: 'application/pdf',
                expiryDate: new Date('2028-01-01')
            },
            {
                employeeId: emp.id,
                type: 'Contrato',
                documentUrl: `contract_${emp.id}.pdf`,
                originalName: 'Contrato_Firmado.pdf',
                mimeType: 'application/pdf',
                expiryDate: null
            }
        );
    }

    if (docsBatch.length > 0) {
        await prisma.document.createMany({ data: docsBatch, skipDuplicates: true });
    }
}
