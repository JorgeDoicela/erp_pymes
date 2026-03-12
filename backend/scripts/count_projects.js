import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.entrepreneurship.count();
    console.log('ENTREPRENEURSHIP_COUNT:', count);
    
    if (count > 0) {
        const projects = await prisma.entrepreneurship.findMany({
            select: { id: true, title: true, ownerId: true }
        });
        console.log('PROJECTS:', projects);
    }
}

main().finally(() => prisma.$disconnect());
