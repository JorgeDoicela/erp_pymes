import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const creds = await prisma.biometricCredential.findMany({
            include: { employee: true }
        });
        console.log(`Current biometric credentials in DB: ${creds.length}`);
        creds.forEach(c => {
            console.log(`- User: ${c.employee.email} / ID: ${c.employee.id}`);
            console.log(`  CredID: ${c.credentialId}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
