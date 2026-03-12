import { PrismaClient } from '@prisma/client';
import { seedEntrepreneurship } from '../prisma/seeds/entrepreneurship.js';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding ONLY Entrepreneurship ---');
    
    // Get users for foreign keys
    const admin = await prisma.employee.findFirst({ where: { role: 'admin' } });
    const employees = await prisma.employee.findMany({ take: 10 });
    
    if (!admin) {
        console.error('❌ No Admin found to seed projects.');
        return;
    }

    try {
        await seedEntrepreneurship(prisma, employees, admin);
        const count = await prisma.entrepreneurship.count();
        console.log('✅ Standalone seed completed. Current count:', count);
    } catch (error) {
        console.error('❌ Error in standalone seed:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
