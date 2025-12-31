import bcrypt from 'bcryptjs';
import { encryptSalary } from '../../src/utils/encryption.js';

export async function seedUsers(prisma) {
    console.log('[USERS] Creando/Verificando Usuarios Principales...');
    const password = await bcrypt.hash('123456', 10);

    let admin;
    // 1. Admin
    try {
        admin = await prisma.employee.upsert({
            where: { email: 'admin@emplifi.com' },
            update: { password: password },
            create: {
                firstName: 'Admin', lastName: 'Sistema', email: 'admin@emplifi.com', role: 'admin',
                department: 'Dirección', position: 'CEO', salary: encryptSalary(5000),
                password: password,
                identityCard: '0101010101', birthDate: new Date('1980-01-01'),
                hireDate: new Date('2020-01-01'), isActive: true,
                address: 'HQ', phone: '0999999999', civilStatus: 'Casado', contractType: 'Indefinido',
                bankName: 'Banco Pichincha', accountNumber: '111111', accountType: 'Corriente'
            }
        });
    } catch (e) {
        console.log("⚠️ Admin creation failed: " + e.message);
        admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
    }

    // 2. Test User
    let testUser;
    try {
        const testUserPass = await bcrypt.hash('123456', 10);
        testUser = await prisma.employee.upsert({
            where: { email: 'empleado@test.com' },
            update: { password: testUserPass },
            create: {
                firstName: 'Empleado', lastName: 'Prueba', email: 'empleado@test.com', role: 'employee',
                department: 'IT', position: 'Developer', salary: encryptSalary(1500),
                identityCard: '9999999999', birthDate: new Date('1990-01-01'),
                hireDate: new Date('2023-01-01'), isActive: true,
                address: 'Test House', phone: '0999999999', civilStatus: 'Soltero', contractType: 'Indefinido',
                password: testUserPass,
                bankName: 'Banco Pichincha', accountNumber: '222222', accountType: 'Ahorros',
                vacationDays: 12
            }
        });
        console.log("✅ Test User ensured: empleado@test.com / 123456");
    } catch (e) {
        console.log("⚠️ Test User creation failed: " + e.message);
        testUser = await prisma.employee.findUnique({ where: { email: 'empleado@test.com' } });
    }

    return { admin, testUser };
}
