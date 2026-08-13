export async function seedCleanup(prisma) {
    console.log('[CLEANUP] Limpieza destructiva total de base de datos PostgreSQL...');

    try {
        // En PostgreSQL (Neon/AWS), realizar TRUNCATE TABLE ... RESTART IDENTITY CASCADE
        const tablenames = await prisma.$queryRaw`
            SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_migrations';
        `;

        if (Array.isArray(tablenames) && tablenames.length > 0) {
            const tables = tablenames.map(({ tablename }) => `"${tablename}"`).join(', ');
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
            console.log('✅ Base de datos truncada y limpiada completamente (TRUNCATE CASCADE).');
            return;
        }
    } catch (e) {
        console.log('⚠️ TRUNCATE CASCADE no se pudo ejecutar directamente:', e.message);
        console.log('🔄 Ejecutando borrado relacional exhaustivo vía Prisma...');
    }

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

        // 3. IA / Investigacion
        'paretoFrontierPoint',
        'morlPolicyRun',
        'causalIntervention',
        'rsiPredictionAudit',
        'rsiCalibration',
        'tenantPrivacyBudget',

        // 4. Clima y Evaluaciones
        'climateResponse',
        'climateSurvey',
        'evaluationReviewer',
        'employeeEvaluation',
        'evaluationTemplate',

        // 5. Reclutamiento
        'candidateEvaluation',
        'interview',
        'applicationNote',
        'jobApplication',
        'jobVacancy',

        // 6. Nómina
        'payrollDetail',
        'payrollItem',
        'payrollConfig',
        'payroll',

        // 7. Asistencia y Ausencias
        'attendance',
        'absenceRequest',

        // 8. Horarios, Metas y Registros Core
        'employeeGoal',
        'employeeSchedule',
        'shift',
        'contract',
        'skill',
        'workHistory',

        // 9. Documentos, Notificaciones, Ajustes y Auditoría
        'document',
        'auditLog',
        'employeeBenefit',
        'notificationPreference',
        'notification',
        'biometricCredential',
        'systemSetting',

        // 10. Empleados y Tenants
        'employee',
        'tenant'
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

