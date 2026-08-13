export async function seedAbsences(prisma, employees) {
    console.log('[ABSENCES] Generando Solicitudes de Ausencia Narrativas...');

    const ABSENCE_PROFILES = [
        {
            email: 'kevin.arismendi@emplifi.com',
            requests: [
                { type: 'Enfermedad', daysAgo: 45, duration: 2, status: 'APPROVED', reason: 'Reposo médico por gastroenteritis', comment: 'Certificado presentado' },
                { type: 'Personal', daysAgo: 20, duration: 1, status: 'APPROVED', reason: 'Trámites bancarios urgentes', comment: 'Aprobado' },
                { type: 'Enfermedad', daysAgo: 5, duration: 1, status: 'PENDING', reason: 'Malestar general y migraña', comment: null },
            ]
        },
        {
            email: 'lucia.paz@techsolutions.ec',
            requests: [
                { type: 'Personal', daysAgo: 60, duration: 2, status: 'APPROVED', reason: 'Asuntos familiares', comment: 'Aprobado' },
                { type: 'Vacaciones', daysAgo: 30, duration: 3, status: 'REJECTED', reason: 'Vacaciones cortas', comment: 'Superposición con entregable de departamento' },
                { type: 'Enfermedad', daysAgo: 10, duration: 1, status: 'PENDING', reason: 'Cita médica especialista', comment: null },
            ]
        },
        {
            email: 'andres.morales@emplifi.com',
            requests: [
                { type: 'Vacaciones', daysAgo: 90, duration: 5, status: 'APPROVED', reason: 'Vacaciones anuales reglamentarias', comment: 'Aprobadas sin novedad' },
            ]
        },
        {
            email: 'gabriela.torres@emplifi.com',
            requests: [
                { type: 'Enfermedad', daysAgo: 40, duration: 2, status: 'APPROVED', reason: 'Cita de control médico', comment: 'Aprobado' },
                { type: 'Personal', daysAgo: 15, duration: 1, status: 'APPROVED', reason: 'Calamidad doméstica menor', comment: 'Aprobado' },
            ]
        },
        {
            email: 'camila.rodriguez@emplifi.com',
            requests: [
                { type: 'Personal', daysAgo: 25, duration: 1, status: 'APPROVED', reason: 'Trámite notarial', comment: 'Aprobado' },
                { type: 'Personal', daysAgo: 8, duration: 1, status: 'PENDING', reason: 'Renovación de licencia de conducir', comment: null },
            ]
        },
        {
            email: 'valeria.espinoza@emplifi.com',
            requests: [
                { type: 'Vacaciones', daysAgo: 110, duration: 5, status: 'APPROVED', reason: 'Vacaciones programadas', comment: 'Aprobadas' },
            ]
        },
        {
            email: 'roberto.guzman@techsolutions.ec',
            requests: [
                { type: 'Vacaciones', daysAgo: 70, duration: 4, status: 'APPROVED', reason: 'Descanso de mitad de año', comment: 'Disfruta tus vacaciones' },
            ]
        }
    ];

    const absencesBatch = [];

    for (const emp of employees) {
        if (!emp.isActive) continue;

        const profile = ABSENCE_PROFILES.find(p => p.email === emp.email);

        if (profile) {
            for (const req of profile.requests) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - req.daysAgo);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + req.duration - 1);

                absencesBatch.push({
                    employeeId: emp.id,
                    type: req.type,
                    startDate: startDate,
                    endDate: endDate,
                    reason: req.reason,
                    status: req.status,
                    adminComment: req.comment
                });
            }
        } else {
            const startDate = new Date();
            const offset = String(emp.id).charCodeAt(0) % 30;
            startDate.setDate(startDate.getDate() - (40 + offset));
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 3);

            absencesBatch.push({
                employeeId: emp.id,
                type: 'Vacaciones',
                startDate: startDate,
                endDate: endDate,
                reason: 'Vacaciones reglamentarias de descanso',
                status: 'APPROVED',
                adminComment: 'Disfruta tus vacaciones'
            });
        }
    }

    if (absencesBatch.length > 0) {
        await prisma.absenceRequest.createMany({ data: absencesBatch, skipDuplicates: true });
    }
    console.log('[ABSENCES] Solicitudes de ausencia narrativas generadas en lote.');
}
