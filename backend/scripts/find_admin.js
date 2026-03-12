import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.employee.findFirst({
        where: {
            OR: [
                { role: { contains: 'admin', mode: 'insensitive' } },
                { email: 'admin@emplifi.com' }
            ]
        }
    });
    console.log('SEARCH_RESULT:', admin ? `${admin.email} | ${admin.role} | ${admin.id}` : 'NOT_FOUND');
    
    const count = await prisma.employee.count();
    console.log('TOTAL_EMPLOYEES:', count);
}

main().finally(() => prisma.$disconnect());
