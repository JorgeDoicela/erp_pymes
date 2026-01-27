import bcrypt from 'bcryptjs';
import { encrypt, encryptSalary } from '../../src/utils/encryption.js';
import { firstNames, lastNames, departments, positions, banks, getRandomElement, getRandomDate } from './utils.js';

export async function seedEmployees(prisma) {
    console.log('[EMPLOYEES] Creando Empleados Masivos...');
    const password = await bcrypt.hash('123456', 10);
    const employees = [];

    for (let i = 0; i < 25; i++) {
        try {
            const isTerminated = i > 19;
            const dept = getRandomElement(departments);
            const pos = `${getRandomElement(positions)} ${dept === 'IT' ? 'Developer' : dept === 'Sales' ? 'Executive' : 'Officer'}`;
            const salary = Math.floor(Math.random() * 2000) + 800;
            const uniqueId = Math.floor(Math.random() * 100000);

            const emp = await prisma.employee.create({
                data: {
                    firstName: getRandomElement(firstNames),
                    lastName: getRandomElement(lastNames),
                    email: `emp${uniqueId}_${Date.now()}_${i}@emplifi.com`,
                    password: password,
                    role: 'employee',
                    department: dept,
                    position: pos,
                    salary: encryptSalary(salary),
                    identityCard: `17${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
                    birthDate: getRandomDate(new Date('1970-01-01'), new Date('2000-01-01')),
                    hireDate: getRandomDate(new Date('2022-01-01'), new Date('2023-01-01')),
                    isActive: !isTerminated,
                    exitDate: isTerminated ? getRandomDate(new Date('2024-01-01'), new Date()) : null,
                    exitReason: isTerminated ? getRandomElement(['Renuncia Voluntaria', 'Mejor Oferta', 'Despido', 'Fin de Contrato']) : null,
                    exitType: isTerminated ? (Math.random() > 0.3 ? 'Voluntaria' : 'Involuntaria') : null,
                    phone: '090000000',
                    address: 'Quito, Ecuador',
                    civilStatus: 'Soltero',
                    contractType: 'Indefinido',
                    bankName: encrypt(getRandomElement(banks)),
                    accountNumber: encrypt(`${Math.floor(Math.random() * 1000000000)}`),
                    accountType: 'Ahorros',
                    vacationDays: 15
                }
            });
            employees.push(emp);
        } catch (e) {
            console.log(`⚠️ Skipped employee ${i}: ${e.message}`);
        }
    }
    return employees;
}
