export const seedNotifications = async (prisma, admin1, allEmployees) => {
    console.log('[NOTIFICATIONS] Generando notificaciones multi-tenant profesionales...');

    // Limpiar notificaciones previas
    await prisma.notification.deleteMany({});

    const notificationsBatch = [];

    // Obtener tenants
    const tenants = await prisma.tenant.findMany({
        where: { isActive: true }
    });

    for (const tenant of tenants) {
        const tenantEmployees = allEmployees.filter(e => e.tenantId === tenant.id);
        const admin = tenantEmployees.find(e => e.role === 'admin') || admin1;
        const contab = tenantEmployees.find(e => e.email?.includes('contabilidad'));
        const regularEmployees = tenantEmployees.filter(e => e.role !== 'admin' && !e.email?.includes('contabilidad'));

        if (admin) {
            // Notificaciones para el Administrador / RRHH de la Empresa
            notificationsBatch.push(
                {
                    recipientId: admin.id,
                    title: 'Nueva Solicitud de Ausencia',
                    message: `${regularEmployees[0] ? `${regularEmployees[0].firstName} ${regularEmployees[0].lastName}` : 'Un colaborador'} ha solicitado permiso médico por 2 días. Requiere aprobación.`,
                    type: 'ABSENCE_REQUEST',
                    isRead: false,
                    relatedEntity: 'AbsenceRequest',
                    createdAt: new Date(Date.now() - 15 * 60 * 1000) // Hace 15 min
                },
                {
                    recipientId: admin.id,
                    title: 'Contrato Próximo a Vencer',
                    message: `El contrato de ${regularEmployees[1] ? `${regularEmployees[1].firstName} ${regularEmployees[1].lastName}` : 'un colaborador'} vence en 7 días calendario.`,
                    type: 'CONTRACT_EXPIRATION',
                    isRead: false,
                    relatedEntity: 'Contract',
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // Hace 2 horas
                },
                {
                    recipientId: admin.id,
                    title: 'Nómina Mensual Generada',
                    message: `Se ha procesado y consolidado la nómina del mes para ${tenant.name} con 0 inconsistencias.`,
                    type: 'PAYROLL_GENERATED',
                    isRead: true,
                    relatedEntity: 'Payroll',
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Hace 1 día
                },
                {
                    recipientId: admin.id,
                    title: 'Evaluación de Desempeño 360°',
                    message: `El 92% de los colaboradores de ${tenant.name} han completado la evaluación de desempeño del periodo.`,
                    type: 'EVALUATION_REMINDER',
                    isRead: false,
                    relatedEntity: 'EmployeeEvaluation',
                    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000) // Hace 1.5 días
                },
                {
                    recipientId: admin.id,
                    title: 'Alerta de Documento por Vencer',
                    message: `El Certificado Médico Ocupacional de ${regularEmployees[2] ? `${regularEmployees[2].firstName} ${regularEmployees[2].lastName}` : 'un colaborador'} vence en 15 días.`,
                    type: 'DOCUMENT_EXPIRATION',
                    isRead: true,
                    relatedEntity: 'Document',
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Hace 3 días
                },
                {
                    recipientId: admin.id,
                    title: 'Seguridad y Acceso',
                    message: 'Inicio de sesión administrativo verificado con éxito mediante credencial biométrica WebAuthn FIDO2.',
                    type: 'SYSTEM',
                    isRead: true,
                    relatedEntity: 'Security',
                    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
                }
            );
        }

        if (contab) {
            // Notificaciones para el departamento Contable
            notificationsBatch.push(
                {
                    recipientId: contab.id,
                    title: 'Asiento Contable de Nómina Registrado',
                    message: `El asiento de diario correspondiente a los sueldos y aportes al IESS de ${tenant.name} fue registrado en el catálogo PUG.`,
                    type: 'PAYROLL_CLOSING',
                    isRead: false,
                    relatedEntity: 'JournalEntry',
                    createdAt: new Date(Date.now() - 45 * 60 * 1000)
                },
                {
                    recipientId: contab.id,
                    title: 'Conciliación Tributaria Lista',
                    message: 'El resumen de retenciones y provisiones de décimos está disponible para conciliación.',
                    type: 'PAYROLL_REVIEW',
                    isRead: true,
                    relatedEntity: 'Payroll',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                }
            );
        }

        // Notificaciones para colaboradores de muestra
        for (let i = 0; i < Math.min(regularEmployees.length, 5); i++) {
            const emp = regularEmployees[i];
            notificationsBatch.push(
                {
                    recipientId: emp.id,
                    title: 'Rol de Pagos Disponible',
                    message: `Tu rol de pagos de ${tenant.name} ya se encuentra generado y disponible para descarga en PDF.`,
                    type: 'PAYROLL_CONFIRM',
                    isRead: i > 1,
                    relatedEntity: 'PayrollDetail',
                    createdAt: new Date(Date.now() - (i + 1) * 12 * 60 * 60 * 1000)
                },
                {
                    recipientId: emp.id,
                    title: 'Evaluación 360° Asignada',
                    message: 'Se te ha asignado una nueva evaluación de desempeño y objetivos SMART. Por favor complétala.',
                    type: 'EVALUATION_ASSIGNED',
                    isRead: false,
                    relatedEntity: 'EmployeeEvaluation',
                    createdAt: new Date(Date.now() - (i + 2) * 24 * 60 * 60 * 1000)
                },
                {
                    recipientId: emp.id,
                    title: 'Solicitud de Ausencia Aprobada',
                    message: 'Tu solicitud de permiso reglamentario fue aprobada por el departamento de Recursos Humanos.',
                    type: 'ABSENCE_STATUS',
                    isRead: true,
                    relatedEntity: 'AbsenceRequest',
                    createdAt: new Date(Date.now() - (i + 4) * 24 * 60 * 60 * 1000)
                }
            );
        }
    }

    if (notificationsBatch.length > 0) {
        await prisma.notification.createMany({
            data: notificationsBatch,
            skipDuplicates: true
        });
    }

    console.log(`[NOTIFICATIONS] ${notificationsBatch.length} notificaciones sembradas con éxito.`);
};
