import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const e = await prisma.employee.findFirst({
            where: { firstName: { contains: 'Diego' } },
            select: { id: true, firstName: true, lastName: true, email: true, role: true, position: true }
        });
        if (e) {
            console.log(`DIEGO FOUND: ${e.firstName} ${e.lastName} (${e.email}): Rol=${e.role}, Posición=${e.position}`);
        } else {
            console.log('DIEGO NOT FOUND');
        }
    } catch (e) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
