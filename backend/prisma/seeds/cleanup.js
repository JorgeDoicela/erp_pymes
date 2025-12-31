export async function seedCleanup(prisma) {
    console.log('[CLEANUP] Limpiando base de datos (con manejo de errores)...');
    const tables = [
        'climateResponse', 'climateSurvey',
        'payrollDetail', 'payrollItem', 'payrollConfig', 'payroll',
        'evaluationReviewer', 'employeeEvaluation', 'evaluationTemplate',
        'candidateEvaluation', 'interview', 'applicationNote', 'jobApplication', 'jobVacancy',
        'employeeGoal', 'attendance', 'absenceRequest', 'employeeSchedule', 'shift',
        'contract', 'skill', 'workHistory', 'document', 'auditLog', 'employeeBenefit',
        'employee'
    ];

    for (const table of tables) {
        try {
            await prisma[table].deleteMany();
        } catch (e) {
            console.error(`⚠️ Error deleting table ${table}: ${e.message}`);
        }
    }
}
