import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const employees = await prisma.employee.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                position: true
            }
        });
        console.log('Listado de Empleados y Roles:');
        employees.forEach(e => {
            console.log(`- ${e.firstName} ${e.lastName} (${e.email}): Rol=${e.role}, Posición=${e.position}`);
        });
    } catch (e) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
