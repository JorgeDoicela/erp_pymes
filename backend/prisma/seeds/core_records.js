import { getRandomElement } from './utils.js';
import { encryptSalary, decryptSalary } from '../../src/utils/encryption.js';

export async function seedCoreRecords(prisma, employees) {
    console.log('📂 Generando Registros Core (Contratos, Skills, Horarios)...');

    // Create Shifts
    let shiftMorning = await prisma.shift.findFirst({ where: { name: 'Matutino' } });
    if (!shiftMorning) {
        shiftMorning = await prisma.shift.create({ data: { name: 'Matutino', startTime: '08:00', endTime: '17:00' } });
    }

    let shiftEvening = await prisma.shift.findFirst({ where: { name: 'Vespertino' } });
    if (!shiftEvening) {
        shiftEvening = await prisma.shift.create({ data: { name: 'Vespertino', startTime: '14:00', endTime: '22:00' } });
    }

    for (const emp of employees) {
        if (!emp.isActive) continue; // Basic records mostly for active, though terminated had them too.

        try {
            // 1. Contract
            const existingContract = await prisma.contract.findFirst({ where: { employeeId: emp.id } });
            if (!existingContract) {
                // Decrypt salary to verify or just use a random value consistent
                // Since I can't easily decrypt without potential error if format changes, I'll assume valid ranges
                await prisma.contract.create({
                    data: {
                        employeeId: emp.id,
                        type: emp.contractType || 'Indefinido',
                        startDate: emp.hireDate,
                        salary: 1500, // Placeholder float, real salary is encrypted in emp
                        status: 'Active'
                    }
                });
            }

            // 2. Schedule
            const existingSchedule = await prisma.employeeSchedule.findFirst({ where: { employeeId: emp.id } });
            if (!existingSchedule) {
                await prisma.employeeSchedule.create({
                    data: {
                        employeeId: emp.id,
                        shiftId: shiftMorning.id,
                        startDate: new Date(),
                        daysOfWeek: JSON.stringify(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"])
                    }
                });
            }

            // 3. Skills
            const countSkills = await prisma.skill.count({ where: { employeeId: emp.id } });
            if (countSkills === 0) {
                await prisma.skill.createMany({
                    data: [
                        { employeeId: emp.id, name: 'Trabajo en Equipo', level: 'Advanced' },
                        { employeeId: emp.id, name: 'Comunicación', level: 'Intermediate' },
                        { employeeId: emp.id, name: 'Resolución de Problemas', level: getRandomElement(['Intermediate', 'Advanced']) }
                    ]
                });
            }

            // 4. Work History
            const countHistory = await prisma.workHistory.count({ where: { employeeId: emp.id } });
            if (countHistory === 0) {
                await prisma.workHistory.create({
                    data: {
                        employeeId: emp.id,
                        company: 'Tech Corp Anterior',
                        position: 'Junior Dev',
                        startDate: new Date('2020-01-01'),
                        endDate: new Date('2022-01-01'),
                        description: 'Desarrollo backend básico.'
                    }
                });
            }

        } catch (e) {
            console.log(`Core records error for ${emp.email}: ${e.message}`);
        }
    }
}
