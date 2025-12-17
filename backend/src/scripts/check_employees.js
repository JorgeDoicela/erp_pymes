import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const employees = await prisma.employee.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            identityCard: true
        }
    });

    await fs.writeFile('users_dump.json', JSON.stringify(employees, null, 2));
    console.log('Dump written to users_dump.json');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
