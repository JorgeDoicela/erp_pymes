import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.employee.findMany({
            where: { firstName: { contains: 'Diego' } },
        });
        console.log(`Encontrados ${users.length} usuarios con nombre Diego:`);
        users.forEach(u => {
            console.log(`- ${u.firstName} ${u.lastName} (${u.email}): Role=${u.role}`);
        });
    } catch (e) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
