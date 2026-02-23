import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const diego = await prisma.employee.findFirst({ where: { firstName: { contains: 'Diego' } } });
        const admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
        console.log(`D-ROLE:${diego.role}`);
        console.log(`A-ROLE:${admin.role}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
