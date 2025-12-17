import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { encryptSalary } from '../src/utils/encryption.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed...');

    // Hash de contraseñas
    const adminPassword = await bcrypt.hash('admin123', 10);
    const employeePassword = await bcrypt.hash('empleado123', 10);

    // Crear Admin
    const admin = await prisma.employee.upsert({
        where: { email: 'admin@emplifi.com' },
        update: {},
        create: {
            firstName: 'Admin',
            lastName: 'Principal',
            email: 'admin@emplifi.com',
            password: adminPassword,
            role: 'admin',
            department: 'Dirección',
            position: 'Administrador del Sistema',
            salary: encryptSalary(5000),
            identityCard: '0000000000',
            birthDate: new Date('1980-01-01'),
            address: 'Oficina Central',
            phone: '0999999999',
            hireDate: new Date('2020-01-01'),
            contractType: 'permanent',
            civilStatus: 'single',
        },
    });

    // Crear Empleado
    const employee = await prisma.employee.upsert({
        where: { email: 'empleado@emplifi.com' },
        update: {},
        create: {
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'empleado@emplifi.com',
            password: employeePassword,
            role: 'employee',
            department: 'Ventas',
            position: 'Vendedor Senior',
            salary: encryptSalary(2500),
            identityCard: '1111111111',
            birthDate: new Date('1990-01-01'),
            address: 'Calle Falsa 123',
            phone: '0988888888',
            hireDate: new Date('2021-01-01'),
            contractType: 'permanent',
            civilStatus: 'married',
        },
    });

    console.log({ admin, employee });
    console.log('✅ Seed completado exitosamente');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
