import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const creds = await prisma.biometricCredential.findMany({
            include: { employee: true }
        });
        console.log(`Found ${creds.length} credentials:`);
        creds.forEach(c => {
            console.log(`- DB_ID: ${c.id}`);
            console.log(`  CredentialID: ${c.credentialId}`);
            console.log(`  User: ${c.employee.email} (${c.employeeId})`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
