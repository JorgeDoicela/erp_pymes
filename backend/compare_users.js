import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const diego = await prisma.employee.findFirst({
            where: { firstName: { contains: 'Diego' } },
        });
        const admin = await prisma.employee.findUnique({
            where: { email: 'admin@emplifi.com' },
        });
        console.log('DIEGO:', diego ? `${diego.firstName} ${diego.lastName}, Email: ${diego.email}, Role: ${diego.role}` : 'NOT FOUND');
        console.log('ADMIN:', admin ? `${admin.firstName} ${admin.lastName}, Email: ${admin.email}, Role: ${admin.role}` : 'NOT FOUND');
    } catch (e) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
