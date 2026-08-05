export async function seedCleanup(prisma) {
    console.log('[CLEANUP] Limpiando base de datos (con manejo de relaciones e incubadora)...');

    const cleanTable = async (modelName) => {
        try {
            if (prisma[modelName]) {
                await prisma[modelName].deleteMany();
            }
        } catch (e) {
            // Ignorar si la tabla no existe en el schema actual
        }
    };

    const tablesInOrder = [
        // 1. Incubadora / Emprendimiento
        'entrepreneurshipDocument',
        'entrepreneurshipEquity',
        'entrepreneurshipFundingRound',
        'entrepreneurshipInterview',
        'entrepreneurshipMember',
        'entrepreneurshipMentor',
        'entrepreneurshipMilestone',
        'entrepreneurshipTargetMarket',
        'entrepreneurshipUpdate',
        'entrepreneurship',

        // 2. Contabilidad
        'journalLine',
        'journalEntry',
        'costCenter',
        'accountingAccount',
        'accountingPeriod',

        // 3. Clima y Evaluaciones
        'climateResponse',
        'climateSurvey',
        'evaluationReviewer',
        'employeeEvaluation',
        'evaluationTemplate',

        // 4. Reclutamiento
        'candidateEvaluation',
        'interview',
        'applicationNote',
        'jobApplication',
        'jobVacancy',

        // 5. Nómina
        'payrollDetail',
        'payrollItem',
        'payrollConfig',
        'payroll',

        // 6. Asistencia y Ausencias
        'attendance',
        'absenceRequest',

        // 7. Horarios, Metas y Registros Core
        'employeeGoal',
        'employeeSchedule',
        'shift',
        'contract',
        'skill',
        'workHistory',

        // 8. Documentos, Notificaciones y Auditoría
        'document',
        'auditLog',
        'employeeBenefit',
        'notificationPreference',
        'notification',
        'biometricCredential',

        // 9. Empleados y Usuarios
        'employee'
    ];

    try {
        await prisma.$transaction(
            tablesInOrder.map(t => prisma[t]?.deleteMany()).filter(Boolean),
            { timeout: 30000 }
        );
        console.log('✅ Base de datos limpiada correctamente.');
    } catch (e) {
        console.log('⚠️ Transacción en lote falló. Ejecutando limpieza secuencial por tabla...');
        for (const table of tablesInOrder) {
            await cleanTable(table);
        }
        console.log('✅ Limpieza secuencial completada.');
    }
}
