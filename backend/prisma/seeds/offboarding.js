import offboardingService from '../../src/services/employees/offboardingService.js';

export async function seedOffboarding(prisma, allEmployees) {
    console.log('[OFFBOARDING] Generando procesos de salida y liquidaciones legales sincronizadas con el simulador...');

    // Limpiar offboardings previos
    await prisma.offboardingProcess.deleteMany({});

    const exEmployees = allEmployees.filter(e => !e.isActive && e.exitDate);
    const offboardingBatch = [];

    for (let idx = 0; idx < exEmployees.length; idx++) {
        const emp = exEmployees[idx];
        const isDespido = idx % 2 === 1;
        const causal = isDespido ? 'UNFAIR_DISMISSAL' : 'VOLUNTARY_RESIGNATION';
        const exitDate = emp.exitDate || new Date();
        
        try {
            const sim = await offboardingService.simulateSettlement({
                employeeId: emp.id,
                exitDate: new Date(exitDate),
                causal
            });

            const isCompleted = idx !== 0; // El primer proceso queda IN_PROGRESS para demostración interactiva
            const checklist = [
                { id: 'IT_REVOKE', label: 'Revocación de correos corporativos y accesos a sistemas IT', completed: true, category: 'IT', completedAt: new Date(exitDate) },
                { id: 'EXIT_INTERVIEW', label: 'Realización de entrevista de salida con RRHH', completed: true, category: 'HR', completedAt: new Date(exitDate) },
                { id: 'SIGN_SETTLEMENT', label: 'Firma de Acta de Finiquito y acreditación de fondos en Ministerio del Trabajo', completed: isCompleted, category: 'LEGAL', completedAt: isCompleted ? new Date(exitDate) : null },
                { id: 'ASSET_RETURN', label: 'Devolución de Laptop corporativa y credenciales de acceso', completed: isCompleted, category: 'ASSETS', completedAt: isCompleted ? new Date(exitDate) : null }
            ];

            offboardingBatch.push({
                employeeId: emp.id,
                exitDate: new Date(exitDate),
                causal,
                status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
                checklist: JSON.stringify(checklist),
                baseSalary: sim.baseSalary,
                monthsWorked: sim.monthsWorked,
                thirteenthProportional: sim.thirteenthProportional,
                fourteenthProportional: sim.fourteenthProportional,
                vacationDaysOwed: sim.pendingVacationDays,
                vacationAmount: sim.vacationAmount,
                desahucioAmount: sim.desahucioAmount,
                severanceAmount: sim.severanceAmount,
                totalSettlement: sim.totalSettlement,
                notes: isDespido 
                    ? 'Desvinculación con liquidación completa por despido intempestivo según Art. 188 del Código del Trabajo.' 
                    : 'Salida voluntaria por nuevos proyectos profesionales. Finiquito y desahucio Art. 185 calculados.'
            });
        } catch (e) {
            console.error(`Error simulando finiquito para ${emp.firstName}:`, e.message);
        }
    }

    if (offboardingBatch.length > 0) {
        await prisma.offboardingProcess.createMany({
            data: offboardingBatch,
            skipDuplicates: true
        });
    }

    console.log(`[OFFBOARDING] ${offboardingBatch.length} procesos de finiquito y liquidación sembrados.`);
}
