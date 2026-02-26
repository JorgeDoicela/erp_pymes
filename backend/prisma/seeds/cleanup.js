export async function seedCleanup(prisma) {
    console.log('[CLEANUP] Limpiando base de datos (con manejo de errores)...');

    // Usamos una transacción para limpiar todo de una vez y no perder la conexión entre tablas
    try {
        await prisma.$transaction([
            prisma.climateResponse.deleteMany(),
            prisma.climateSurvey.deleteMany(),
            prisma.payrollDetail.deleteMany(),
            prisma.payrollItem.deleteMany(),
            prisma.payrollConfig.deleteMany(),
            prisma.payroll.deleteMany(),
            prisma.evaluationReviewer.deleteMany(),
            prisma.employeeEvaluation.deleteMany(),
            prisma.evaluationTemplate.deleteMany(),
            prisma.candidateEvaluation.deleteMany(),
            prisma.interview.deleteMany(),
            prisma.applicationNote.deleteMany(),
            prisma.jobApplication.deleteMany(),
            prisma.jobVacancy.deleteMany(),
            prisma.employeeGoal.deleteMany(),
            prisma.attendance.deleteMany(),
            prisma.absenceRequest.deleteMany(),
            prisma.employeeSchedule.deleteMany(),
            prisma.shift.deleteMany(),
            prisma.contract.deleteMany(),
            prisma.skill.deleteMany(),
            prisma.workHistory.deleteMany(),
            prisma.document.deleteMany(),
            prisma.auditLog.deleteMany(),
            prisma.employeeBenefit.deleteMany(),
            prisma.notification.deleteMany(),
            prisma.employee.deleteMany(),
        ], { timeout: 30000 });
        console.log('✅ Base de datos limpiada correctamente.');
    } catch (e) {
        // Si la transacción falla (e.g. tabla no existe), intentar tabla por tabla
        console.log('⚠️ Transacción falló, intentando tabla por tabla...');
        const tables = [
            'climateResponse', 'climateSurvey',
            'payrollDetail', 'payrollItem', 'payrollConfig', 'payroll',
            'evaluationReviewer', 'employeeEvaluation', 'evaluationTemplate',
            'candidateEvaluation', 'interview', 'applicationNote', 'jobApplication', 'jobVacancy',
            'employeeGoal', 'attendance', 'absenceRequest', 'employeeSchedule', 'shift',
            'contract', 'skill', 'workHistory', 'document', 'auditLog', 'employeeBenefit',
            'notification', 'employee'
        ];
        for (const table of tables) {
            try {
                await prisma[table].deleteMany();
            } catch (err) {
                console.error(`⚠️ Error deleting table ${table}: ${err.message}`);
            }
        }
    }
}
