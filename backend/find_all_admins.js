import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const admins = await prisma.employee.findMany({
            where: { role: 'admin' },
            select: { id: true, firstName: true, lastName: true, email: true }
        });
        console.log(`ENCONTRADOS ${admins.length} ADMINISTRADORES:`);
        admins.forEach(a => {
            console.log(`- ${a.firstName} ${a.lastName} (${a.email})`);
        });
    } catch (e) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
