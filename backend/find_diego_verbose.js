import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function check() {
    try {
        const e = await prisma.employee.findFirst({
            where: { firstName: { contains: 'Diego' } },
        });
        if (e) {
            fs.writeFileSync('diego_info.log', JSON.stringify(e, null, 2));
            console.log('Resultados guardados en diego_info.log');
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
