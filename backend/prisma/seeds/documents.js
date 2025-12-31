export async function seedDocuments(prisma, employees) {
    console.log('📄 Generando Metadatos de Documentos...');

    for (const emp of employees) {
        if (!emp.isActive) continue;

        try {
            const count = await prisma.document.count({ where: { employeeId: emp.id } });
            if (count > 0) continue;

            await prisma.document.createMany({
                data: [
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
                ]
            });

        } catch (e) { }
    }
}
