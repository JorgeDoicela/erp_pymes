import bcrypt from 'bcryptjs';
import { encrypt, encryptSalary } from '../../src/utils/encryption.js';

// 10 empleados reales ecuatorianos + 1 admin
// Contraseña de todos: Emplifi2025!
// Correos: nombre.apellido@emplifi.com

const EMPLOYEES = [
    {
        firstName: 'Andrés',
        lastName: 'Morales',
        email: 'andres.morales@emplifi.com',
        identityCard: '1712345678',
        department: 'Tecnología',
        position: 'Desarrollador Senior',
        salary: 2200,
        phone: '0991234567',
        address: 'Av. República del Salvador N36-84, Quito',
        civilStatus: 'Casado',
        contractType: 'Indefinido',
        birthDate: new Date('1990-03-15'),
        hireDate: new Date('2021-06-01'),
        bankName: 'Banco Pichincha',
        accountNumber: '2201234567',
        accountType: 'Ahorros',
        vacationDays: 15,
    },
    {
        firstName: 'Valeria',
        lastName: 'Espinoza',
        email: 'valeria.espinoza@emplifi.com',
        identityCard: '1723456789',
        department: 'Recursos Humanos',
        position: 'Coordinadora de RRHH',
        salary: 1800,
        phone: '0982345678',
        address: 'Calle Veintimilla E7-45, Quito',
        civilStatus: 'Soltera',
        contractType: 'Indefinido',
        birthDate: new Date('1993-07-22'),
        hireDate: new Date('2020-03-15'),
        bankName: 'Banco Guayaquil',
        accountNumber: '3301234567',
        accountType: 'Corriente',
        vacationDays: 15,
    },
    {
        firstName: 'Diego',
        lastName: 'Vásquez',
        email: 'diego.vasquez@emplifi.com',
        identityCard: '1734567890',
        department: 'Finanzas',
        position: 'Analista Financiero',
        salary: 1950,
        phone: '0973456789',
        address: 'Av. Naciones Unidas E10-44, Quito',
        civilStatus: 'Casado',
        contractType: 'Indefinido',
        birthDate: new Date('1988-11-08'),
        hireDate: new Date('2019-09-01'),
        bankName: 'Produbanco',
        accountNumber: '4401234567',
        accountType: 'Ahorros',
        vacationDays: 15,
    },
    {
        firstName: 'Gabriela',
        lastName: 'Torres',
        email: 'gabriela.torres@emplifi.com',
        identityCard: '1745678901',
        department: 'Marketing',
        position: 'Especialista en Marketing Digital',
        salary: 1700,
        phone: '0964567890',
        address: 'Calle Portugal E9-25, Quito',
        civilStatus: 'Soltera',
        contractType: 'Indefinido',
        birthDate: new Date('1995-04-30'),
        hireDate: new Date('2022-01-10'),
        bankName: 'Banco Internacional',
        accountNumber: '5501234567',
        accountType: 'Ahorros',
        vacationDays: 15,
    },
    {
        firstName: 'Sebastián',
        lastName: 'Herrera',
        email: 'sebastian.herrera@emplifi.com',
        identityCard: '1756789012',
        department: 'Tecnología',
        position: 'Ingeniero DevOps',
        salary: 2500,
        phone: '0955678901',
        address: 'Av. Amazonas N21-147, Quito',
        civilStatus: 'Soltero',
        contractType: 'Indefinido',
        birthDate: new Date('1991-09-14'),
        hireDate: new Date('2021-11-01'),
        bankName: 'Banco Pichincha',
        accountNumber: '6601234567',
        accountType: 'Corriente',
        vacationDays: 15,
    },
    {
        firstName: 'Camila',
        lastName: 'Rodríguez',
        email: 'camila.rodriguez@emplifi.com',
        identityCard: '1767890123',
        department: 'Ventas',
        position: 'Ejecutiva de Ventas',
        salary: 1600,
        phone: '0946789012',
        address: 'Calle Shyris N36-188, Quito',
        civilStatus: 'Casada',
        contractType: 'Indefinido',
        birthDate: new Date('1994-01-25'),
        hireDate: new Date('2022-05-16'),
        bankName: 'Banco del Pacífico',
        accountNumber: '7701234567',
        accountType: 'Ahorros',
        vacationDays: 15,
    },
    {
        firstName: 'Mateo',
        lastName: 'Jiménez',
        email: 'mateo.jimenez@emplifi.com',
        identityCard: '1778901234',
        department: 'Operaciones',
        position: 'Coordinador de Operaciones',
        salary: 1850,
        phone: '0937890123',
        address: 'Av. 6 de Diciembre N24-358, Quito',
        civilStatus: 'Casado',
        contractType: 'Indefinido',
        birthDate: new Date('1987-06-03'),
        hireDate: new Date('2018-08-01'),
        bankName: 'Banco Guayaquil',
        accountNumber: '8801234567',
        accountType: 'Ahorros',
        vacationDays: 15,
    },
    {
        firstName: 'Daniela',
        lastName: 'Salazar',
        email: 'daniela.salazar@emplifi.com',
        identityCard: '1789012345',
        department: 'Legal',
        position: 'Asesora Legal',
        salary: 2100,
        phone: '0928901234',
        address: 'Calle Baquedano E5-29, Quito',
        civilStatus: 'Soltera',
        contractType: 'Indefinido',
        birthDate: new Date('1992-12-17'),
        hireDate: new Date('2020-07-01'),
        bankName: 'Produbanco',
        accountNumber: '9901234567',
        accountType: 'Corriente',
        vacationDays: 15,
    },
    {
        firstName: 'Felipe',
        lastName: 'Castillo',
        email: 'felipe.castillo@emplifi.com',
        identityCard: '1790123456',
        department: 'Tecnología',
        position: 'Diseñador UX/UI',
        salary: 1900,
        phone: '0919012345',
        address: 'Av. Colón E4-60, Quito',
        civilStatus: 'Soltero',
        contractType: 'Indefinido',
        birthDate: new Date('1996-08-09'),
        hireDate: new Date('2023-02-01'),
        bankName: 'Banco Internacional',
        accountNumber: '1001234567',
        accountType: 'Ahorros',
        vacationDays: 15,
    },
    {
        firstName: 'Paola',
        lastName: 'Mendoza',
        email: 'paola.mendoza@emplifi.com',
        identityCard: '1701234567',
        department: 'Finanzas',
        position: 'Contadora General',
        salary: 2000,
        phone: '0901234567',
        address: 'Calle Roca E4-25, Quito',
        civilStatus: 'Casada',
        contractType: 'Indefinido',
        birthDate: new Date('1989-02-28'),
        hireDate: new Date('2019-04-15'),
        bankName: 'Banco Pichincha',
        accountNumber: '1101234567',
        accountType: 'Ahorros',
        vacationDays: 15,
    },
];

