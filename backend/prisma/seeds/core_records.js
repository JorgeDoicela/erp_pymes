import { getRandomElement } from './utils.js';
import { decryptSalary } from '../../src/utils/encryption.js';

export async function seedCoreRecords(prisma, employees) {
    console.log('[CORE] Generando Registros Core en Lote (Contratos, Skills, Horarios)...');

    let shiftMorning = await prisma.shift.findFirst({ where: { name: 'Matutino' } });
    if (!shiftMorning) {
        shiftMorning = await prisma.shift.create({ data: { name: 'Matutino', startTime: '08:00', endTime: '17:00' } });
    }

    const contractsBatch = [];
    const schedulesBatch = [];
    const skillsBatch = [];
    const historyBatch = [];

    for (const emp of employees) {
        const decSal = decryptSalary(emp.salary) || 1500;
        
        contractsBatch.push({
            employeeId: emp.id,
            type: emp.contractType || 'Indefinido',
            startDate: emp.hireDate || new Date('2020-01-01'),
            endDate: emp.isActive ? null : (emp.exitDate || new Date()),
            salary: decSal,
            status: emp.isActive ? 'Active' : 'Terminated'
        });

        if (!emp.isActive) continue;

        schedulesBatch.push({
            employeeId: emp.id,
            shiftId: shiftMorning.id,
            startDate: emp.hireDate || new Date('2020-01-01'),
            daysOfWeek: JSON.stringify(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"])
        });

        skillsBatch.push(
            { employeeId: emp.id, name: 'Trabajo en Equipo', level: 'Advanced' },
            { employeeId: emp.id, name: 'Comunicación Efectiva', level: 'Intermediate' },
            { employeeId: emp.id, name: 'Resolución de Problemas', level: getRandomElement(['Intermediate', 'Advanced']) }
        );

        historyBatch.push({
            employeeId: emp.id,
            company: 'Experiencia Previa Corporativa',
            position: emp.position || 'Especialista',
            startDate: new Date('2018-01-01'),
            endDate: new Date('2020-01-01'),
            description: 'Desempeño en proyectos previos del sector.'
        });
    }

    if (contractsBatch.length > 0) {
        await prisma.contract.createMany({ data: contractsBatch, skipDuplicates: true });
    }
    if (schedulesBatch.length > 0) {
        await prisma.employeeSchedule.createMany({ data: schedulesBatch, skipDuplicates: true });
    }
    if (skillsBatch.length > 0) {
        await prisma.skill.createMany({ data: skillsBatch, skipDuplicates: true });
    }
    if (historyBatch.length > 0) {
        await prisma.workHistory.createMany({ data: historyBatch, skipDuplicates: true });
    }

    console.log('Registros core optimizados creados.');
}
