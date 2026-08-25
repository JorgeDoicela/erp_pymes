export async function seedAnnouncements(prisma, allEmployees) {
    console.log('[ANNOUNCEMENTS] Generando Comunicados Oficiales y Acuses de Lectura...');

    const tenants = await prisma.tenant.findMany({
        where: { isActive: true }
    });

    for (const tenant of tenants) {
        const tenantEmployees = allEmployees.filter(e => e.tenantId === tenant.id);
        const adminUser = tenantEmployees.find(e => e.role === 'admin') || tenantEmployees[0];
        if (!adminUser) continue;

        const announcementsData = [
            {
                title: 'Actualización del Protocolo de Seguridad de la Información y Uso de IA',
                content: 'Se informa a todo el personal que a partir del presente mes entra en vigencia la nueva política de confidencialidad y gobernanza de datos. Queda estrictamente prohibido compartir credenciales o subir datos sensibles a herramientas públicas.',
                category: 'POLICY',
                priority: 'URGENT',
                requiresAcknowledgment: true,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Jornada de Integración Corporativa y Premiación de Desempeño 2026',
                content: '¡Nos complace invitarlos a nuestra jornada anual de integración y reconocimiento al talento! Tendremos actividades de teambuilding, almuerzo campestre y entrega de reconocimientos al esfuerzo.',
                category: 'GENERAL',
                priority: 'NORMAL',
                requiresAcknowledgment: false,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Feriado Nacional y Régimen de Guardias Operativas',
                content: 'Recordamos a todo el equipo las disposiciones de descanso obligatorio correspondientes al próximo feriado nacional decretado por el Gobierno Nacional. Los turnos indispensables contarán con el respectivo recargo del 100%.',
                category: 'HOLIDAY',
                priority: 'NORMAL',
                requiresAcknowledgment: true,
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            {
                title: '¡Feliz Cumpleaños a nuestros colaboradores del mes!',
                content: 'Queremos extender una calurosa felicitación a todos nuestros compañeros que cumplen años durante este mes. ¡Les deseamos muchos éxitos personales y profesionales!',
                category: 'BIRTHDAY',
                priority: 'NORMAL',
                requiresAcknowledgment: false,
                createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
            }
        ];

        for (const a of announcementsData) {
            const announcement = await prisma.announcement.create({
                data: {
                    tenantId: tenant.id,
                    title: a.title,
                    content: a.content,
                    category: a.category,
                    priority: a.priority,
                    requiresAcknowledgment: a.requiresAcknowledgment,
                    createdById: adminUser.id,
                    createdAt: a.createdAt
                }
            });

            // Generar lecturas de colaboradores
            const readsBatch = [];
            for (let i = 0; i < tenantEmployees.length; i++) {
                const emp = tenantEmployees[i];
                if (i % 4 === 0) continue; // 75% lo leyeron

                readsBatch.push({
                    announcementId: announcement.id,
                    employeeId: emp.id,
                    readAt: new Date(a.createdAt.getTime() + (i * 2 + 1) * 3600 * 1000),
                    acknowledged: a.requiresAcknowledgment ? (i % 2 === 0) : false
                });
            }

            if (readsBatch.length > 0) {
                await prisma.announcementRead.createMany({
                    data: readsBatch,
                    skipDuplicates: true
                });
            }
        }
    }

    console.log('[ANNOUNCEMENTS] Comunicados sembrados con éxito.');
}
