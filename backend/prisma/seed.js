import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
            salary: 'ENCRYPTED_SALARY_PLACEHOLDER', // En un caso real usaríamos el helper de encriptación
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
            salary: 'ENCRYPTED_SALARY_PLACEHOLDER',
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