export async function seedUsers(prisma) {
    console.log('[USERS] Creando Admin y 10 Empleados...');
    const password = await bcrypt.hash('Emplifi2025!', 10);

    // ── Admin ──────────────────────────────────────────────────────────────────
    let admin;
    try {
        admin = await prisma.employee.upsert({
            where: { email: 'admin@emplifi.com' },
            update: { password },
            create: {
                firstName: 'Jorge',
                lastName: 'Doicela',
                email: 'admin@emplifi.com',
                role: 'admin',
                department: 'Dirección',
                position: 'Director General',
                salary: encryptSalary(5000),
                password,
                identityCard: '0101010101',
                birthDate: new Date('1980-01-01'),
                hireDate: new Date('2018-01-01'),
                isActive: true,
                address: 'Av. Patria E4-05, Quito',
                phone: '0999999999',
                civilStatus: 'Casado',
                contractType: 'Indefinido',
                bankName: encrypt('Banco Pichincha'),
                accountNumber: encrypt('0001234567'),
                accountType: 'Corriente',
                vacationDays: 15,
            }
        });
        console.log('✅ Admin: admin@emplifi.com / Emplifi2025!');
    } catch (e) {
        console.log('⚠️ Admin creation failed: ' + e.message);
        admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
    }

    // ── 10 Empleados ──────────────────────────────────────────────────────────
    const employees = [];
    for (const emp of EMPLOYEES) {
        try {
            const created = await prisma.employee.upsert({
                where: { email: emp.email },
                update: { password },
                create: {
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email,
                    password,
                    role: 'employee',
                    department: emp.department,
                    position: emp.position,
                    salary: encryptSalary(emp.salary),
                    identityCard: emp.identityCard,
                    birthDate: emp.birthDate,
                    hireDate: emp.hireDate,
                    isActive: true,
                    address: emp.address,
                    phone: emp.phone,
                    civilStatus: emp.civilStatus,
                    contractType: emp.contractType,
                    bankName: encrypt(emp.bankName),
                    accountNumber: encrypt(emp.accountNumber),
                    accountType: emp.accountType,
                    vacationDays: emp.vacationDays,
                }
            });
            employees.push(created);
            console.log(`✅ ${emp.firstName} ${emp.lastName}: ${emp.email} / Emplifi2025!`);
        } catch (e) {
            console.log(`⚠️ Error creando ${emp.email}: ${e.message}`);
        }
    }

    // ── System Settings ───────────────────────────────────────────────────────
    try {
        await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: {},
            create: {
                id: 'default',
                maintenanceMode: false,
                biometricEnabled: false,
                maintenanceMessage: 'El sistema estará en mantenimiento brevemente.',
            }
        });
        console.log('✅ System Settings configurados');
    } catch (e) {
        console.log('⚠️ System Settings failed: ' + e.message);
    }

    return { admin, employees };
}
