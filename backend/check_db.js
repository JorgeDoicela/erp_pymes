import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function check() {
    const credentials = await prisma.biometricCredential.findMany({
        include: { employee: true }
    });

    let output = `Total Biometric Credentials: ${credentials.length}\n`;
    credentials.forEach(c => {
        output += `CREDENTIAL: ${JSON.stringify(c, null, 2)}\n`;
    });

    const employees = await prisma.employee.findMany();
    output += `\nTotal Employees: ${employees.length}\n`;
    employees.forEach(e => {
        output += `EMPLOYEE: ${e.email} (ID: ${e.id})\n`;
    });

    fs.writeFileSync('db_dump.txt', output);
    console.log('Dump completed to db_dump.txt');
}

check().finally(() => prisma.$disconnect());
