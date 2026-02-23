import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const d = await prisma.employee.findFirst({ where: { firstName: { contains: 'Diego' } } });
        const a = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
        console.log(`DIEGO_ROLE_IS_${d.role}`);
        console.log(`ADMIN_ROLE_IS_${a.role}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
