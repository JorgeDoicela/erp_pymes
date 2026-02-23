import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const creds = await prisma.biometricCredential.findMany();
        console.log(`Total credentials: ${creds.length}`);
        creds.forEach(c => {
            console.log(JSON.stringify(c, null, 2));
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
